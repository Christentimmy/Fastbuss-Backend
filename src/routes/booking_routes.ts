import express from "express";
import { bookingController } from "../controllers/booking_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import { roleMiddleware } from "../middlewares/role_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);

// ==================== USER BOOKING ROUTES ====================
router.post(
    "/create",
    bookingController.createBooking
);

router.get(
    "/:bookingId",
    bookingController.getBookingDetails
);

router.get(
    "/user/bookings",
    bookingController.getUserBookings
);

router.put(
    "/cancel/:bookingId",
    bookingController.cancelBooking
);

router.put(
    "/payment/:bookingId",
    bookingController.updatePaymentStatus
);

// ==================== ADMIN BOOKING ROUTES ====================
router.get(
    "/admin/all",
    roleMiddleware(["super_admin", "sub_admin"]),
    bookingController.getAllBookings
);

router.get(
    "/admin/stats",
    roleMiddleware(["super_admin", "sub_admin"]),
    bookingController.getBookingStats
);

export default router; 