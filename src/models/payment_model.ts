// import mongoose, { Schema, Document, Types } from "mongoose";
// import { IBooking } from "./booking_model";

// export interface IPayment extends Document {
//     booking: Types.ObjectId;
//     amount: number;
//     currency: string;
//     paymentMethod: string;
//     status: "pending" | "completed" | "failed" | "refunded";
//     payseraOrderId: string;
//     payseraPaymentId?: string;
//     refundAmount?: number;
//     refundReason?: string;
//     metadata?: any;
//     createdAt: Date;
//     updatedAt: Date;
// }

// const PaymentSchema = new Schema<IPayment>({
//     booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
//     amount: { type: Number, required: true },
//     currency: { type: String, default: "EUR" },
//     paymentMethod: { type: String, required: true },
//     status: { 
//         type: String, 
//         enum: ["pending", "completed", "failed", "refunded"],
//         default: "pending" 
//     },
//     payseraOrderId: { type: String, required: true },
//     payseraPaymentId: { type: String },
//     refundAmount: { type: Number },
//     refundReason: { type: String },
//     metadata: { type: Schema.Types.Mixed }
// }, { timestamps: true });

// export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema); 