import express from "express";
import { supportTicketController } from "../controllers/support_ticket_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import statusChecker from "../middlewares/status_checker";
import { uploadImage } from "../middlewares/upload_middleware";
import { roleMiddleware } from "../middlewares/role_middleware";

const router = express.Router();
router.use(tokenValidationMiddleware);
router.use(statusChecker);

// User routes
router.post("/create-ticket", uploadImage.array('attachments', 5), supportTicketController.createTicket);
router.get("/my-tickets", supportTicketController.getUserTickets);

// Admin routes
router.use(roleMiddleware(["sub_admin", "super_admin"]));
router.get("/all-tickets", supportTicketController.getAllTickets);
router.patch("/update-status", supportTicketController.updateStatus);

// This route should be last to avoid catching other routes
router.get("/:ticketId", supportTicketController.getTicket);

export default router; 