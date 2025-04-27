
import { Server } from "socket.io";
import { socketController } from "../controllers/socket_controller";
import authenticateSocket from "../middlewares/socket_middleware";

let io: Server;
export const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocket(server: any) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Apply middleware
    io.use(authenticateSocket);

    // Handle connection
    io.on("connection", async (socket) => {
        const userId = socket.data.user.id;
        console.log("User connected:", userId);

        // Check if user has an active connection
        if (onlineUsers.has(userId)) {
            const existingSocketId = onlineUsers.get(userId);
            if (existingSocketId && existingSocketId !== socket.id) {
                const existingSocket = io.sockets.sockets.get(existingSocketId);
                if (existingSocket) {
                    existingSocket.disconnect(true); // Force disconnect old socket
                }
            }
        }

        // Join user's own room for direct messages
        socket.join(userId);
        
        // Register new connection
        onlineUsers.set(userId, socket.id);

       socketController.updateBusLocation(socket);

        // Handle disconnection
        socket.on("disconnect", async () => {
            if (onlineUsers.get(userId) === socket.id) {
                onlineUsers.delete(userId);
            }
        });
    });

    return io;
}

export { io };