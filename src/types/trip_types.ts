
import { Document, Types } from "mongoose";

export interface ITrip extends Document {
  routeId: Types.ObjectId;
  departureBusStation: string;
  arrivalBusStation: string;
  busId: Types.ObjectId;
  driverId: Types.ObjectId;
  departureTime: Date;
  arrivalTime: Date;
  status: string;
  subCompanyId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
  stops: {
    location: string,
    arrivalTime: Date,
    departureTime: Date,
  }[],
  seats: ISeat[];
}

export interface ISeat {
  _id: Types.ObjectId;
  status: "available" | "booked" | "reserved";
  userId: Types.ObjectId | null;
  seatNumber: string;
  bookedAt: Date | null;
  updatedAt: Date | null;
  passengerName?: string | null; 
  reservedAt: Date | null,
  passengerType: "adult" | "child" | null,
}


