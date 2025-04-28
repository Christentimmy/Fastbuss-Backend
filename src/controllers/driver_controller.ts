import { Request, Response } from "express";
import { User } from "../models/user_model";
import { Bus } from "../models/bus_model";
import Trip from "../models/trip_model";
import { IRoute } from "../types/route_types";
import { uploadToCloudinary } from "../middlewares/upload_middleware";

export const driverController = {
    // ==================== DRIVER PROFILE ====================
    getProfile: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const driver = await User.findById(driverId)
                .select("-password")
                .populate("assignedBus");

            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }

            res.status(200).json({ 
                message: "Profile fetched successfully",
                data: driver 
            });
        } catch (error) {
            console.error("getProfile error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateProfile: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const { name, phone } = req.body;

            const driver = await User.findById(driverId);
            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }

            if (name) driver.name = name;
            if (phone) driver.phone = phone;

            if (req.file) {
                const result = await uploadToCloudinary(req.file, "profile_pictures") as { secure_url?: string, url?: string };
                if (result) {
                    driver.profilePicture = result.secure_url ?? result.url!;
                }
            }

            await driver.save();
            res.status(200).json({ 
                message: "Profile updated successfully",
                data: driver 
            });
        } catch (error) {
            console.error("updateProfile error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== DRIVER BUS ====================
    getAssignedBus: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const driver = await User.findById(driverId).populate("assignedBus");

            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }

            if (!driver.assignedBus) {
                return res.status(404).json({ message: "No bus assigned" });
            }

            res.status(200).json({ 
                message: "Assigned bus fetched successfully",
                data: driver.assignedBus 
            });
        } catch (error) {
            console.error("getAssignedBus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== DRIVER SCHEDULE ====================
    getSchedule: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const { startDate, endDate } = req.query;

            const query: any = { driverId };

            if (startDate && endDate) {
                query.departureTime = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            }

            const schedules = await Trip.find(query)
                .populate('routeId')
                .populate('busId')
                .sort({ departureTime: 1 });

            res.status(200).json({ 
                message: "Schedule fetched successfully",
                data: schedules 
            });
        } catch (error) {
            console.error("getSchedule error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== DRIVER TRIP MANAGEMENT ====================
    getTripHistory: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const { startDate, endDate, status } = req.query;

            const query: any = { driverId };

            if (startDate && endDate) {
                query.departureTime = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            }

            if (status) {
                query.status = status;
            }

            const trips = await Trip.find(query)
                .populate<{ routeId: IRoute }>("routeId")
                .populate("busId")
                .sort({ departureTime: -1 });

            res.status(200).json({ 
                message: "Trip history fetched successfully",
                data: trips 
            });
        } catch (error) {
            console.error("getTripHistory error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updateTripStatus: async (req: Request, res: Response) => {
        try {
            const driverId = res.locals.userId;
            const { tripId } = req.params;
            const { status } = req.body;

            if (!tripId || !status) {
                return res.status(400).json({ message: "Trip ID and status are required" });
            }

            if (!["ongoing", "completed", "delayed"].includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }

            const trip = await Trip.findOne({ _id: tripId, driverId });
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            trip.status = status;
            await trip.save();

            res.status(200).json({ 
                message: "Trip status updated successfully",
                data: trip 
            });
        } catch (error) {
            console.error("updateTripStatus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}; 