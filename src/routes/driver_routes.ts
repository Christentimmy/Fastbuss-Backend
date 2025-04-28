import express from "express";
import { driverController } from "../controllers/driver_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import { roleMiddleware } from "../middlewares/role_middleware";
import { uploadImage } from "../middlewares/upload_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);

// ==================== DRIVER PROFILE ROUTES ====================
router.get(
    "/profile",
    roleMiddleware(["driver"]),
    driverController.getProfile
);

router.put(
    "/profile",
    roleMiddleware(["driver"]),
    uploadImage.single("profilePicture"),
    driverController.updateProfile
);

// ==================== DRIVER BUS ROUTES ====================
router.get(
    "/bus",
    roleMiddleware(["driver"]),
    driverController.getAssignedBus
);

// ==================== DRIVER SCHEDULE ROUTES ====================
router.get(
    "/schedule",
    roleMiddleware(["driver"]),
    driverController.getSchedule
);

// ==================== DRIVER TRIP ROUTES ====================
router.get(
    "/trips",
    roleMiddleware(["driver"]),
    driverController.getTripHistory
);

router.patch(
    "/trips/:tripId/status",
    roleMiddleware(["driver"]),
    driverController.updateTripStatus
);

export default router; 