import { Request, Response } from "express";
import { User } from "../models/user_model";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import bcrypt from "bcryptjs";

export const userController = {
    // ==================== USER PROFILE ====================
    getProfile: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const user = await User.findById(userId)
                .select("-password")
                .populate("assignedBus");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ 
                message: "Profile fetched successfully",
                data: user 
            });
        } catch (error) {
            console.error("getProfile error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateProfile: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { name, phone } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (name) user.name = name;
            if (phone) user.phone = phone;

            if (req.file) {
                const result = await uploadToCloudinary(req.file, "profile_pictures") as { secure_url?: string, url?: string };
                if (result) {
                    user.profilePicture = result.secure_url ?? result.url!;
                }
            }

            await user.save();
            res.status(200).json({ 
                message: "Profile updated successfully",
                data: user 
            });
        } catch (error) {
            console.error("updateProfile error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    changePassword: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current password and new password are required" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;

            await user.save();
            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            console.error("changePassword error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== USER NOTIFICATIONS ====================
    updateNotificationToken: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { oneSignalId } = req.body;

            if (!oneSignalId) {
                return res.status(400).json({ message: "OneSignal ID is required" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.one_signal_id = oneSignalId;
            await user.save();

            res.status(200).json({ message: "Notification token updated successfully" });
        } catch (error) {
            console.error("updateNotificationToken error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== USER ACCOUNT ====================
    deleteAccount: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ message: "Password is required" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Password is incorrect" });
            }

            await User.findByIdAndDelete(userId);
            res.status(200).json({ message: "Account deleted successfully" });
        } catch (error) {
            console.error("deleteAccount error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
};


