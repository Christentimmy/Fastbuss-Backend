// import mongoose, { Schema, Document, Types } from "mongoose";
// import { ITrip } from "../types/trip_types";

// export interface ISeat extends Document {
//     trip: Types.ObjectId;
//     seatNumber: number;
//     status: "available" | "booked" | "reserved";
//     bookingId?: Types.ObjectId;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const SeatSchema = new Schema<ISeat>({
//     trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
//     seatNumber: { type: Number, required: true },
//     status: { 
//         type: String, 
//         enum: ["available", "booked", "reserved"],
//         default: "available" 
//     },
//     bookingId: { type: Schema.Types.ObjectId, ref: "Booking" }
// }, { timestamps: true });

// // Create a compound index to ensure unique seat numbers per trip
// SeatSchema.index({ trip: 1, seatNumber: 1 }, { unique: true });

// export const Seat = mongoose.model<ISeat>("Seat", SeatSchema); 