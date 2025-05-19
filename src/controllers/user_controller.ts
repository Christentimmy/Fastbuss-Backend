import { Request, Response } from "express";
import { User } from "../models/user_model";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import bcrypt from "bcryptjs";
import Trip from "../models/trip_model";
import { escapeRegex } from "../utils/escape_regex";
import { Route } from "../models/route_model";
import { ITrip } from "../types/trip_types";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { IUser } from "../types/user_types";
import { ISubCompany } from "../types/sub_company_types";

export const userController = {
    // ==================== USER PROFILE ====================

    getStatus: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const user = await User.findById(userId).select("status email is_email_verified");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const response = {
                email: user.email,
                status: user.status,
                is_email_verified: user.is_email_verified,
            }

            res.status(200).json({
                message: "User status fetched successfully",
                data: response,
            });
        } catch (error) {
            console.error("getStatus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

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
    },

    bookTrip: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { tripId } = req.body;

            if (!tripId) {
                return res.status(400).json({ message: "Trip ID is required" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const trip = await Trip.findById(tripId);
            if (!trip || trip.status !== "pending") {
                return res.status(400).json({ message: "Trip is not available" });
            }

            const alreadyBooked = trip.seats.find(seat => seat.userId?.toString() === userId);
            if (alreadyBooked) {
                return res.status(400).json({ message: "You have already booked a seat on this trip" });
            }

            const updatedTrip = await Trip.findOneAndUpdate(
                {
                    _id: tripId,
                    "seats.status": "available",
                    "seats.userId": null
                },
                {
                    $set: {
                        "seats.$.status": "booked",
                        "seats.$.userId": userId,
                        "seats.$.bookedAt": new Date()
                    }
                },
                { new: true }
            );

            if (!updatedTrip) {
                return res.status(400).json({ message: "No available seats. Please try another trip." });
            }

            res.status(200).json({ message: "Trip booked successfully" });
        } catch (error) {
            console.error("bookTrip error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getBookedTrips: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const bookedTrips = await Trip.find({ "seats.userId": userId, status: { $or: ["pending", "ongoing"] } });
            res.status(200).json({ message: "Booked trips fetched successfully", data: bookedTrips });

        } catch (error) {
            console.error("getBookedTrips error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAvailableTrips: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            let { departureDate, destination, origin } = req.query;
            if (!departureDate || !destination || !origin) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const parsedDepartureDate = new Date(departureDate as string);
            if (isNaN(parsedDepartureDate.getTime())) {
                return res.status(400).json({ message: "Invalid departure date" });
            }

            const sanitizedDestination = escapeRegex(destination as string);
            const sanitizedOrigin = escapeRegex(origin as string);

            const matchedRoutes = await Route.find({
                origin: { $regex: sanitizedOrigin, $options: "i" },
                destination: { $regex: sanitizedDestination, $options: "i" },
            }).distinct("_id");

            if (!matchedRoutes) {
                return res.status(404).json({ message: "No matching route found" });
            }

            const startDate = new Date(parsedDepartureDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(parsedDepartureDate);
            endDate.setHours(23, 59, 59, 999);

            const alltrips = await Trip.find({
                departureTime: { $gte: startDate, $lte: endDate },
                routeId: { $in: matchedRoutes },
                status: "pending",
                seats: { $elemMatch: { status: "available" } }
            }).populate<{ routeId: IRoute, subCompanyId: ISubCompany }>("routeId subCompanyId");

            const response = alltrips.map(trip => ({
                id: trip._id,
                route: {
                    origin: trip.routeId.origin,
                    destination: trip.routeId.destination,
                    distance: trip.routeId.distance,
                    price: trip.routeId.price,
                },
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                status: trip.status,
                subCompany: {
                    name: trip.subCompanyId.companyName,
                    logo: trip.subCompanyId.logo,
                },
                stops: trip.stops.length,
                seats: trip.seats.filter(seat => seat.status === "available").length,
            }));

            res.status(200).json({ message: "Available trips fetched successfully", data: response });
        } catch (error) {
            console.error("getAvailableTrips error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllTripHistory: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const tripHistory = await Trip.find({ "seats.userId": userId });
            res.status(200).json({ message: "Trip history fetched successfully", data: tripHistory });
        } catch (error) {
            console.error("getAllTripHistory error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

};


