import mongoose from "mongoose";
import { ITrip } from "../types/trip_types";

const tripSchema = new mongoose.Schema<ITrip>({
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    status: { type: String, enum: ["pending", "ongoing", "completed", "cancelled"], default: "pending" },
    subCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCompany" },
    stops: [{
        location: { type: String, default: null },
        arrivalTime: { type: Date, default: null },
        departureTime: { type: Date, default: null },
    }],
    seats: [{
        seatNumber: String,
        status: { type: String, enum: ["available", "booked", "reserved"], default: "available" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },
        bookedAt: { type: Date },
        updatedAt: { type: Date },
        reservedAt: { type: Date },
        passengerName: { type: String },
        passengerType: { type: String, enum: ["main", "guest", null], default: null }
    }]
}, { timestamps: true });

const Trip = mongoose.model<ITrip>("Trip", tripSchema);

export default Trip;
