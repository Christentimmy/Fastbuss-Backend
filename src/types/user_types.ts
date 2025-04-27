
import { Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'sub_admin' | 'super_admin' | 'staff' | 'driver';
  profilePicture?: string | null;
  status: "active" | "inactive" | "banned" | "blocked";
  subCompanyId?: ObjectId | null;
  is_email_verified: boolean;
  one_signal_id?: string | null;
  assignedBus?: ObjectId | null;
}
