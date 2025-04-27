import express from "express";
import tokenValidationMiddleware from "../middlewares/token_validator";
import statusChecker from "../middlewares/status_checker";
import { roleMiddleware } from "../middlewares/role_middleware";
import { subCompanyController } from "../controllers/sub_company_controller";
import { uploadImage } from "../middlewares/upload_middleware";

const router = express.Router();

router.use(tokenValidationMiddleware);
router.use(statusChecker);
router.use(roleMiddleware(["sub_admin", "super_admin"]));

// Bus Management
router.post("/create-bus", subCompanyController.createBus);
router.put("/deactivate-bus/:busId", subCompanyController.deactivateBus);
router.put("/activate-bus/:busId", subCompanyController.activateBus);
router.put("/bus-maintenance/:busId", subCompanyController.busMaintenance);
router.put("/bus-back-from-maintenance/:busId", subCompanyController.busBackFromMaintenance);

// Driver Management
router.post("/create-driver", uploadImage.single("profilePicture"), subCompanyController.createDriver);
router.put("/update-driver/:driverId", subCompanyController.updateDriver);
router.put("/ban-driver/:driverId", subCompanyController.banDriver);
router.put("/unban-driver/:driverId", subCompanyController.unbanDriver);
router.put("/delete-driver/:driverId", subCompanyController.deleteDriver);
router.put("/assign-driver-to-bus", subCompanyController.assignDriverToBus);
router.put("/unassign-driver-from-bus/:busId", subCompanyController.unassignDriverFromBus);
router.get("/get-all-drivers-with-no-bus", subCompanyController.getAllDriversWithNoBus);

// Route Management
router.post("/create-route", subCompanyController.createRoute);
router.put("/update-route/:routeId", subCompanyController.updateRoute);
router.post("/create-route-schedule", subCompanyController.createRouteSchedule);
router.put("/change-bus-in-schedule", subCompanyController.changeBusInSchedule);
router.put("/deactivate-route/:routeId", subCompanyController.deactivateRoute);
router.put("/activate-route/:routeId", subCompanyController.activateRoute);
router.delete("/delete-route/:routeId", subCompanyController.deleteRoute);

// Company Profile Management
router.put("/update-company-profile", uploadImage.single("logo"), subCompanyController.updateCompanyProfile);

// Staff Management
router.post("/create-staff", subCompanyController.createStaff);
router.get("/list-all-staff", subCompanyController.listAllStaff);
router.put("/update-staff/:staffId", subCompanyController.updateStaff);
router.delete("/delete-staff/:staffId", subCompanyController.deleteStaff);
router.put("/block-staff/:staffId", subCompanyController.blockStaff);
router.put("/unblock-staff/:staffId", subCompanyController.unblockStaff);

export default router;
