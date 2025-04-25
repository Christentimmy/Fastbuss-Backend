
import jwt from 'jsonwebtoken';
import { IUser } from '../types/user_types';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '2d' }
  );
};
