
import mongoose, { Schema, Document, Types } from "mongoose";
import { IBus } from "../types/bus_types";


const BusSchema = new Schema<IBus>({
  driver: { type: Schema.Types.ObjectId, ref: 'Users', default: null },
  subCompany: { type: Schema.Types.ObjectId, ref: "SubCompany", required: true },
  name: { type: String, required: true },
  plateNumber: { type: String, unique: true, required: true },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ["standard", "luxury", "minibus"], default: "standard" },
  status: { type: String, enum: ["active", "inactive", "maintenance", "blocked"], default: "inactive" },
  currentLocation: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date, default: Date.now },
  },
}, { timestamps: true });

export const Bus = mongoose.model<IBus>("Bus", BusSchema);
