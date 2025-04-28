import { Request, Response } from "express";
import { Seat } from "../models/seat_model";
import Trip from "../models/trip_model";
import { Booking } from "../models/booking_model";

export const seatController = {
    // ==================== SEAT MANAGEMENT ====================
    getAvailableSeats: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;

            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            const seats = await Seat.find({
                trip: tripId,
                status: "available"
            }).sort({ seatNumber: 1 });

            res.status(200).json({
                message: "Available seats fetched successfully",
                data: seats
            });
        } catch (error) {
            console.error("getAvailableSeats error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    reserveSeats: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;
            const { seatNumbers } = req.body;

            if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
                return res.status(400).json({ message: "Seat numbers are required" });
            }

            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Check if seats are available
            const seats = await Seat.find({
                trip: tripId,
                seatNumber: { $in: seatNumbers }
            });

            const unavailableSeats = seats.filter(seat => seat.status !== "available");
            if (unavailableSeats.length > 0) {
                return res.status(400).json({
                    message: "Some seats are not available",
                    unavailableSeats: unavailableSeats.map(seat => seat.seatNumber)
                });
            }

            // Reserve seats
            await Seat.updateMany(
                { trip: tripId, seatNumber: { $in: seatNumbers } },
                { status: "reserved" }
            );

            res.status(200).json({
                message: "Seats reserved successfully",
                data: { seatNumbers }
            });
        } catch (error) {
            console.error("reserveSeats error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    releaseSeats: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;
            const { seatNumbers } = req.body;

            if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
                return res.status(400).json({ message: "Seat numbers are required" });
            }

            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Release seats
            await Seat.updateMany(
                { trip: tripId, seatNumber: { $in: seatNumbers } },
                { status: "available", bookingId: null }
            );

            res.status(200).json({
                message: "Seats released successfully",
                data: { seatNumbers }
            });
        } catch (error) {
            console.error("releaseSeats error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    markSeatsAsBooked: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.params;
            const { seatNumbers, bookingId } = req.body;

            if (!Array.isArray(seatNumbers) || seatNumbers.length === 0 || !bookingId) {
                return res.status(400).json({ message: "Seat numbers and booking ID are required" });
            }

            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // Mark seats as booked
            await Seat.updateMany(
                { trip: tripId, seatNumber: { $in: seatNumbers } },
                { status: "booked", bookingId }
            );

            res.status(200).json({
                message: "Seats marked as booked successfully",
                data: { seatNumbers }
            });
        } catch (error) {
            console.error("markSeatsAsBooked error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // ==================== ADMIN SEAT MANAGEMENT ====================
    initializeSeats: async (req: Request, res: Response) => {
        try {
            const { tripId, totalSeats } = req.body;

            if (!tripId || !totalSeats) {
                return res.status(400).json({ message: "Trip ID and total seats are required" });
            }

            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Check if seats already exist for this trip
            const existingSeats = await Seat.findOne({ trip: tripId });
            if (existingSeats) {
                return res.status(400).json({ message: "Seats already initialized for this trip" });
            }

            // Create seats
            const seats = [];
            for (let i = 1; i <= totalSeats; i++) {
                seats.push({
                    trip: tripId,
                    seatNumber: i,
                    status: "available"
                });
            }

            await Seat.insertMany(seats);

            res.status(201).json({
                message: "Seats initialized successfully",
                data: { totalSeats }
            });
        } catch (error) {
            console.error("initializeSeats error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}; 