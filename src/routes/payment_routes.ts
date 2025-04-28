import express from "express";
import { paymentController } from "../controllers/payment_controller";
import tokenValidationMiddleware from "../middlewares/token_validator";
import statusChecker from "../middlewares/status_checker";

const router = express.Router();
router.use(tokenValidationMiddleware);
router.use(statusChecker);


// ==================== PAYMENT PROCESSING ====================
router.post(
    "/create",
    paymentController.createPayment
);

router.post(
    "/confirm",
    paymentController.confirmPayment
);

// router.post(
//     "/refund",
//     paymentController.refundPayment
// );

// ==================== PAYMENT WEBHOOK ====================
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    paymentController.handleWebhook
);

// ==================== PAYMENT HISTORY ====================
router.get(
    "/history",
    paymentController.getPaymentHistory
);

router.get(
    "/:id",
    paymentController.getPayment
);

export default router; 