import express from "express";
import { userController } from "../controllers/user_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import { uploadImage } from "../middlewares/upload_middleware";
import statusChecker from "../middlewares/status_checker";
import { roleMiddleware } from "../middlewares/role_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);
router.use(statusChecker);
router.use(roleMiddleware(["user", "super_admin", "sub_admin"]));


// ==================== USER PROFILE ROUTES ====================
router.get("/get-user-details", userController.getProfile);
router.put("/profile", uploadImage.single("profilePicture"), userController.updateProfile);
router.get("/booked-trips", userController.getBookedTrips);
router.get("/available-trips", userController.getAvailableTrips);
router.get("/trip-history", userController.getAllTripHistory);
router.post("/book-trip", userController.altbookTrip);
router.get("/get-status", userController.getStatus);

// ==================== USER NOTIFICATION ROUTES ====================
router.put("/notification-token", userController.updateNotificationToken);

// ==================== USER ACCOUNT ROUTES ====================
router.delete("/account", userController.deleteAccount);

export default router;
