import { Request, Response } from "express";
import { ISeat } from "../types/trip_types";
import { Types } from "mongoose";
import { Passenger } from "../services/email_service";
import { Booking } from "../models/booking_model";
import Trip from "../models/trip_model";
import { sendTicketEmail } from "../services/email_service";
import { ISubCompany } from "../types/sub_company_types";
import { IUser } from "../types/user_types";
import { ITrip } from "../types/trip_types";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { PayPalService } from "../services/paypal_service";
import mongoose from "mongoose";

const paypalService = new PayPalService();

// Store pending releases
const pendingReleases = new Map<string, NodeJS.Timeout>();

export const seatController = {
    // ==================== SEAT MANAGEMENT ====================

    reserveSeats: async (
        availableSeats: ISeat[],
        passengersList: Array<any>,
        userId: Types.ObjectId,
        basePrice: number,
        tripId: string,
        session: any
    ): Promise<[string[], Passenger[]]> => {
        try {
            // Input validation
            if (!Array.isArray(availableSeats) || !Array.isArray(passengersList)) {
                throw new Error("Invalid input: availableSeats and passengersList must be arrays");
            }

            if (passengersList.length === 0) {
                throw new Error("No passengers provided");
            }

            if (availableSeats.length < passengersList.length) {
                throw new Error("Not enough available seats");
            }

            if (!userId) {
                throw new Error("Invalid user ID");
            }

            const bookedSeatNumbers: string[] = [];
            const allPassengers: Passenger[] = [];
            const now = new Date();

            // Prepare bulk operations with optimistic concurrency
            const operations = passengersList.map((passenger, index) => {
                const seat = availableSeats[index];

                bookedSeatNumbers.push(seat.seatNumber);
                allPassengers.push({
                    name: passenger.name,
                    seat: seat.seatNumber,
                    price: basePrice,
                    type: passenger.type,
                    seatId: seat._id
                });

                return {
                    updateOne: {
                        filter: {
                            _id: tripId,
                            "seats._id": seat._id,
                            "seats.status": "available" // Ensure seat is still available
                        },
                        update: {
                            $set: {
                                "seats.$.status": "reserved",
                                "seats.$.userId": userId,
                                "seats.$.bookedAt": now,
                                "seats.$.reservedAt": now,
                                "seats.$.passengerName": passenger.name,
                                "seats.$.passengerType": passenger.type
                            }
                        }
                    }
                };
            });

            // Execute bulk write with session
            const result = await Trip.bulkWrite(operations, { session });

            // Verify all seats were successfully reserved
            if (result.modifiedCount < passengersList.length) {
                throw new Error(`Some seats were already taken. Only ${result.modifiedCount} out of ${passengersList.length} seats were reserved. Please try again.`);
            }

            return [bookedSeatNumbers, allPassengers];

        } catch (error) {
            console.error("reserveSeats error:", error);
            throw error;
        }
    },

    releaseSeats: async (bookingId: Types.ObjectId) => {
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status === 'confirmed') return;

        await Trip.updateOne(
            { _id: booking.trip },
            {
                $set: {
                    "seats.$[elem].status": "available",
                    "seats.$[elem].userId": null,
                    "seats.$[elem].bookedAt": null,
                    "seats.$[elem].reservedAt": null,
                    "seats.$[elem].passengerName": null,
                    "seats.$[elem].passengerType": null
                }
            },
            {
                arrayFilters: [
                    { "elem._id": { $in: booking.allPassengers.map(p => p.seatId) } }
                ]
            }
        );

        booking.status = 'expired';
        booking.paymentStatus = 'failed';
        await booking.save();
    },

    markSeatsAsBooked: async (bookingId: Types.ObjectId) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!bookingId) throw Error("Booking is required");

            const booking = await Booking.findById(bookingId).populate<{ user: IUser }>("user").session(session);
            if (!booking) throw Error("Booking not found");

            const trip = await Trip.findById(booking.trip)
                .populate<{ subCompanyId: ISubCompany, driverId: IUser, routeId: IRoute, busId: IBus }>("subCompanyId driverId routeId busId")
                .session(session);
            if (!trip) throw Error("Trip not found");

            const allPassengers: Passenger[] = booking.allPassengers;
            if (!allPassengers || allPassengers.length === 0) throw Error("No passengers for this booking");

            const allSeats = trip.seats;
            const updatedSeats: ISeat[] = allSeats.map(seat => {
                const passenger = allPassengers.find(p => p.seatId!.toString() === seat._id.toString());

                if (passenger) {
                    // ⚠️ Prevent double-booking by checking if the seat is already booked
                    if (seat.status === "booked") throw new Error(`Seat ${seat._id} is already booked`);

                    return {
                        ...seat,
                        status: "booked",
                        userId: booking.user._id as Types.ObjectId,
                        passengerName: passenger.name,
                        passengerType: passenger.type as "main" | "guest",
                        updatedAt: new Date()
                    };
                }
                return seat;
            });

            trip.seats = updatedSeats;
            await trip.save({ session });

            const emailResponse = await sendTicketEmail(
                booking.user.email,
                trip.subCompanyId.companyName,
                trip as unknown as ITrip,
                trip.routeId,
                trip.busId,
                trip.driverId.name,
                allPassengers
            );

            if (!emailResponse) console.log("Failed to send email");

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("markSeatsAsBooked error:", error);
            throw error;
        }
    },

    scheduleSeatRelease: (bookingId: Types.ObjectId) => {
        const timeoutId = setTimeout(async () => {
            try {
                await seatController.releaseSeats(bookingId);
                pendingReleases.delete(bookingId.toString());
            } catch (error) {
                console.error("Scheduled seat release failed:", error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        pendingReleases.set(bookingId.toString(), timeoutId);
    },

    cancelScheduledRelease: (bookingId: Types.ObjectId) => {
        const timeoutId = pendingReleases.get(bookingId.toString());
        if (timeoutId) {
            clearTimeout(timeoutId);
            pendingReleases.delete(bookingId.toString());
        }
    },

    // ==================== ADMIN SEAT MANAGEMENT ====================
    initializeSeats: async (busCapacity: number) => {
        try {
            const seatLetters = ['A', 'B', 'C', 'D'];
            const totalSeats = busCapacity;
            const seatsPerRow = seatLetters.length;
            const totalRows = Math.ceil(totalSeats / seatsPerRow);

            const seats = [];

            for (let row = 1; row <= totalRows; row++) {
                for (let col = 0; col < seatsPerRow; col++) {
                    const seatNumber = `${row}${seatLetters[col]}`;
                    seats.push({
                        seatNumber,
                        status: 'available'
                    });

                    if (seats.length === totalSeats) break;
                }
                if (seats.length === totalSeats) break;
            }
            return seats;
        } catch (error) {
            console.error("initializeSeats error:", error);
        }
    }
}; 