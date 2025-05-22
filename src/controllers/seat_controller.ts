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

// Store pending releases
const pendingReleases = new Map<string, NodeJS.Timeout>();

export const seatController = {
    // ==================== SEAT MANAGEMENT ====================
    reserveSeats: (availableSeats: ISeat[], passengersList: Array<any>, userId: Types.ObjectId, basePrice: number): [string[], Passenger[]] => {
        try {
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

            const bookedSeatNumbers: any = [];
            const allPassengers: Passenger[] = [];

            const seatsToReserve = availableSeats.slice(0, passengersList.length);
            seatsToReserve.forEach((seat, index) => {
                const passenger = passengersList[index];

                seat.status = 'reserved';
                seat.userId = userId;
                seat.bookedAt = new Date();
                seat.reservedAt = new Date();
                seat.passengerName = passenger.name;
                seat.passengerType = passenger.type;

                bookedSeatNumbers.push(seat.seatNumber);

                allPassengers.push({
                    name: passenger.name,
                    seat: seat.seatNumber,
                    price: basePrice,
                    type: passenger.type,
                    seatId: seat._id,
                });
            });

            return [bookedSeatNumbers, allPassengers];

        } catch (error) {
            console.error("reserveSeats error:", error);
            throw error;
        }
    },

    releaseSeats: async (bookingId: Types.ObjectId) => {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.paymentStatus !== "pending") {
                return;
            }

            const trip = await Trip.findById(booking.trip);
            if (!trip) {
                throw new Error("Trip not found");
            }

            // Get the seats that need to be released
            const seatsToRelease = trip.seats.filter(seat => 
                booking.seats.includes(seat.seatNumber) && 
                seat.status === "reserved" &&
                seat.userId?.toString() === booking.user.toString()
            );


            const updatedSeats = trip.seats.map(seat => {
                if (seatsToRelease.some(s => s.seatNumber === seat.seatNumber)) {
                    return {
                        ...seat,
                        status: "available" as const,
                        userId: null,
                        passengerName: null,
                        reservedAt: null,
                        bookedAt: null,
                        passengerType: null,
                    };
                }
                return seat;
            });

            // Update trip and booking
            trip.seats = updatedSeats;
            await trip.save();

            booking.status = "cancelled";
            booking.paymentStatus = "failed";
            await booking.save();

            return true;
        } catch (error) {
            console.error("releaseSeats error:", error);
            throw error;
        }
    },

    markSeatsAsBooked: async (bookingId: Types.ObjectId) => {
        try {
            if (!bookingId) {
                throw Error("Booking is required");
            }
            const booking = await Booking.findById(bookingId).populate<{user: IUser}>("user");
            if (!booking) {
                throw Error("Booking not found");
            }
        
            const trip = await Trip.findById(booking.trip).populate<{subCompanyId: ISubCompany, driverId: IUser, routeId: IRoute, busId: IBus}>("subCompanyId driverId routeId busId");
            if (!trip) throw Error("Trip Not Found");

            const allPassengers: Passenger[] = booking.allPassengers;
            if (!allPassengers || allPassengers.length === 0) {
                throw Error("No Passengers for this booking found");
            }

            const allSeats = trip.seats;
            const updatedSeats: ISeat[] = allSeats.map(seat => {
                const passenger = allPassengers.find(p => p.seatId!.toString() === seat._id.toString());

                if (passenger) {
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
            await trip.save();


            const response = await sendTicketEmail(
                booking.user.email,
                trip.subCompanyId.companyName,
                trip as unknown as ITrip,
                trip.routeId,
                trip.busId,
                trip.driverId.name,
                allPassengers,
            );

            if (!response) {
                console.log("Failed to send Email");
            }

        } catch (error) {
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