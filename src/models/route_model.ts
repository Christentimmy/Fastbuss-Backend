

import mongoose, { Schema } from 'mongoose';
import { IRoute } from '../types/route_types';

const RouteSchema = new Schema<IRoute>({
  routeName: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  distance: { type: Number, required: false },
  childPrice: { type: Number, required: true },
  adultPrice: { type: Number, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  subCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCompany", required: true },
  waypoints: [{ latitude: { type: Number }, longitude: { type: Number } }],
}, { timestamps: true });

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
