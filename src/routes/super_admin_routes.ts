

import express from "express";
import tokenValidationMiddleware from "../middlewares/token_validator";
import statusChecker from "../middlewares/status_checker";
import { roleMiddleware } from "../middlewares/role_middleware";
import { superAdminController } from "../controllers/super_admin_controller";
import { uploadImage } from "../middlewares/upload_middleware";

const router = express.Router();

router.use(tokenValidationMiddleware);
router.use(statusChecker);
router.use(roleMiddleware(["super_admin"]));

router.post("/create-sub-company", uploadImage.single("logo"), superAdminController.createCompany);
router.get("/list-sub-companies", superAdminController.list);

export default router;
