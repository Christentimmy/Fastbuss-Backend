import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user_types';

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  subCompanyId: { type: Schema.Types.ObjectId, ref: 'SubCompany', default: null },
  role: { type: String, enum: ['user', 'sub_admin', 'super_admin', 'staff', 'driver'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'banned', 'blocked'], default: 'active' },
  is_email_verified: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<IUser>('Users', UserSchema);