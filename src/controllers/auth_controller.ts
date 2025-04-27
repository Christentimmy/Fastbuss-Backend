import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user_model';
import { IUser } from '../types/user_types';
import { generateToken } from '../utils/jwt';
import bcryptjs from 'bcryptjs';
import { redisController } from './redis_controller';
import { sendOTP } from '../services/email_service';
import tokenBlacklistSchema  from '../models/token_blacklist_model';

export const authController = {

    register: async (req: Request, res: Response) => {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password || !role) {
                res.status(400).json({ message: "Name,Email,Password and Role are required" });
                return;
            }

            if (role !== "user" && role !== "sub_admin" && role !== "super_admin" && role !== "driver" && role !== "staff") {
                res.status(400).json({ message: "Invalid role" });
                return;
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: 'Email already exists' });
                return;
            }

            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(password, salt);

            const user = new User({
                name,
                email,
                password: hashedPassword,
                role
            });

            await user.save();

            const token = generateToken(user);

            res.status(201).json({ message: 'User registered successfully', token });
        } catch (err) {
            res.status(500).json({ message: 'Registration failed', error: err });
            return;
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: "Email and Password are required" });
                return;
            }

            const user = await User.findOne({ email }) as IUser;
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }

            const token = generateToken(user);

            if (!user.is_email_verified) {
                res.status(401).json({ message: 'Email not verified', token: token });
                return;
            }

            if (user.status !== "active") {
                res.status(401).json({ message: `User account is ${user.status}`, token: token });
                return;
            }


            res.status(200).json({ message: 'Login successful', token });
            return;
        } catch (err) {
            res.status(500).json({ message: 'Login failed', error: err });
            return;
        }
    },

    sendOtp: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: "Email is required" });
                return;
            }

            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            await redisController.saveOtpToStore(email, otp);
            await sendOTP(email, otp);


            res.status(200).json({ message: "OTP sent" });
        } catch (error) {
            console.error("❌ Error in sendSignUpOtp:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    verifyOtp: async (req: Request, res: Response) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                res.status(400).json({ message: "Email and OTP are required" });
                return;
            }
            const savedOtp = await redisController.getOtpFromStore(email);
            if (!savedOtp || savedOtp !== otp) {
                res.status(400).json({ message: "Invalid or expired OTP" });
                return;
            }
            const user = await User.findOne({ email });
            if (user && user.is_email_verified === false) {
                user.is_email_verified = true;
                await user.save();
            }
            await redisController.removeOtp(email);
            res.status(200).json({ message: "OTP verified successfully" });
        } catch (error) {
            console.error("❌ Error in verifyOtp:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    deleteAccount: async ( req: Request,res: Response) => {
        try {
            const userId = res.locals.userId;
    
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            await User.findByIdAndDelete(userId);
    
            res.status(200).json({ message: "Account deleted successfully." });
        } catch (error) {
            console.error("❌ Error deleting account:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    },

    logout: async (req: Request, res: Response) =>{
        try {
            const token = req.header("Authorization")?.replace("Bearer ", "");
    
            if (!token) {
                res.status(400).json({ message: "No token provided" });
                return;
            }
            await tokenBlacklistSchema.create({ token });
    
            res.status(200).json({ message: "Logged out successfully" });
        } catch (error) {
            console.error("❌ Error logging out:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

};

