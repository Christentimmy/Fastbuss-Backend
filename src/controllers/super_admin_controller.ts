
import { Request, Response } from "express";
import { SubCompany } from "../models/sub_company_model";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import bcrypt from "bcryptjs";
import { User } from "../models/user_model";


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

};
