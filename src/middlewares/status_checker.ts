import { Types } from 'mongoose';
import { User } from '../models/user_model';
import { Response, Request, NextFunction } from 'express';


async function statusChecker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = res.locals.userId;

        const isObjectId = Types.ObjectId.isValid(userId);

        if (!isObjectId) {
            res.status(400).json({ message: "Invalid user id" });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user?.is_email_verified) {
            res.status(400).send({ message: "user email is not verified" });
            return;
        }
        if (user.status === 'banned' || user.status === "blocked") {
            res.status(400).send({ message: "Account banned" });
            return;
        }
 
        res.locals.userId = userId;
        res.locals.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export default statusChecker;