import { Request, Response } from "express";
import { SubCompany } from "../models/sub_company_model";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import bcrypt from "bcryptjs";
import { User } from "../models/user_model";
import { Bus } from "../models/bus_model";

export const superAdminController = {

    createCompany: async (req: Request, res: Response) => {
        try {
            const { companyName, contactEmail, contactPhone, description, adminName, adminEmail, adminPassword } = req.body;

            if (!companyName || !contactEmail || !contactPhone || !description || !adminName || !adminEmail || !adminPassword) {
                res.status(400).json({ message: "All fields are required." });
                return;
            }

            if (!req.file) {
                res.status(400).json({ message: "Logo is required." });
                return;
            }

            const existing = await SubCompany.findOne({ companyName });
            if (existing) {
                res.status(409).json({ message: "SubCompany with this name already exists." });
                return;
            }

            const existingUser = await User.findOne({ email: adminEmail });
            if (existingUser) {
                res.status(409).json({ message: "Sub-admin email is already taken." });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const result = await uploadToCloudinary(req.file!, "sub_company_logos") as { secure_url?: string, url?: string };
            if (!result) {
                res.status(400).json({ message: "Failed to upload logo." });
                return;
            }

            const newCompany = await SubCompany.create({
                companyName,
                contactEmail,
                contactPhone,
                description,
                logo: result.secure_url ?? result.url!,
                createdBy: res.locals.userId,
            });

            await User.create({
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: "sub_admin",
                subCompanyId: newCompany._id,
                is_email_verified: true,
                status: "active",
            });

            res.status(201).json({ message: "SubCompany created successfully" });
        } catch (error) {
            console.error("SubCompany creation error:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    },

    list: async (_req: Request, res: Response) => {
        try {
            const companies = await SubCompany.find().sort({ createdAt: -1 });
            res.status(200).json({ data: companies });
        } catch (error) {
            console.error("Fetch SubCompanies error:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    },

    deleteCompany: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            if(!companyId) {
                res.status(400).json({ message: "Company ID is required" });
                return;
            }

            const company = await SubCompany.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            // Delete all associated users
            await User.deleteMany({ subCompanyId: companyId });
            
            // Delete all associated buses
            await Bus.deleteMany({ subCompany: companyId });

            // Delete the company
            await SubCompany.findByIdAndDelete(companyId);

            res.status(200).json({ message: "Company and all associated data deleted successfully" });
        } catch (error) {
            console.error("Delete company error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    suspendCompany: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            if(!companyId) {
                res.status(400).json({ message: "Company ID is required" });
                return;
            }

            const company = await SubCompany.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            // Update company status
            company.isActive = false;
            await company.save();

            // Update all users' status to blocked
            await User.updateMany(
                { subCompanyId: companyId },
                { status: "blocked" }
            );

            res.status(200).json({ message: "Company suspended successfully" });
        } catch (error) {
            console.error("Suspend company error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    activateCompany: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            if(!companyId) {
                res.status(400).json({ message: "Company ID is required" });
                return;
            }

            const company = await SubCompany.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            // Update company status
            company.isActive = true;
            await company.save();

            // Update all users' status to active
            await User.updateMany(
                { subCompanyId: companyId },
                { status: "inactive" }
            );

            res.status(200).json({ message: "Company activated successfully" });
        } catch (error) {
            console.error("Activate company error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateCompany: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;
            const { companyName, contactEmail, contactPhone, description } = req.body;

            if(!companyName && !contactEmail && !contactPhone && !description) {
                res.status(400).json({ message: "No updates provided" });
                return;
            }

            const company = await SubCompany.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            // Check if new company name is unique
            if (companyName && companyName !== company.companyName) {
                const existing = await SubCompany.findOne({ companyName });
                if (existing) {
                    return res.status(409).json({ message: "Company name already exists" });
                }
            }

            // Update company details
            company.companyName = companyName || company.companyName;
            company.contactEmail = contactEmail || company.contactEmail;
            company.contactPhone = contactPhone || company.contactPhone;
            company.description = description || company.description;

            // Update logo if provided
            if (req.file) {
                const result = await uploadToCloudinary(req.file, "sub_company_logos") as { secure_url?: string, url?: string };
                if (result) {
                    company.logo = result.secure_url ?? result.url!;
                }
            }

            await company.save();
            res.status(200).json({ message: "Company updated successfully", data: company });
        } catch (error) {
            console.error("Update company error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    viewCompanyDetails: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;

            if(!companyId) {
                res.status(400).json({ message: "Company ID is required" });
                return;
            }

            const company = await SubCompany.findById(companyId);
            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            // Get counts of associated data
            const staffCount = await User.countDocuments({ 
                subCompanyId: companyId,
                role: { $in: ['sub_admin', 'staff', 'driver'] }
            });
            
            const busCount = await Bus.countDocuments({ subCompany: companyId });
            
            const driverCount = await User.countDocuments({ 
                subCompanyId: companyId,
                role: 'driver'
            });

            // Get company details with counts
            const companyDetails = {
                ...company.toObject(),
                staffCount,
                busCount,
                driverCount
            };

            res.status(200).json({ data: companyDetails });
        } catch (error) {
            console.error("View company details error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};
