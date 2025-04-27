
import { Document, ObjectId, Types } from 'mongoose';

export interface ISubCompany extends Document {
    companyName: string;
    logo?: string;
    contactEmail?: string;
    contactPhone?: string;
    description?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
    createdBy: Types.ObjectId; // super_admin
    isActive: boolean;
}