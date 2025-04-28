

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
router.delete("/delete-sub-company/:companyId", superAdminController.deleteCompany);
router.put("/suspend-sub-company/:companyId", superAdminController.suspendCompany);
router.put("/activate-sub-company/:companyId", superAdminController.activateCompany);
router.put("/update-sub-company/:companyId", superAdminController.updateCompany);
router.get("/view-sub-company-details/:companyId", superAdminController.viewCompanyDetails);


export default router;
