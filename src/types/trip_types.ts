
import { Document, Types } from "mongoose";

export interface ITrip extends Document {
    routeId: Types.ObjectId;
    busId: Types.ObjectId;
    driverId: Types.ObjectId;
    departureTime: Date;
    arrivalTime: Date;
    status: string;
    subCompanyId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
}
