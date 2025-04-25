import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import tokenBlacklistSchema from "../models/token_blacklist_model";
import mongoose from "mongoose";

dotenv.config();

const token_secret = process.env.JWT_SECRET;
const isValidObjectId = mongoose.Types.ObjectId.isValid;

interface DecodedToken extends JwtPayload {
    id: string;
    role: string;
}

const tokenValidationMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Access denied. No token provided." });
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token || token.split(".").length !== 3) {
            res.status(400).json({ message: "Invalid token format." });
            return;
        }

        const decoded = jwt.verify(token, token_secret!) as DecodedToken;

        const isBlacklisted = await tokenBlacklistSchema.findOne({ token });
        if (isBlacklisted) {
            res.status(401).json({ message: "Token is invalid. Please log in again." });
            return;
        }

        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            res.status(401).json({ message: "Token has expired." });
            return;
        }

        if (!isValidObjectId(decoded.id)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        res.locals.userId = decoded.id;
        res.locals.role = decoded.role;

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ message: "Token has expired." });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({ message: "Invalid token." });
        } else {
            res.status(500).json({ message: "Internal server error during token validation." });
        }
        console.error("Token validation error:", error);
    }
};

export default tokenValidationMiddleware;
