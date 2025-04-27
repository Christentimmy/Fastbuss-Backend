import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import {User} from "../models/user_model";

const authenticateSocket = async (socket: Socket, next: (err?: any) => void) => {
    try {
        const token = socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
            next(new Error("Authentication error: No token provided"));
            return;
        }

        // Verify the token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        const user = await User.findById(decoded.id);

        if (!user) {
            next(new Error("Authentication error: User not found"));
            return;
        }

        socket.data.user = user;
        next();
    } catch (error) {
        next(new Error("Authentication error: Invalid token"));
        console.table(error);
    }
};

export default authenticateSocket;

