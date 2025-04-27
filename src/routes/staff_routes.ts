import express from "express";
import tokenValidationMiddleware from "../middlewares/token_validator";
import statusChecker from "../middlewares/status_checker";
import { roleMiddleware } from "../middlewares/role_middleware";
import { subCompanyController } from "../controllers/sub_company_controller";

const router = express.Router();

// Middleware for staff authentication and status check
router.use(tokenValidationMiddleware);
router.use(statusChecker);
router.use(roleMiddleware(["super_admin", "sub_admin", "staff"]));

// Bus Management - View Only
router.get("/buses", subCompanyController.getMyBuses);
router.get("/available-buses", subCompanyController.getAvailableBuses);
router.get("/active-trips", subCompanyController.getAllActiveTrips);

// Driver Management - View Only
router.get("/drivers", subCompanyController.getMyDrivers);
router.get("/available-drivers", subCompanyController.getAvailableDrivers);
router.get("/driver-schedules/:driverId", subCompanyController.getDriverSchedules);

// Route Management - View Only
router.get("/all-routes", subCompanyController.getAllRoutesBySubCompany);

// Company Profile - View Only
router.get("/company-profile", subCompanyController.getCompanyProfile);

export default router; 