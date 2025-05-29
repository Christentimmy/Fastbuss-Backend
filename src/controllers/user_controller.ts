import { Request, Response } from "express";
import { User } from "../models/user_model";
import { uploadToCloudinary } from "../middlewares/upload_middleware";
import bcrypt from "bcryptjs";
import Trip from "../models/trip_model";
import { escapeRegex } from "../utils/escape_regex";
import { Route } from "../models/route_model";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { ISubCompany } from "../types/sub_company_types";
import { Booking } from "../models/booking_model";
import { generateTicketNumber } from "../utils/generate_booking_number";
import { ITrip } from "../types/trip_types";
import { PayPalService } from '../services/paypal_service';
import { seatController } from "./seat_controller";
import mongoose, { Document } from "mongoose";
import { sendTicketEmail } from "../services/email_service";
import { IUser } from "../types/user_types";
import { Bus } from "../models/bus_model";

const paypalService = new PayPalService();



export const userController = {
    // ==================== USER PROFILE ====================

    getStatus: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;
            const user = await User.findById(userId).select("status email is_email_verified role");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({
                message: "User status fetched successfully",
                data: user,
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
            const { name, email } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!name && !email) {
                res.status(400).json({ message: "You Either Change Your Email or Name" });
                return;
            }

            if (name) user.name = name;
            if (email) {
                const existEmail = await User.findOne({ email: email })
                if (existEmail) {
                    res.status(400).json({ message: "Email Already Exist" });
                    return;
                }
                user.phone = email;
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

    // ==================== USER ACCOUNT ====================
    deleteAccount: async (req: Request, res: Response) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const userId = res.locals.userId;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ message: "Password is required" });
            }

            const user = await User.findById(userId).session(session);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Password is incorrect" });
            }

            // Delete user and their bookings in a transaction
            await Promise.all([
                User.findByIdAndDelete(userId).session(session),
                Booking.deleteMany({ user: userId }).session(session)
            ]);

            await session.commitTransaction();
            res.status(200).json({ message: "Account deleted successfully" });
        } catch (error) {
            await session.abortTransaction();
            console.error("deleteAccount error:", error);
            res.status(500).json({ message: "Internal server error" });
        } finally {
            session.endSession();
        }
    },

    bookTrip: async (req: Request, res: Response) => {
        const session = await mongoose.startSession();

        try {
            const result = await session.withTransaction(async () => {
                // 1. Get user ID and validate input
                const userId = res.locals.userId;
                const { tripId, passengers } = req.body;
                if (!tripId || !passengers) {
                    res.status(400).json({ message: "Trip ID and passenger count are required" })
                    return;
                }

                // 2. Check if user exists (within transaction)
                const user = await User.findById(userId).session(session);
                if (!user) return res.json({ message: "user not found" });

                // 3. Validate passenger count
                const passengerCount = parseInt(passengers.toString());
                if (isNaN(passengerCount) || passengerCount <= 0) {
                    res.json({ message: "Invalid passenger count" });
                    return;
                }

                // 4. Find trip and check availability atomically
                const trip = await Trip.findOneAndUpdate(
                    {
                        _id: tripId,
                        status: "pending",
                        $expr: {
                            $gte: [
                                { $size: { $filter: { input: "$seats", cond: { $eq: ["$$this.status", "available"] } } } },
                                passengerCount
                            ]
                        }
                    },
                    {}, // No update, just finding
                    {
                        session,
                        populate: "routeId subCompanyId busId driverId"
                    }
                ) as (ITrip & { routeId: IRoute, subCompanyId: ISubCompany, busId: IBus }) | null;

                if (!trip) {
                    res.json({ message: "Trip is not available for booking or insufficient seats" });
                    return;
                }

                // 5. Reserve seats atomically
                const pricePerSeat = trip.routeId.price;
                const totalPrice = passengerCount * pricePerSeat;

                const passengersList = [];
                for (let i = 0; i < passengerCount; i++) {
                    passengersList.push({
                        name: i === 0 ? user.name : `Guest ${i} ${user.name}`,
                        type: i === 0 ? "main" : "guest"
                    });
                }

                // Get available seats within the transaction
                const availableSeats = trip.seats.filter(seat => seat.status === "available");

                const reservationResult = await seatController.reserveSeats(
                    availableSeats,
                    passengersList,
                    userId,
                    totalPrice,
                    tripId,
                    session
                );

                const [bookedSeatNumbers, allPassengers] = reservationResult;

                // 6. Create booking
                const booking = new Booking({
                    user: userId,
                    trip: trip._id,
                    seats: bookedSeatNumbers,
                    totalPrice,
                    status: "pending",
                    paymentStatus: "pending",
                    ticketNumber: generateTicketNumber(),
                    bookingDate: new Date(),
                    allPassengers: allPassengers,
                });

                await booking.save({ session });

                // 7. Create payment
                const payment = await paypalService.createPayment(
                    totalPrice,
                    `Booking for ${trip.routeId.origin} to ${trip.routeId.destination}`,
                    { bookingId: booking._id.toString() }
                );

                if (!payment) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: "Failed to create payment" });
                }

                // Update booking with PayPal order ID
                booking.orderId = payment.orderId;
                await booking.save({ session });

                // Schedule seat release after transaction commits
                process.nextTick(() => {
                    seatController.scheduleSeatRelease(booking._id);
                });

                return {
                    message: "Trip booked successfully",
                    data: {
                        ticketNumber: booking.ticketNumber,
                        totalSeats: bookedSeatNumbers.length,
                        departure: trip.departureTime,
                        arrival: trip.arrivalTime,
                        bookedSeats: bookedSeatNumbers,
                        totalPrice,
                        approvalUrl: payment.approvalUrl,
                        orderId: payment.orderId,
                    }
                };
            });

            res.status(200).json(result);

        } catch (error) {
            console.error("bookTrip error:", error);

            // Handle specific error types
            if (error instanceof Error) {
                if (error.message.includes("Trip is not available") ||
                    error.message.includes("insufficient seats") ||
                    error.message.includes("already taken")) {
                    return res.status(400).json({ message: error.message });
                } else if (error.message.includes("not found")) {
                    return res.status(404).json({ message: error.message });
                } else if (error.message.includes("required") ||
                    error.message.includes("Invalid")) {
                    return res.status(400).json({ message: error.message });
                }
            }

            return res.status(500).json({ message: "Internal server error" });
        } finally {
            await session.endSession();
        }
    },

    resendTicket: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const { tripId, bookingId } = req.body;
            if (!tripId || !bookingId) return res.status(400).json({ message: "TripId and bookingId" });

            const trip = await Trip.findById(tripId).populate<{ subCompanyId: ISubCompany, driverId: IUser, routeId: IRoute, busId: IBus }>("subCompanyId driverId routeId busId");
            if (!trip) return res.status(404).json({ message: "Trip not found" });

            const exist = trip.seats.filter(seat => seat.userId === user._id && seat.status === "booked");
            if (!exist) return res.status(400).json({ message: "You did not book trip" });

            const booking = await Booking.findById(bookingId);
            if (!booking) return res.status(400).json({ message: "Booking not found" });



            const emailResponse = await sendTicketEmail(
                user.email,
                trip.subCompanyId.companyName,
                trip as unknown as ITrip,
                trip.routeId,
                trip.busId,
                trip.driverId.name,
                booking.allPassengers,
                booking.ticketNumber,
            );

            if (!emailResponse) return res.status(400).json({ message: "Failed to send email" });

            res.status(200).json({ message: "Ticket Sent To Your Email" });
        } catch (error) {
            console.error(error);
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

    cancelTrip: async (req: Request, res: Response) => {
        try {
            const { bookingId } = req.body;
            if (!bookingId) {
                res.status(404).json({ message: "Booking Id is required" });
                return;
            }
            const booking = await Booking.findById(bookingId).populate<{ trip: ITrip }>("trip");
            if (!booking) {
                res.status(400).json({ message: "Booking not found" });
                return;
            }
            if (booking.trip.status === "completed" || booking.status !== "confirmed" || booking.paymentStatus !== "paid") {
                res.status(400).json({ message: "You cannot be refunded" });
                return;
            }
            if (!booking.captureId) {
                res.status(400).json({ message: "Your booking was not captured, contact support" });
                return;
            }
            await seatController.releaseSeats(booking._id, "cancelled", "refunded");
            const response = await paypalService.refundPayment(booking.captureId, booking.totalPrice);
            if (!response) {
                res.status(400).json({ message: "Refund failed contact support" });
                return;
            }
            res.status(200).json({ message: "Trip Cancelled and refund initiated" });
        } catch (error) {
            console.error(error);
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
            }).populate<{ routeId: IRoute, subCompanyId: ISubCompany, busId: IBus }>("routeId busId subCompanyId");

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
                bus: {
                    busNumber: trip.busId.plateNumber,
                    busType: trip.busId.type,
                    busName: trip.busId.name,
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

            const bookings = await Booking.find({ user: user._id })
                .populate<{
                    trip: ITrip & {
                        routeId: IRoute;
                        busId: IBus;
                        subCompanyId: ISubCompany;
                    };
                }>({
                    path: 'trip',
                    populate: [
                        { path: 'routeId', select: 'origin destination price' },
                        { path: 'busId', select: 'name plateNumber type' },
                        { path: 'subCompanyId', select: 'companyName logo' }
                    ]
                })
                .lean();

            const response = bookings.map(booking => {
                return {
                    bookingId: booking._id,
                    tripId: booking.trip._id,
                    origin: booking.trip.routeId.origin,
                    destination: booking.trip.routeId.destination,
                    price: booking.totalPrice,
                    seats: booking.seats,
                    ticketNumber: booking.ticketNumber,
                    status: booking.status,
                    departureDate: booking.trip.departureTime,
                    arrivalDate: booking.trip.arrivalTime,
                    busName: booking.trip.busId.name,
                    busType: booking.trip.busId.type,
                    companyName: booking.trip.subCompanyId.companyName,
                    companyLogo: booking.trip.subCompanyId.logo,
                };
            });

            res.status(200).json({ message: "Trip history fetched successfully", data: response });
        } catch (error) {
            console.error("getAllTripHistory error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },


    // Driver
    getMyCurrentAssignedTrip: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const trip = await Trip.findOne({ driverId: user._id, status: { $in: ["pending", "ongoing"] } }).populate<{ routeId: IRoute }>("routeId");
            if (!trip) {
                res.status(400).json({ message: "no active trip" });
                return
            }

            const passengers = trip.seats.map(seat => seat.status == "booked");

            const response = {
                id: trip._id,
                route: {
                    origin: trip.routeId.origin,
                    destination: trip.routeId.destination,
                },
                stops: trip.stops.length,
                passengers: passengers.length,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                routeName: trip.routeId.routeName,
                status: trip.status,
            }

            res.status(200).json({ message: "Active trip found", data: response });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "internal server error" });
        }
    },

    startTrip: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.body;
            if (!tripId) return res.status(400).json({ message: "Trip ID is required" });

            const user = res.locals.user;
            if (!user) return res.status(400).json({ message: "User not found" });

            const trip = await Trip.findById(tripId);
            if (!trip) return res.status(404).json({ message: "Trip not found" });

            // Verify if the user is the assigned driver
            if (trip.driverId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You are not authorized to start this trip" });
            }

            // Check if trip is in a valid state to be started
            if (trip.status !== "pending") {
                return res.status(400).json({
                    message: `Cannot start trip. Current status is: ${trip.status}. Trip must be in 'pending' status to start.`
                });
            }

            trip.status = "ongoing";
            await trip.save();

            res.status(200).json({
                message: "Trip started successfully",
                data: {
                    tripId: trip._id,
                    status: trip.status,
                    departureTime: trip.departureTime,
                    arrivalTime: trip.arrivalTime
                }
            });

        } catch (error) {
            console.error("startTrip error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    endTrip: async (req: Request, res: Response) => {
        try {
            const { tripId } = req.body;
            if (!tripId) return res.status(400).json({ message: "Trip ID is required" });

            const user = res.locals.user;
            if (!user) return res.status(400).json({ message: "User not found" });

            const trip = await Trip.findById(tripId).populate<{ busId: IBus, driverId: IUser }>("busId driverId");
            if (!trip) return res.status(404).json({ message: "Trip not found" });

            // Verify if the user is the assigned driver
            if (trip.driverId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You are not authorized to end this trip" });
            }

            // Check if trip is in a valid state to be ended
            if (trip.status !== "ongoing") {
                return res.status(400).json({
                    message: `Cannot end trip. Current status is: ${trip.status}. Trip must be in 'ongoing' status to end.`
                });
            }

            await Promise.all([
                Trip.findByIdAndUpdate(tripId, { status: "completed" }),
                User.findByIdAndUpdate(trip.driverId._id, { status: "inactive" }),
                Bus.findByIdAndUpdate(trip.busId._id, { status: "inactive" })
            ]);

            res.status(200).json({
                message: "Trip ended successfully",
                data: {
                    tripId: trip._id,
                    status: "completed",
                    departureTime: trip.departureTime,
                    arrivalTime: trip.arrivalTime
                }
            });

        } catch (error) {
            console.error("endTrip error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    driverTripHistory: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(400).json({ message: "user required" });
            const trips = await Trip.find({ driverId: user._id }).populate<{ routeId: IRoute, subCompanyId: ISubCompany, busId: IBus }>("routeId subCompanyId busId").select("-seats");
            if (!trips) return res.status(404).json({ message: "Trips not founds" });

            const response = trips.map(trip => ({
                _id: trip._id,
                origin: trip.routeId.origin,
                destination: trip.routeId.destination,
                seats: trip.seats,
                status: trip.status,
                departureDate: trip.departureTime,
                arrivalDate: trip.arrivalTime,
                busName: trip.busId.name,
                busType: trip.busId.type,
                companyName: trip.subCompanyId.companyName,
                companyLogo: trip.subCompanyId.logo,
            }));
            res.status(200).json({ message: "All Trips", data: response });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

};


