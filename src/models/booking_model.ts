import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBooking extends Document {
    user: Types.ObjectId;
    trip: Types.ObjectId;
    seats: number[];
    totalPrice: number;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod?: string;
    paymentId?: string;
    bookingDate: Date;
    cancellationDate?: Date;
    refundAmount?: number;
    ticketNumber: string;
}

const BookingSchema = new Schema<IBooking>({
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    seats: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending" 
    },
    paymentStatus: { 
        type: String, 
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending" 
    },
    paymentMethod: { type: String },
    paymentId: { type: String },
    bookingDate: { type: Date, default: Date.now },
    cancellationDate: { type: Date },
    refundAmount: { type: Number },
    ticketNumber: { type: String, required: true, unique: true }
}, { timestamps: true });


export const Booking = mongoose.model<IBooking>("Booking", BookingSchema); 