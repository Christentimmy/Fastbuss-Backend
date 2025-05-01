import { Document, Types } from "mongoose";


export interface IRoute extends Document {
    routeName: string;
    origin: string;
    destination: string;
    distance: number;
    price: number;
    status: "active" | "inactive";
    subCompanyId: Types.ObjectId;
    waypoints: { latitude: number; longitude: number }[];
    createdAt: Date;
    updatedAt: Date;
}
