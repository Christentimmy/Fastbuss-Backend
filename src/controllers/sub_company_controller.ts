import { Bus } from "../models/bus_model";
import { Request, Response } from "express";
import { User } from "../models/user_model";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import { Route } from "../models/route_model";
import { SubCompany } from "../models/sub_company_model"
import { sendEmail } from "../services/email_service";
import sendPushNotification from "../config/onesignal";
import Trip from "../models/trip_model";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { IUser } from "../types/user_types";
import mongoose from "mongoose";
import { StaffOperation } from "../models/staff_operation_model";



export const subCompanyController = {

    // ==================== STAFF MANAGEMENT ====================
    createStaff: async (req: Request, res: Response) => {
        try {
            const { name, email, password, role } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!name || !email || !password || !role) {
                res.status(400).json({ message: "All fields are required" });
                return;
            }

            if (role.toLowerCase() !== "staff" && role.toLowerCase() !== "sub_admin") {
                res.status(400).json({ message: "Invalid role" });
                return;
            }

            const user = await User.findOne({ email });
            if (user) {
                res.status(400).json({ message: "user with this email already exists" });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name,
                email,
                password: hashedPassword,
                role: role,
                subCompanyId,
                status: "active",
                is_email_verified: true,
            });

            res.status(201).json({ message: "Staff admin created successfully" });
        } catch (error) {
            console.error("Error creating sub admin:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    listAllStaff: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            const staff = await User.find({ role: "staff", subCompanyId }).select("name status role email");
            res.status(200).json({ message: "All staff fetched successfully", data: staff });
        } catch (error) {
            console.error("Error listing all staff:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateStaff: async (req: Request, res: Response) => {   
        try {
            const { staffId } = req.params;
            const { name, email, password } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!name && !email && !password) {
                res.status(400).json({ message: "No changes to update" });
                return;
            }

            if (!staffId) {
                res.status(400).json({ message: "Staff ID is required" });
                return;
            }

            const staff = await User.findOne({ _id: staffId, role: "staff", subCompanyId });
            if (!staff) {
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            if (name) staff.name = name;
            if (email) staff.email = email;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                staff.password = hashedPassword;
            }

            await staff.save();

            res.status(200).json({ message: "Staff updated successfully", staff });
        } catch (error) {
            console.error("Error updating staff:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteStaff: async (req: Request, res: Response) => {
        try {
            const { staffId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!staffId) {
                res.status(400).json({ message: "Staff ID is required" });
                return;
            }

            const staff = await User.deleteOne({ _id: staffId, role: "staff", subCompanyId });
            if (!staff) {
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            res.status(200).json({ message: "Staff deleted successfully" });
        } catch (error) {
            console.error("Error deleting staff:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    blockStaff: async (req: Request, res: Response) => {
        try {
            const { staffId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!staffId) {
                res.status(400).json({ message: "Staff ID is required" });
                return;
            }

            const staff = await User.findOne({ _id: staffId, role: "staff", subCompanyId });
            if (!staff) {
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            staff.status = "blocked";
            await staff.save();

            res.status(200).json({ message: "Staff blocked successfully" });
        } catch (error) {
            console.error("Error blocking staff:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    unblockStaff: async (req: Request, res: Response) => {
        try {
            const { staffId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!staffId) {
                res.status(400).json({ message: "Staff ID is required" });
                return;
            }

            const staff = await User.findOne({ _id: staffId, role: "staff", subCompanyId });
            if (!staff) {
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            staff.status = "active";
            await staff.save();

            res.status(200).json({ message: "Staff unblocked successfully" });

        } catch (error) {
            console.error("Error unblocking staff:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    staffDetails: async (req: Request, res: Response) => {
        try {
            const { staffId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!staffId) {
                res.status(400).json({ message: "Staff ID is required" });
                return;
            }

            const staff = await User.findOne({ _id: staffId, subCompanyId }).select("-password");
            if (!staff) {
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            res.status(200).json({ message: "Staff details fetched successfully", staff });
        } catch (error) {
            console.error("❌ Error fetching staff details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    staffAnalysis: async (req: Request, res: Response) => {
        const { staffId } = req.params;
        if (!staffId) {
            res.status(400).json({ message: "Staff ID is required" });
            return;
        }
        const subCompanyId = res.locals.user.subCompanyId;

        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ message: 'Invalid staff ID' });
        }

        try {
            const [staff ,operations] = await Promise.all([
                User.findOne({ _id: staffId, subCompanyId }).select("-password"),
                StaffOperation.find({ staffId: staffId, subCompanyId: subCompanyId })
            ]);

            if (!staff) {       
                res.status(404).json({ message: "Staff not found" });
                return;
            }

            if (!operations) {
                res.status(404).json({ message: "No operations found" });
                return;
            }

            const summary = {
                totalOperations: operations.length,
                operationsByType: {
                    create: 0,
                    update: 0,
                    delete: 0,
                    block: 0,
                    unblock: 0
                },
                recentChanges: operations
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .slice(0, 10) // last 10 actions
                    .map(op => ({
                        date: op.timestamp,
                        operationType: op.operationType,
                        targetUserId: op.targetUserId,
                        changes: op.changes
                    }))
            };

            operations.forEach(op => {
                summary.operationsByType[op.operationType]++;
            });

            res.status(200).json({ message: "Staff activity summary fetched successfully", data: {staff, summary} });
        } catch (error) {
            console.error('Error fetching staff activity summary:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },


    // ==================== COMPANY PROFILE MANAGEMENT ====================
    updateCompanyProfile: async (req: Request, res: Response) => {
        try {
            const { companyName, contactEmail, contactPhone, description } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!companyName && !contactEmail && !contactPhone && !description && !req.file) {
                res.status(400).json({ message: "No changes to update" });
                return;
            }

            const subCompany = await SubCompany.findOne({ _id: subCompanyId });
            if (!subCompany) {
                res.status(404).json({ message: "SubCompany not found" });
                return;
            }

            if (req.file) {
                const result = await uploadToCloudinary(req.file, "logo") as { secure_url?: string, url?: string };
                if (!result) {
                    res.status(400).json({ message: "Failed to upload logo" });
                    return;
                }
                subCompany.logo = result.secure_url ?? result.url!;
            }

            if (companyName) subCompany.companyName = companyName;
            if (contactEmail) subCompany.contactEmail = contactEmail;
            if (contactPhone) subCompany.contactPhone = contactPhone;
            if (description) subCompany.description = description;

            await subCompany.save();

            res.status(200).json({ message: "Company profile updated successfully", subCompany });

        } catch (error) {
            console.error("Error updating company profile:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getCompanyProfile: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            const subCompany = await SubCompany.findOne({ _id: subCompanyId });
            if (!subCompany) {
                res.status(404).json({ message: "SubCompany not found" });
                return;
            }
            res.status(200).json({ message: "Company profile fetched successfully", subCompany });
        } catch (error) {
            console.error("Error fetching company profile:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // ==================== BUS MANAGEMENT ====================
    createBus: async (req: Request, res: Response) => {
        try {
            const { name, plateNumber, capacity, type } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!name || !plateNumber || !capacity || !type) {
                res.status(400).json({ message: "All fields are required." });
                return;
            }

            if (!subCompanyId) {
                res.status(400).json({ message: "No subCompany ID found for this user." });
                return;
            }

            const existingBus = await Bus.findOne({ $or: [{ plateNumber }, { name }] });
            if (existingBus) {
                if (existingBus.plateNumber === plateNumber) {
                    return res.status(409).json({ message: "Bus with this plate number already exists." });
                }
                if (existingBus.name === name) {
                    return res.status(409).json({ message: "Bus with this name already exists." });
                }
            }


            await Bus.create({
                name,
                plateNumber,
                capacity,
                type,
                subCompany: subCompanyId,
            });

            res.status(201).json({ message: "Bus created successfully" });
        } catch (error) {
            console.error("Create bus error:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    },

    getMyBuses: async (_req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            console.log(subCompanyId);

            const buses = await Bus.find({ subCompany: subCompanyId })
                .select("name status currentLocation createdAt updatedAt")
                .sort({ createdAt: -1 });
            res.status(200).json({ data: buses });
        } catch (error) {
            console.error("Fetch buses error:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    },

    deactivateBus: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOne({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });
            if (bus.status === "blocked") return res.status(200).json({ message: "Bus is already blocked" });

            bus.status = "blocked";
            await bus.save();

            res.status(200).json({ message: "Bus deactivated successfully" });
        } catch (error) {
            console.error("Error deactivating bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    activateBus: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOne({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });
            if (bus.status === "inactive") return res.status(400).json({ message: "Bus is already inactive" });

            bus.status = "inactive";
            await bus.save();

            res.status(200).json({ message: "Bus activated successfully" });
        } catch (error) {
            console.error("Error activating bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    busMaintenance: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOne({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });
            if (bus.status === "maintenance") return res.status(400).json({ message: "Bus is already in maintenance" });

            bus.status = "maintenance";
            await bus.save();

            res.status(200).json({ message: "Bus put in maintenance successfully" });
        } catch (error) {
            console.error("Error deactivating bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    busBackFromMaintenance: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOne({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });
            if (bus.status === "inactive") return res.status(400).json({ message: "Bus is already inactive" });

            bus.status = "inactive";
            await bus.save();

            res.status(200).json({ message: "Bus back from maintenance successfully" });

        } catch (error) {
            console.error("Error deactivating bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAvailableBuses: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            const buses = await Bus.find({
                subCompany: subCompanyId,
                driver: { $exists: true, $ne: null },
                status: "inactive"
            });

            res.status(200).json({ message: "Available buses fetched", data: buses });
        } catch (error) {
            console.error("Error fetching available buses:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllActiveTrips: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            const trips = await Trip.find({
                subCompanyId,
                status: "ongoing"
            });

            res.status(200).json({ message: "All active trips fetched", data: trips });

        } catch (error) {
            console.error("Error fetching all active trips:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteBus: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOneAndDelete({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });

            res.status(200).json({ message: "Bus deleted successfully" });

        } catch (error) {
            console.error("Error deleting bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    noDriverBuses: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            if (!subCompanyId) {
                res.status(400).json({ message: "subcompanyId is required" });
                return;
            }

            const buses = await Bus.find({ subCompany: subCompanyId, driver: { $eq: null } });
            res.status(200).json({ message: "No driver buses fetched", data: buses });
        } catch (error) {
            console.error("Error fetching no driver buses:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    busDetails: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const bus = await Bus.findOne({ _id: busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });

            const driver = await User.findOne({ _id: bus.driver, subCompanyId });

            const response = {
                _id: bus._id,
                name: bus.name,
                plateNumber: bus.plateNumber,
                capacity: bus.capacity,
                type: bus.type,
                status: bus.status,
                location: bus.currentLocation,
                driver: driver ? {
                    _id: driver._id,
                    name: driver.name,
                    email: driver.email,
                    phone: driver.phone,
                    status: driver.status,
                } : null
            };

            res.status(200).json({ message: "Bus details fetched successfully", data: response });
        } catch (error) {
            console.error("Error fetching bus details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // ==================== DRIVER MANAGEMENT ====================
    createDriver: async (req: Request, res: Response) => {
        try {
            const { name, email, phone, password } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!name || !email || !phone || !password) {
                res.status(400).json({ message: "All fields are required." });
                return;
            }


            const existingDriver = await User.findOne({ email });
            if (existingDriver) {
                res.status(409).json({ message: "User with this email already exists." });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await User.create({
                name,
                email,
                phone,
                password: hashedPassword,
                role: "driver",
                subCompanyId,
                is_email_verified: true,
            });

            res.status(201).json({ message: "Driver created successfully" });
        } catch (error) {
            console.error("createDriver error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getMyDrivers: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            if (!subCompanyId) {
                res.status(400).json({ message: "subcompanyId is required" });
                return;
            }

            const drivers = await User.find({ role: "driver", subCompanyId }).select("-password").sort({ createdAt: -1 });
            res.status(200).json({ data: drivers });
        } catch (error) {
            console.error("getMyDrivers error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateDriver: async (req: Request, res: Response) => {
        try {
            const driverId = req.params.driverId;

            if (!driverId) {
                res.status(400).json({ message: "Driver ID is required." });
                return;
            }

            const { name, phone, email } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            const driver = await User.findOne({ _id: driverId, role: "driver", subCompanyId });

            if (!driver) {
                res.status(404).json({ message: "Driver not found or access denied." });
                return;
            }

            if (name) driver.name = name;
            if (phone) driver.phone = phone;
            if (email) driver.email = email;

            await driver.save();

            res.status(200).json({ message: "Driver updated successfully" });
        } catch (error) {
            console.error("updateDriver error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    banDriver: async (req: Request, res: Response) => {
        try {
            const { driverId } = req.params;

            if (!driverId) {
                res.status(400).json({ message: "Driver ID is required." });
                return;
            }

            const subCompanyId = res.locals.user.subCompanyId;

            const driver = await User.findOne({ _id: driverId, role: "driver", subCompanyId });

            if (!driver) {
                res.status(404).json({ message: "Driver not found or access denied." });
                return;
            }

            driver.status = "banned";
            await driver.save();

            res.status(200).json({ message: "Driver banned successfully." });
            sendEmail(driver.email, "FastBuss", driver.name, "You have been banned from using FastBuss. Please contact support for more information.");
        } catch (error) {
            console.error("banDriver error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    unbanDriver: async (req: Request, res: Response) => {
        try {
            const { driverId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            const driver = await User.findOne({ _id: driverId, role: "driver", subCompanyId });

            if (!driver) {
                res.status(404).json({ message: "Driver not found or access denied." });
                return;
            }

            driver.status = "inactive";
            await driver.save();

            await sendEmail(driver.email, "FastBuss", driver.name, "You have been unbanned from using FastBuss. Please contact support for more information.");

            res.status(200).json({ message: "Driver unbanned successfully." });
        } catch (error) {
            console.error("unbanDriver error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteDriver: async (req: Request, res: Response) => {
        try {
            const { driverId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            const driver = await User.findOneAndDelete({ _id: driverId, role: "driver", subCompanyId });

            if (!driver) {
                res.status(404).json({ message: "Driver not found or already deleted." });
                return;
            }

            if (driver.assignedBus) {
                const bus = await Bus.findOne({ _id: driver.assignedBus, subCompany: subCompanyId });
                if (!bus) return res.status(404).json({ message: "Bus not found" });
                bus.driver = null;
                await bus!.save();
            }

            res.status(200).json({ message: "Driver deleted successfully." });
        } catch (error) {
            console.error("deleteDriver error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    assignDriverToBus: async (req: Request, res: Response) => {
        try {
            const { busId, driverId } = req.body;

            // Input validation
            if (!busId || !driverId) {
                return res.status(400).json({ message: "Bus ID and driver ID are required." });
            }

            const subCompanyId = res.locals.user.subCompanyId.toString();

            // Use Promise.all to run queries in parallel instead of sequentially
            const [bus, driver, isAssigned] = await Promise.all([
                Bus.findOne({ _id: busId, subCompany: subCompanyId }).lean(),
                User.findOne({ _id: driverId, role: 'driver', subCompanyId }).lean(),
                Bus.findOne({ driver: driverId }).lean()
            ]);

            // Validation checks
            if (!bus) return res.status(404).json({ message: "Bus not found." });
            if (!driver) return res.status(404).json({ message: "Driver not found." });
            if (isAssigned) return res.status(400).json({ message: "Driver already assigned to a bus." });

            // Perform updates in parallel
            await Promise.all([
                Bus.updateOne({ _id: busId }, { driver: driverId }),
                User.updateOne({ _id: driverId }, { assignedBus: busId })
            ]);

            // Prepare email in the background - don't wait for it
            const message = `You have been assigned to a new bus:<br>Name: ${bus.name} <br>Plate Number: ${bus.plateNumber}<br>Please contact support if you have any questions.`;

            // Send the success response immediately
            res.status(200).json({
                message: "Driver assigned to bus successfully.",
                data: { ...bus, driver: driverId }
            });

            // Send email without awaiting (non-blocking)
            sendEmail(driver.email, "FastBuss", driver.name, message)
                .catch(err => console.error("Failed to send assignment email:", err));

        } catch (error) {
            console.error("assignDriverToBus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    unassignDriverFromBus: async (req: Request, res: Response) => {
        try {
            const { busId, driverId } = req.body;
            if (!busId && !driverId) {
                res.status(400).json({ message: "Bus ID or driver ID are required." });
                return;
            }

            const subCompanyId = res.locals.user.subCompanyId.toString();
            const query = driverId ? { driver: driverId, subCompany: subCompanyId } : { _id: busId, subCompany: subCompanyId };

            const bus = await Bus.findOne(query);
            if (!bus) return res.status(404).json({ message: "Bus not found." });

            const driver = await User.findOne({ _id: bus.driver, subCompanyId });
            if (!driver) return res.status(404).json({ message: "Driver not found." });

            bus.driver = null;
            driver.assignedBus = null;
            driver.status = "inactive";
            await bus.save();
            await driver.save();

            const message = `You have been unassigned from the bus:<br>Name: ${bus.name} <br>Plate Number: ${bus.plateNumber}<br>Please contact support if you have any questions.`;
            await sendEmail(driver.email, "FastBuss", driver.name, message);

            res.status(200).json({ message: "Driver unassigned from bus." });
        } catch (error) {
            console.error("unassignDriverFromBus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAvailableDrivers: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            const drivers = await User.find({
                role: "driver",
                subCompanyId,
                status: "inactive",
                assignedBus: { $exists: true, $ne: null },
            }).select("name email");

            res.status(200).json({ message: "Available drivers fetched", data: drivers });
        } catch (error) {
            console.error("Error fetching available drivers:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllDriversWithNoBus: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            const drivers = await User.find({
                role: "driver",
                subCompanyId,
                assignedBus: null
            }).select("-password");

            if (drivers.length === 0) return res.status(404).json({ message: "No drivers with no bus found", data: drivers });

            res.status(200).json({ message: "Drivers with no bus fetched", data: drivers });
        } catch (error) {
            console.error("Error fetching drivers with no bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getDriverSchedules: async (req: Request, res: Response) => {
        try {
            const driverId = req.params.driverId;

            if (!driverId) {
                res.status(400).json({ message: "Driver ID is required" });
                return;
            }

            const subCompanyId = res.locals.user.subCompanyId;

            const driver = await User.findOne({ _id: driverId, role: "driver", subCompanyId });
            if (!driver) return res.status(404).json({ message: "Driver not found" });

            const schedules = await Route.find({ driverId: driver._id });

            res.status(200).json({ message: "Driver schedules fetched successfully", data: schedules });

        } catch (error) {
            console.error("Error fetching driver schedules:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTripHistoryByDriver: async (req: Request, res: Response) => {
        try {
            const { driverId } = req.params;
            if (!driverId) {
                res.status(400).json({ message: "Driver ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const trips = await Trip.find({ driverId, subCompanyId })
                .select("routeId busId driverId")
                .populate<{ routeId: IRoute }>("routeId")
                .populate<{ busId: IBus }>("busId")
                .populate<{ driverId: IUser }>("driverId");

            const response = trips.map(trip => ({
                _id: trip._id,
                busName: trip.busId.name,
                busPlateNumber: trip.busId.plateNumber,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                distance: trip.routeId.distance,
                price: trip.routeId.price,
                status: trip.status,
                routeName: trip.routeId.routeName,
                origin: trip.routeId.origin,
                destination: trip.routeId.destination
            }));

            res.status(200).json({ message: "Trip history fetched successfully", data: response });
        } catch (error) {
            console.error("Error fetching trip history by driver:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // ==================== ROUTE MANAGEMENT ====================
    createRoute: async (req: Request, res: Response) => {
        try {
            const { routeName, origin, destination, distance, price, waypoints } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!routeName || !origin || !destination || !price || !distance) {
                return res.status(400).json({ message: "Route name, origin, destination, distance, and price are required" });
            }

            const existingRoute = await Route.findOne({
                routeName,
                subCompanyId
            });

            if (existingRoute) {
                return res.status(400).json({ message: "Route with this name already exists." });
            }

            const newRoute = await Route.create({
                routeName,
                origin,
                destination,
                distance,
                price,
                subCompanyId,
                status: "active"
            });

            res.status(201).json({
                message: "Route created successfully",
                route: {
                    id: newRoute._id,
                    routeName,
                    origin,
                    destination,
                    price,
                    distance,
                    waypoints,
                }
            });
        } catch (error) {
            console.error("Error creating route:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    createRouteSchedule: async (req: Request, res: Response) => {
        try {
            const { routeId, driverId, departureTime, arrivalTime } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!routeId || !driverId || !departureTime || !arrivalTime) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const [route, driver] = await Promise.all([
                Route.findOne({ _id: routeId, subCompanyId }),
                User.findOne({ _id: driverId, role: 'driver', subCompanyId })
            ]);

            if (!route) {
                return res.status(404).json({ message: "Route not found" });
            }
            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }
            if (driver.status === "active") {
                return res.status(400).json({ message: "Driver is already on a trip" });
            }

            const bus = await Bus.findOne({ _id: driver.assignedBus, subCompany: subCompanyId });
            if (!bus) {
                return res.status(404).json({ message: "Bus not found" });
            }

            if (bus.status === "active") {
                return res.status(400).json({ message: "Bus is already on a trip" });
            }

            if (bus.status === "maintenance") return res.status(400).json({ message: "Bus Assigned To Driver Is Under Maintenance" });


            const busConflict = await Trip.findOne({
                busId: bus._id,
                $or: [
                    { departureTime: { $lte: new Date(arrivalTime), $gte: new Date(departureTime) } },
                    { arrivalTime: { $lte: new Date(arrivalTime), $gte: new Date(departureTime) } }
                ]
            });
            if (busConflict) {
                return res.status(400).json({ message: "Bus is already assigned to another route during this time" });
            }

            const seats = Array.from({ length: bus.capacity }, (_, i) => ({
                seatNumber: (i + 1).toString(),
                status: 'available'
            }));

            const schedule = await Trip.create({
                routeId: route._id,
                busId: bus._id,
                driverId: driver._id,
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                distance: route.distance,
                price: route.price,
                subCompanyId,
                status: "pending",
                seats
            });

            bus.status = "active";
            await bus.save();

            driver.status = "active";
            await driver.save();

            res.status(201).json({
                message: "Route schedule created successfully",
                schedule
            });


            const message = `You have been assigned to a new route:<br>Route Name: ${route.routeName} <br>Origin: ${route.origin} <br>Destination: ${route.destination} <br>Distance: ${route.distance}<br>Departure Time: ${departureTime} <br>Arrival Time: ${arrivalTime} <br>Please contact support if you have any questions.`;
            sendEmail(driver.email, "FastBuss", driver.name, message);

            if (driver.one_signal_id) {
                await sendPushNotification(driver.one_signal_id, "New Route", message);
            }

        } catch (error) {
            console.error("Error creating route schedule:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllRoutesBySubCompany: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;

            const routes = await Route.find({ subCompanyId });

            res.status(200).json({ message: "Routes fetched successfully", data: routes });
        } catch (error) {
            console.error("Error fetching routes:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateRoute: async (req: Request, res: Response) => {
        try {
            const { routeId } = req.params;

            if (!routeId) {
                return res.status(400).json({ message: "Route ID is required" });
            }

            const { routeName, origin, destination, distance, price, status } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            const route = await Route.findOne({ _id: routeId, subCompanyId });
            if (!route) {
                return res.status(404).json({ message: "Route not found" });
            }

            if (routeName && routeName !== route.routeName) {
                const existingRoute = await Route.findOne({
                    routeName,
                    subCompanyId,
                    _id: { $ne: routeId }
                });

                if (existingRoute) {
                    return res.status(400).json({ message: "Route with this name already exists" });
                }
            }

            if (routeName) route.routeName = routeName;
            if (origin) route.origin = origin;
            if (destination) route.destination = destination;
            if (distance !== undefined) route.distance = distance;
            if (price !== undefined) route.price = price;
            if (status) route.status = status;

            await route.save();
            return res.status(200).json({ message: "Route updated successfully", route: route });
        } catch (error) {
            console.error("Error updating route:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteRoute: async (req: Request, res: Response) => {
        try {
            const { routeId } = req.params;
            if (!routeId) {
                res.status(400).json({ message: "Route ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const route = await Route.deleteOne({ _id: routeId, subCompanyId });
            if (!route) return res.status(404).json({ message: "Route not found" });

            res.status(200).json({ message: "Route deleted successfully" });
        } catch (error) {
            console.error("Error deleting route:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deactivateRoute: async (req: Request, res: Response) => {
        try {
            const { routeId } = req.params;
            if (!routeId) {
                res.status(400).json({ message: "Route ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const route = await Route.findOne({ _id: routeId, subCompanyId });
            if (!route) return res.status(404).json({ message: "Route not found" });
            if (route.status === "inactive") return res.status(400).json({ message: "Route is already inactive" });

            route.status = "inactive";
            await route.save();

            res.status(200).json({ message: "Route deactivated successfully" });

        } catch (error) {
            console.error("Error deactivating route:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    activateRoute: async (req: Request, res: Response) => {
        try {
            const { routeId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            const route = await Route.findOne({ _id: routeId, subCompanyId });
            if (!route) return res.status(404).json({ message: "Route not found" });
            if (route.status === "active") return res.status(400).json({ message: "Route is already active" });

            route.status = "active";
            await route.save();

            res.status(200).json({ message: "Route activated successfully" });

        } catch (error) {
            console.error("Error activating route:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    changeBusInSchedule: async (req: Request, res: Response) => {
        try {
            const { scheduleId, newBusId } = req.body;
            if (!scheduleId || !newBusId) {
                res.status(400).json({ message: "Schedule ID and new bus ID are required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const schedule = await Trip.findOne({ _id: scheduleId, subCompanyId });
            if (!schedule) return res.status(404).json({ message: "Schedule not found" });

            const newBus = await Bus.findOne({ _id: newBusId, subCompany: subCompanyId });
            if (!newBus) return res.status(404).json({ message: "New bus not found" });
            if (newBus.status === "active") return res.status(400).json({ message: "New bus you want to assign is on a trip" });
            if (newBus.driver === null) return res.status(400).json({ message: "New bus has no driver assigned" });

            const newDriver = await User.findOne({ _id: newBus.driver, role: "driver", subCompanyId });
            if (!newDriver) return res.status(404).json({ message: "New driver not found" });

            const busConflict = await Trip.findOne({
                busId: newBusId,
                _id: { $ne: scheduleId },
                $or: [
                    { departureTime: { $lte: schedule.arrivalTime, $gte: schedule.departureTime } },
                    { arrivalTime: { $lte: schedule.arrivalTime, $gte: schedule.departureTime } }
                ]
            });

            if (busConflict) return res.status(400).json({ message: "New bus already assigned to another route during this time" });

            schedule.busId = newBusId;
            schedule.driverId = newBus.driver;
            await schedule.save();

            const message = `You have been reassigned to an urgent bus:<br>Name: ${newBus.name} <br>Plate Number: ${newBus.plateNumber}<br>Please contact support if you have any questions.`;
            await sendEmail(newDriver.email, "FastBuss", newDriver.name, message);

            if (newDriver.one_signal_id) {
                await sendPushNotification(newDriver.one_signal_id, "New Bus", message);
            }

            res.status(200).json({ message: "Bus reassigned successfully" });
        } catch (error) {
            console.error("Error rescheduling bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // ==================== TRIP MANAGEMENT ====================
    getTripHistory: async (req: Request, res: Response) => {
        try {
            const { status, startDate, endDate } = req.query;
            const subCompanyId = res.locals.user.subCompanyId;

            const query: any = { subCompanyId };
            if (status) {
                query.status = status;
            }
            if (startDate && endDate) {
                const start = new Date(startDate as string);
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);

                query.departureTime = {
                    $gte: start,
                    $lte: end
                };
            }
            const trips = await Trip.find(query)
                .populate<{ routeId: IRoute, driverId: IUser, busId: IBus }>("routeId driverId busId");
            const response = trips.map(trip => ({
                _id: trip._id,
                routeName: trip.routeId.routeName,
                busName: trip.busId.name,
                busId: trip.busId._id,
                driverName: trip?.driverId?.name || null,
                departureTime: trip.departureTime,
                origin: trip.routeId.origin,
                destination: trip.routeId.destination,
                arrivalTime: trip.arrivalTime,
                status: trip.status,
                subCompanyId: trip.subCompanyId,
                createdAt: trip.createdAt,
                updatedAt: trip.updatedAt
            }));
            res.status(200).json({ message: "Trip history fetched successfully", data: response });
        } catch (error) {
            console.error("Error fetching trip history:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTripDetails: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;
            if (!tripId) {
                res.status(400).json({ message: "Trip ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const trip = await Trip.findOne({ _id: tripId, subCompanyId }).populate<{ routeId: IRoute, driverId: IUser, busId: IBus }>("routeId driverId busId");
            if (!trip) return res.status(404).json({ message: "Trip not found" });
            const response = {
                tripId: trip._id,
                status: trip.status,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                route: {
                    name: trip.routeId.routeName,
                    origin: trip.routeId.origin,
                    destination: trip.routeId.destination,
                    distance: trip.routeId.distance,
                    price: trip.routeId.price
                },
                bus: {
                    name: trip.busId.name,
                    plateNumber: trip.busId.plateNumber,
                    type: trip.busId.type,
                    capacity: trip.busId.capacity
                },
                driver: {
                    name: trip.driverId.name,
                    phone: trip.driverId.phone
                }
            };

            res.status(200).json({ message: "Trip details fetched successfully", data: response });
        } catch (error) {
            console.error("Error fetching trip details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    cancelTrip: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;
            if (!tripId) {
                res.status(400).json({ message: "Trip ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const trip = await Trip.findOne({ _id: tripId, subCompanyId }).populate<{ routeId: IRoute }>("routeId");
            if (!trip) return res.status(404).json({ message: "Trip not found" });

            if (trip.status === "pending") {
                trip.status = "cancelled";
                await trip.save();
            }

            const bus = await Bus.findOne({ _id: trip.busId, subCompany: subCompanyId });
            if (!bus) return res.status(404).json({ message: "Bus not found" });

            bus.status = "inactive";
            await bus.save();

            const driver = await User.findOne({ _id: trip.driverId, role: "driver", subCompanyId });
            if (!driver) return res.status(404).json({ message: "Driver not found" });

            driver.status = "inactive";
            await driver.save();

            res.status(200).json({ message: "Trip cancelled successfully" });

            const message = `Your trip has been cancelled:<br>Route: ${trip.routeId.routeName} <br>Origin: ${trip.routeId.origin} <br>Destination: ${trip.routeId.destination} <br>Departure Time: ${trip.departureTime} <br>Arrival Time: ${trip.arrivalTime} <br>Please contact support if you have any questions.`;
            await sendEmail(driver.email, "FastBuss", driver.name, message);

            if (driver.one_signal_id) {
                await sendPushNotification(driver.one_signal_id, "Trip Cancelled", message);
            }

        } catch (error) {
            console.error("Error canceling trip:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTripHistoryByBus: async (req: Request, res: Response) => {
        try {
            const { busId } = req.params;
            if (!busId) {
                res.status(400).json({ message: "Bus ID is required" });
                return;
            }
            const subCompanyId = res.locals.user.subCompanyId;

            const trips = await Trip.find({ busId, subCompanyId }).populate<{ routeId: IRoute }>("routeId");
            const response = trips.map(trip => ({
                _id: trip._id,
                route: trip.routeId,
                busId: trip.busId,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                status: trip.status,
                subCompanyId: trip.subCompanyId,
                createdAt: trip.createdAt,
                updatedAt: trip.updatedAt,
                driverId: trip.driverId
            }));
            res.status(200).json({ message: "Trip history fetched successfully", data: response });
        } catch (error) {
            console.error("Error fetching trip history by bus:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTripHistoryBySubCompany: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            const trips = await Trip.find({ subCompanyId }).populate<{ routeId: IRoute }>("routeId");
            res.status(200).json({ message: "Trip history fetched successfully", data: trips });
        } catch (error) {
            console.error("Error fetching trip history by sub company:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateTrip: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            const { tripId, departureTime, arrivalTime, driverId } = req.body;

            if (!tripId) return res.status(400).json({ message: "Trip ID is required" });
            if (!departureTime && !arrivalTime && !driverId) {
                return res.status(400).json({ message: "At least one field is required" });
            }

            const trip = await Trip.findOne({ _id: tripId, subCompanyId }).populate<{ routeId: IRoute }>("routeId");
            if (!trip) return res.status(404).json({ message: "Trip not found" });

            const originalDriver = await User.findOne({ _id: trip.driverId, role: "driver", subCompanyId });
            if (!originalDriver) return res.status(404).json({ message: "Original driver not found" });

            // Update fields if provided
            if (departureTime) trip.departureTime = departureTime;
            if (arrivalTime) trip.arrivalTime = arrivalTime;

            let newDriver: IUser | null = null;

            if (driverId && driverId !== trip.driverId.toString()) {
                // Deactivate the original driver
                originalDriver.status = "inactive";
                await originalDriver.save();

                // Activate and assign new driver
                newDriver = await User.findOne({ _id: driverId, role: "driver", subCompanyId });
                if (!newDriver) return res.status(404).json({ message: "New driver not found" });

                newDriver.status = "active";
                await newDriver.save();

                trip.driverId = new mongoose.Types.ObjectId(driverId as string);
            }

            await trip.save();

            // Notify the original driver
            const originalMessage = `You have been removed from a trip:<br>Route: ${trip.routeId.routeName}<br>Origin: ${trip.routeId.origin}<br>Destination: ${trip.routeId.destination}<br>Please contact support for more information.`;

            await sendEmail(originalDriver.email, "FastBuss", originalDriver.name, originalMessage);
            if (originalDriver.one_signal_id) {
                await sendPushNotification(originalDriver.one_signal_id, "Trip Unassigned", originalMessage);
            }

            // Notify the new driver, if reassigned
            if (newDriver) {
                const newMessage = `You have been assigned to a new trip:<br>Route: ${trip.routeId.routeName}<br>Origin: ${trip.routeId.origin}<br>Destination: ${trip.routeId.destination}<br>Departure Time: ${trip.departureTime}<br>Arrival Time: ${trip.arrivalTime}`;
                await sendEmail(newDriver.email, "FastBuss", newDriver.name, newMessage);
                if (newDriver.one_signal_id) {
                    await sendPushNotification(newDriver.one_signal_id, "New Trip Assignment", newMessage);
                }
            }

            res.status(200).json({ message: "Trip updated successfully", data: trip });

        } catch (error) {
            console.error("Error updating trip:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllSchedules: async (req: Request, res: Response) => {
        try {
            const subCompanyId = res.locals.user.subCompanyId;
            const { status, startDate, endDate } = req.query;

            const query: any = { subCompanyId };

            if (status) {
                query.status = status;
            }

            if (startDate && endDate) {
                query.departureTime = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            }

            const schedules = await Trip.find(query)
                .populate('routeId')
                .populate('busId')
                .populate('driverId')
                .sort({ departureTime: 1 });

            const response = schedules.map(schedule => ({
                _id: schedule._id,
                route: schedule.routeId,
                bus: schedule.busId,
                driver: schedule.driverId,
                departureTime: schedule.departureTime,
                arrivalTime: schedule.arrivalTime,
                status: schedule.status,
                subCompanyId: schedule.subCompanyId,
                createdAt: schedule.createdAt,
                updatedAt: schedule.updatedAt
            }));

            res.status(200).json({
                message: "Schedules fetched successfully",
                data: response
            });
        } catch (error) {
            console.error("Error fetching schedules:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    deleteSchedule: async (req: Request, res: Response) => {
        try {
            const { scheduleId } = req.params;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!scheduleId) {
                return res.status(400).json({ message: "Schedule ID is required" });
            }

            const schedule = await Trip.findOne({ _id: scheduleId, subCompanyId });
            if (!schedule) {
                return res.status(404).json({ message: "Schedule not found" });
            }

            // Notify driver about schedule deletion
            const driver = await User.findOne({ _id: schedule.driverId });
            if (driver) {
                const message = `Your schedule has been cancelled:<br>Departure Time: ${schedule.departureTime}<br>Arrival Time: ${schedule.arrivalTime}`;
                await sendEmail(driver.email, "Schedule Cancelled", driver.name, message);

                if (driver.one_signal_id) {
                    await sendPushNotification(driver.one_signal_id, "Schedule Cancelled", message);
                }
            }

            await Trip.deleteOne({ _id: scheduleId });

            res.status(200).json({
                message: "Schedule deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting schedule:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // ==================== NOTIFICATION MANAGEMENT ====================
    sendBulkNotification: async (req: Request, res: Response) => {
        try {
            const { title, message, recipients } = req.body;
            const subCompanyId = res.locals.user.subCompanyId;

            if (!title || !message || !recipients || !Array.isArray(recipients)) {
                return res.status(400).json({ message: "Title, message, and recipients array are required" });
            }

            const users = await User.find({
                _id: { $in: recipients },
                subCompanyId
            });

            const emailPromises = users.map(user =>
                sendEmail(user.email, title, user.name, message)
            );

            const pushNotificationPromises = users
                .filter(user => user.one_signal_id)
                .map(user =>
                    sendPushNotification(user.one_signal_id!, title, message)
                );

            await Promise.all([...emailPromises, ...pushNotificationPromises]);

            res.status(200).json({
                message: "Bulk notification sent successfully",
                data: {
                    totalRecipients: users.length,
                    emailsSent: emailPromises.length,
                    pushNotificationsSent: pushNotificationPromises.length
                }
            });
        } catch (error) {
            console.error("Error sending bulk notification:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};