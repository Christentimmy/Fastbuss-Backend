import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISupportTicket extends Document {
    user: Types.ObjectId;
    subject: string;
    description: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high";
    category: "booking" | "payment" | "technical" | "other";
    attachments?: string[];
    assignedTo?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ["open", "in_progress", "resolved", "closed"],
        default: "open"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    category: {
        type: String,
        enum: ["booking", "payment", "technical", "other"],
        required: true
    },
    attachments: [{ type: String }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Users' },
    // responses: [{
    //     responder: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    //     message: { type: String, required: true },
    //     timestamp: { type: Date, default: Date.now }
    // }]
}, { timestamps: true });

export const SupportTicket = mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema); 