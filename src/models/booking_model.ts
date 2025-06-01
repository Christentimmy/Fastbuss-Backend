import mongoose, { Schema, Document, Types } from "mongoose";
import { Passenger } from "../services/email_service";

export interface IBooking extends Document {
    _id: Types.ObjectId,
    user: Types.ObjectId;
    trip: Types.ObjectId;
    seats: string[];
    totalPrice: number;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "expired";
    paymentStatus: "pending" | "paid" | "failed" | "refunded" | "cancelled";
    paymentMethod?: string;
    paymentId?: string;
    bookingDate: Date;
    cancellationDate?: Date;
    refundAmount?: number;
    ticketNumber: string;
    allPassengers: Passenger[];
    orderId: string | null;
    captureId: string | null;
}

const BookingSchema = new Schema<IBooking>({
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    seats: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed", "expired"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "cancelled"],
        default: "pending"
    },
    paymentMethod: { type: String, enum: ["paypal", "cash"] },
    paymentId: { type: String },
    bookingDate: { type: Date, default: Date.now },
    cancellationDate: { type: Date },
    refundAmount: { type: Number },
    ticketNumber: { type: String, required: true, unique: true },
    allPassengers: [{
        name: { type: String, required: true },
        seat: { type: String, required: true },
        price: { type: Number, required: true },
        type: { type: String, enum: ["adult", "child"], default: "adult" },
        seatId: { type: Schema.Types.ObjectId, default: null },
    }],
    orderId: { type: String, default: null },
    captureId: { type: String, default: null },
}, { timestamps: true });


export const Booking = mongoose.model<IBooking>("Booking", BookingSchema); 