
import mongoose, { Schema} from 'mongoose';
import { ISubCompany } from '../types/sub_company_types';


const SubCompanySchema = new Schema<ISubCompany>({
  companyName: { type: String, required: true, unique: true },
  logo: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SubCompany = mongoose.model<ISubCompany>('SubCompany', SubCompanySchema);
