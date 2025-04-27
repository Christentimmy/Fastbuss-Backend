

import { Router } from "express";
import { userController } from "../controllers/user_controller";
import { uploadImage } from "../middlewares/upload_middleware";
import tokenValidationMiddleware from "../middlewares/token_validator";

const router = Router();

router.use(tokenValidationMiddleware);
router.post("/upload-profile-picture", uploadImage.single("profilePicture"), userController.uploadProfilePicture);

export default router;
