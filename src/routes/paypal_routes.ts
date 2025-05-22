import { Router } from 'express';
import { PayPalController } from '../controllers/paypal_controller';
import express from 'express';

const router = Router();
const paypalController = new PayPalController();

// // Create a new payment
// router.post('/create-payment', paypalController.createPayment.bind(paypalController));

// // Capture a payment
// router.post('/capture-payment/:orderId', paypalController.capturePayment.bind(paypalController));

// // Process a refund
// router.post('/refund/:captureId', paypalController.refundPayment.bind(paypalController));

// Webhook endpoint
router.post('/webhook', paypalController.webhook.bind(paypalController));
router.get('/payment-success', paypalController.paymentSuccess.bind(paypalController));
router.get('/payment-cancelled', paypalController.paymentCancelled.bind(paypalController));

export default router; 