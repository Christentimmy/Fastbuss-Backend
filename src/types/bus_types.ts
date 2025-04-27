
import { Document, Types } from "mongoose";

export interface IBus extends Document {
    driver: Types.ObjectId | null;
    subCompany: Types.ObjectId;
    name: string;
    plateNumber: string;
    capacity: number;
    type: "standard" | "luxury" | "minibus";
    status: "active" | "inactive" | "maintenance";
    currentLocation: any;
}

