import express from "express";
import { userController } from "../controllers/user_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import { uploadImage } from "../middlewares/upload_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);


// ==================== USER PROFILE ROUTES ====================
router.get("/profile", userController.getProfile);
router.put("/profile", uploadImage.single("profilePicture"), userController.updateProfile);

// ==================== USER NOTIFICATION ROUTES ====================
router.put("/notification-token", userController.updateNotificationToken);

// ==================== USER ACCOUNT ROUTES ====================
router.delete("/account", userController.deleteAccount);

export default router;
