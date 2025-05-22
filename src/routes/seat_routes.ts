import express from "express";
import { seatController } from "../controllers/seat_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import { roleMiddleware } from "../middlewares/role_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);
// ==================== USER SEAT ROUTES ====================

// router.post(
//     "/reserve/:tripId",
//     seatController.reserveSeats
// );

router.post(
    "/release/:tripId",
    seatController.releaseSeats
);

router.post(
    "/book/:tripId",
    seatController.markSeatsAsBooked
);

// ==================== ADMIN SEAT ROUTES ====================
router.post(
    "/initialize",
    roleMiddleware(["super_admin", "sub_admin"]),
    seatController.initializeSeats
);

export default router; 