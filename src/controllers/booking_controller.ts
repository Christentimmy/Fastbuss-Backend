import { Request, Response } from "express";
import { Booking } from "../models/booking_model";
import Trip from "../models/trip_model";
import { User } from "../models/user_model";
import { sendEmail } from "../services/email_service";
import sendPushNotification from "../config/onesignal";
import { IRoute } from "../types/route_types";


export const bookingController = {
    // ==================== BOOKING MANAGEMENT ====================
    createBooking: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const { tripId, seats, paymentMethod } = req.body;

            if (!tripId || !seats || !Array.isArray(seats) || seats.length === 0) {
                return res.status(400).json({ message: "Trip ID and seats are required" });
            }

            const trip = await Trip.findById(tripId).populate<{ routeId: IRoute }>("routeId");
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Check if seats are available
            const existingBookings = await Booking.find({
                trip: tripId,
                status: { $in: ["confirmed", "pending"] }
            });
            
            const bookedSeats = existingBookings.flatMap(booking => booking.seats);
            const isSeatAvailable = seats.every(seat => !bookedSeats.includes(seat));
            
            if (!isSeatAvailable) {
                return res.status(400).json({ message: "Some seats are already booked" });
            }

            // Calculate total price
            const totalPrice = seats.length * trip.routeId.price;

            const booking = await Booking.create({
                user: userId,
                trip: tripId,
                seats,
                totalPrice,
                paymentMethod,
                status: "pending"
            });

            // Send confirmation email
            const user = await User.findById(userId);
            if (user) {
                const message = `Your booking has been created successfully!<br>
                Ticket Number: ${booking.ticketNumber}<br>
                Trip Details:<br>
                Origin: ${trip.routeId.origin}<br>
                Destination: ${trip.routeId.destination}<br>
                Departure Time: ${trip.departureTime}<br>
                Seats: ${seats.join(", ")}<br>
                Total Price: ${totalPrice}<br>
                Please complete the payment to confirm your booking.`;

                await sendEmail(user.email, "Booking Confirmation", user.name, message);
                
                if (user.one_signal_id) {
                    await sendPushNotification(user.one_signal_id, "Booking Created", message);
                }
            }

            res.status(201).json({
                message: "Booking created successfully",
                data: booking
            });
        } catch (error) {
            console.error("createBooking error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getBookingDetails: async (req: Request, res: Response) => {
        try {
            const { bookingId } = req.params;
            const userId = res.locals.userId;

            const booking = await Booking.findById(bookingId)
                .populate("trip")
                .populate("user", "name email phone");

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // Check if user is authorized to view this booking
            if (booking.user._id.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized access" });
            }

            res.status(200).json({
                message: "Booking details fetched successfully",
                data: booking
            });
        } catch (error) {
            console.error("getBookingDetails error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getUserBookings: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;

            const bookings = await Booking.find({ user: userId })
                .populate("trip")
                .sort({ createdAt: -1 });

            res.status(200).json({
                message: "User bookings fetched successfully",
                data: bookings
            });
        } catch (error) {
            console.error("getUserBookings error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    cancelBooking: async (req: Request, res: Response) => {
        try {
            const { bookingId } = req.params;
            const userId = res.locals.userId;

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // Check if user is authorized to cancel this booking
            if (booking.user.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized access" });
            }

            // Check if booking can be cancelled
            if (booking.status === "cancelled") {
                return res.status(400).json({ message: "Booking is already cancelled" });
            }

            if (booking.status === "completed") {
                return res.status(400).json({ message: "Cannot cancel completed booking" });
            }

            const trip = await Trip.findById(booking.trip);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Check if trip has already started
            if (new Date(trip.departureTime) <= new Date()) {
                return res.status(400).json({ message: "Cannot cancel booking after trip departure" });
            }

            // Calculate refund amount based on cancellation policy
            const hoursUntilDeparture = (new Date(trip.departureTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
            let refundAmount = 0;

            if (hoursUntilDeparture > 24) {
                refundAmount = booking.totalPrice * 0.8; // 80% refund
            } else if (hoursUntilDeparture > 12) {
                refundAmount = booking.totalPrice * 0.5; // 50% refund
            }

            booking.status = "cancelled";
            booking.cancellationDate = new Date();
            booking.refundAmount = refundAmount;
            await booking.save();

            // Send cancellation email
            const user = await User.findById(userId);
            if (user) {
                const message = `Your booking has been cancelled.\n
                Ticket Number: ${booking.ticketNumber}\n
                Refund Amount: ${refundAmount}\n
                The refund will be processed within 5-7 business days.`;

                await sendEmail(user.email, "Booking Cancelled", user.name, message);
                
                if (user.one_signal_id) {
                    await sendPushNotification(user.one_signal_id, "Booking Cancelled", message);
                }
            }

            res.status(200).json({
                message: "Booking cancelled successfully",
                data: {
                    booking,
                    refundAmount
                }
            });
        } catch (error) {
            console.error("cancelBooking error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    updatePaymentStatus: async (req: Request, res: Response) => {
        try {
            const { bookingId } = req.params;
            const { paymentStatus, paymentId } = req.body;

            if (!paymentStatus || !paymentId) {
                return res.status(400).json({ message: "Payment status and payment ID are required" });
            }

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            booking.paymentStatus = paymentStatus;
            booking.paymentId = paymentId;

            if (paymentStatus === "paid") {
                booking.status = "confirmed";
            }

            await booking.save();

            // Send payment confirmation email
            const user = await User.findById(booking.user);
            if (user) {
                const message = `Your payment has been ${paymentStatus}.\n
                Ticket Number: ${booking.ticketNumber}\n
                Amount: ${booking.totalPrice}\n
                Thank you for choosing our service!`;

                await sendEmail(user.email, "Payment Status Update", user.name, message);
                
                if (user.one_signal_id) {
                    await sendPushNotification(user.one_signal_id, "Payment Status Update", message);
                }
            }

            res.status(200).json({
                message: "Payment status updated successfully",
                data: booking
            });
        } catch (error) {
            console.error("updatePaymentStatus error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== ADMIN BOOKING MANAGEMENT ====================
    getAllBookings: async (req: Request, res: Response) => {
        try {
            const { status, startDate, endDate } = req.query;
            const query: any = {};

            if (status) {
                query.status = status;
            }

            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            }

            const bookings = await Booking.find(query)
                .populate("user", "name email phone")
                .populate("trip")
                .sort({ createdAt: -1 });

            res.status(200).json({
                message: "All bookings fetched successfully",
                data: bookings
            });
        } catch (error) {
            console.error("getAllBookings error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getBookingStats: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;
            const query: any = {};

            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string)
                };
            }

            const stats = await Booking.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        totalRevenue: { $sum: "$totalPrice" },
                        confirmedBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
                        },
                        cancelledBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                        },
                        pendingBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        }
                    }
                }
            ]);

            res.status(200).json({
                message: "Booking statistics fetched successfully",
                data: stats[0] || {
                    totalBookings: 0,
                    totalRevenue: 0,
                    confirmedBookings: 0,
                    cancelledBookings: 0,
                    pendingBookings: 0
                }
            });
        } catch (error) {
            console.error("getBookingStats error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}; 