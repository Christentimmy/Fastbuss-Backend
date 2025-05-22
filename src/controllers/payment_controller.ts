import { Request, Response } from "express";
import { Booking } from "../models/booking_model";
import { Payment } from '../models/payment_model';
// import { createPayment, handleWebhook } from '../services/paysera_service';
import { PayPalService } from '../services/paypal_service';
import Trip  from "../models/trip_model";




export const paymentController = {
    // ==================== PAYMENT PROCESSING ====================
    createPayment: async (req: Request, res: Response) => {
        // try {
        //     const { tripId, amount } = req.body;
        //     const user = res.locals.user;

        //     if (!tripId || !amount) {
        //         return res.status(400).json({ error: 'Trip ID and amount are required' });
        //     }

        //     const trip = await Trip.findById(tripId);
        //     if (!trip) {
        //         return res.status(404).json({ error: 'Trip not found' });
        //     }

        //     const result = await PayPalService.createPayment(amount);
        //     res.json(result);
        // } catch (error) {
        //     console.error('Error creating payment:', error);
        //     res.status(500).json({ error: 'Failed to create payment' });
        // }
    },

    confirmPayment: async (req: Request, res: Response) => {
        // try {
        //     const { paymentIntentId } = req.body;

        //     const result = await PayseraService.confirmPayment(paymentIntentId);

        //     if (result.success) {
        //         // Send payment confirmation email
        //         const booking = await Booking.findById(result.payment.booking)
        //             .populate("user", "name email one_signal_id");

        //         if (booking && booking.user) {
        //             const message = `Your payment has been confirmed.\n
        //             Booking Details:\n
        //             Ticket Number: ${booking.ticketNumber}\n
        //             Amount: ${result.payment.amount}\n
        //             Thank you for choosing our service!`;

        //             await sendEmail(
        //                 (booking.user as any).email,
        //                 "Payment Confirmation",
        //                 (booking.user as any).name,
        //                 message
        //             );

        //             if ((booking.user as any).one_signal_id) {
        //                 await sendPushNotification(
        //                     (booking.user as any).one_signal_id,
        //                     "Payment Confirmed",
        //                     message
        //                 );
        //             }
        //         }
        //     }

        //     res.status(200).json({
        //         message: result.success ? "Payment confirmed successfully" : "Payment failed",
        //         data: result
        //     });
        // } catch (error) {
        //     console.error("confirmPayment error:", error);
        //     res.status(500).json({ message: "Internal server error" });
        // }
    },

    processRefund: async (req: Request, res: Response) => {
        // try {
        //     const { paymentId, reason } = req.body;
        //     const userId = res.locals.userId;

        //     const payment = await Payment.findById(paymentId);
        //     if (!payment) {
        //         return res.status(404).json({ message: "Payment not found" });
        //     }

        //     const booking = await Booking.findById(payment.booking);
        //     if (!booking) {
        //         return res.status(404).json({ message: "Booking not found" });
        //     }

        //     // Check if user is authorized to request refund
        //     if (booking.user.toString() !== userId) {
        //         return res.status(403).json({ message: "Unauthorized access" });
        //     }

        //     const result = await payseraService.processRefund(
        //         paymentId,
        //         payment.amount,
        //         reason
        //     );

        //     if (result.success) {
        //         // Send refund confirmation email
        //         const user = await User.findById(booking.user);
        //         if (user) {
        //             const message = `Your refund has been processed.<br>    
        //             Booking Details:<br>
        //             Ticket Number: ${booking.ticketNumber}<br>
        //             Refund Amount: ${result.refund.amount}<br>
        //             The refund will be credited to your account within 5-7 business days.`;

        //             await sendEmail(user.email, "Refund Processed", user.name, message);

        //             if (user.one_signal_id) {
        //                 await sendPushNotification(
        //                     user.one_signal_id,
        //                     "Refund Processed",
        //                     message
        //                 );
        //             }
        //         }
        //     }

        //     res.status(200).json({
        //         message: result.success ? "Refund processed successfully" : "Refund failed",
        //         data: result
        //     });
        // } catch (error) {
        //     console.error("processRefund error:", error);
        //     res.status(500).json({ message: "Internal server error" });
        // }
    },

    // ==================== PAYMENT WEBHOOK ====================
    handleWebhook: async (req: Request, res: Response) => {
        // try {
        //     const payment = await handleWebhook(req.body);
        //     res.json({ success: true, payment });
        // } catch (error) {
        //     console.error('Error handling webhook:', error);
        //     res.status(500).json({ error: 'Failed to handle webhook' });
        // }
    },

    // ==================== PAYMENT HISTORY ====================
    getPaymentHistory: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.userId;

            const bookings = await Booking.find({ user: userId });
            const bookingIds = bookings.map(booking => booking._id);

            const payments = await Payment.find({ booking: { $in: bookingIds } })
                .sort({ createdAt: -1 });

            res.status(200).json({
                message: "Payment history fetched successfully",
                data: payments
            });
        } catch (error) {
            console.error("getPaymentHistory error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getPaymentDetails: async (req: Request, res: Response) => {
        try {
            const { paymentId } = req.params;
            const userId = res.locals.userId;

            const payment = await Payment.findById(paymentId);
            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            const booking = await Booking.findById(payment.booking);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // Check if user is authorized to view this payment
            if (booking.user.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized access" });
            }

            res.status(200).json({
                message: "Payment details fetched successfully",
                data: payment
            });
        } catch (error) {
            console.error("getPaymentDetails error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getPayment: async (req: Request, res: Response) => {
        try {
            const payment = await Payment.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            res.json(payment);
        } catch (error) {
            console.error('Error getting payment:', error);
            res.status(500).json({ error: 'Failed to get payment' });
        }
    },

    // refundPayment: async (req: Request, res: Response) => {
    //     try {
    //         const { amount, reason } = req.body;
    //         const payment = await refundPayment(req.params.id, amount, reason);
    //         res.json(payment);
    //     } catch (error) {
    //         console.error('Error refunding payment:', error);
    //         res.status(500).json({ error: 'Failed to refund payment' });
    //     }
    // }
}; 