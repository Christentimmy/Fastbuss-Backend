

import { Router } from "express";
import { dashboardController } from "../controllers/dashboard_controller";
import statusChecker from "../middlewares/status_checker";
import tokenValidator from "../middlewares/token_validator";

const router = Router();

router.use(tokenValidator);
router.use(statusChecker);

router.get("/overview", dashboardController.dashboardOverview);
router.get("/recent-activities", dashboardController.recentActivities);
router.get("/upcoming-schedule", dashboardController.upcomingSchedule);


export default router;

