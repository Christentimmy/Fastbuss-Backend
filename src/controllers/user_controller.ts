
import { Request, Response } from "express";
import { User } from "../models/user_model";
import { IUser } from "../types/user_types";
import { uploadToCloudinary } from "../middlewares/upload_middleware";


export const userController = {

    uploadProfilePicture: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            if (!userId) {
                res.status(400).json({ message: "User ID is required" });
                return;
            }
            if (!req.file) {
                res.status(400).json({ message: "Profile picture is required" });
                return;
            }
            const result = await uploadToCloudinary(req.file!, "profile_pictures") as { secure_url?: string, url?: string };;
            if (!result) {
                res.status(400).json({ message: "Failed to upload profile picture" });
                return;
            }
            const user = await User.findById(userId);
            if (!user) {
                res.status(400).json({ message: "User not found" });
                return;
            }
            user.profilePicture = result.secure_url ?? result.url!;
            await user.save();
            res.json({ message: "Profile picture uploaded successfully" });
        } catch (error) {
            console.error("❌ Error in updateProfile:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};


