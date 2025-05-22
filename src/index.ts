import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { connectToDatabase } from "./config/database";
import authRoutes from "./routes/auth_routes";
import superAdminRoutes from "./routes/super_admin_routes";
import userRoutes from "./routes/user_routes";
import subCompanyRoutes from "./routes/sub_company_routes";
import staffRoutes from "./routes/staff_routes";
import { setupSocket } from "./config/socket";
import driverRoutes from "./routes/driver_routes";
import bookingRoutes from "./routes/booking_routes";
import seatRoutes from "./routes/seat_routes";
import paymentRoutes from "./routes/payment_routes";
import dashboardRoutes from "./routes/dashboard_routes";
import paypalRoutes from "./routes/paypal_routes";


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


app.use(helmet());
// app.use(cors({
//   origin: process.env.ORIGIN,
//   credentials: true,
// }));

// const origin = process.env.ORIGIN;/
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5000",
      process.env.FRONTEND_URL,
      origin?.toString(),
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use(express.json());
app.use(morgan('dev'));

connectToDatabase();

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/sub-company', subCompanyRoutes);
app.use('/api/v1/sub-company/staff', staffRoutes);
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/booking', bookingRoutes);
app.use('/api/v1/seat', seatRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/paypal', paypalRoutes);

const server = http.createServer(app);
setupSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});