import mongoose from "mongoose";
import { ITrip } from "../types/trip_types";

const tripSchema = new mongoose.Schema<ITrip>({
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    status: { type: String, enum: ["pending", "ongoing", "completed", "cancelled"], default: "pending" },
    subCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCompany" },
}, { timestamps: true });

const Trip = mongoose.model<ITrip>("Trip", tripSchema);

export default Trip;
