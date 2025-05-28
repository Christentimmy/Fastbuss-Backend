import { Router } from 'express';
import { authController } from "../controllers/auth_controller";
import tokenValidationMiddleware from '../middlewares/token_validator';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/delete-account', tokenValidationMiddleware, authController.deleteAccount);
router.post('/logout', authController.logout);
router.post("/check-token", authController.validateToken);
router.post('/change-password', tokenValidationMiddleware, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
