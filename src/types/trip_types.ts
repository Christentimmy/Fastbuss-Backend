
import { Document, Types } from "mongoose";

export interface ITrip extends Document {
    routeId: Types.ObjectId;
    busId: Types.ObjectId;
    driverId: Types.ObjectId;
    departureTime: Date;
    arrivalTime: Date;
    status: string;
    subCompanyId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
    stops: {
        location: string,
        arrivalTime: Date,
        departureTime: Date,
    }[],
    seats: {
        seatNumber: String, // like "1A", "2B", etc.
        status: "available" | "booked",
        userId: Types.ObjectId | null,
        bookedAt: Date | null
    }[];
}
