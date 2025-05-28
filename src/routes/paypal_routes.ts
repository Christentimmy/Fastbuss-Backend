import { Router } from 'express';
import { PayPalController } from '../controllers/paypal_controller';
import express from 'express';

const router = Router();
const paypalController = new PayPalController();

router.post('/webhook', paypalController.webhook.bind(paypalController));
router.get('/payment-success', paypalController.paymentSuccess.bind(paypalController));
router.get('/payment-cancelled', paypalController.paymentCancelled.bind(paypalController));

export default router; 