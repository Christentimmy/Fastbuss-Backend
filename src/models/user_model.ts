import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user_types';

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, default: null },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  assignedBus: { type: Schema.Types.ObjectId, ref: 'Bus', default: null },
  subCompanyId: { type: Schema.Types.ObjectId, ref: 'SubCompany', default: null },
  role: { type: String, enum: ['user', 'sub_admin', 'super_admin', 'staff', 'driver'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'banned', 'blocked'], default: 'inactive' },
  is_email_verified: { type: Boolean, default: false },
  one_signal_id: { type: String, default: null },
}, { timestamps: true });

export const User = mongoose.model<IUser>('Users', UserSchema);