import { Request, Response } from 'express';
import { PayPalService } from '../services/paypal_service';
import { Booking } from '../models/booking_model';
import { seatController } from './seat_controller';
import { Types } from 'mongoose';

const paypalService = new PayPalService();

export class PayPalController {

  async webhook(req: Request, res: Response) {
    try {
      const event = req.body;
      console.log('Received PayPal webhook event:', event.event_type);

      // For testing purposes, we'll skip signature verification in sandbox mode
      if (process.env.NODE_ENV !== 'production') {
        console.log('Skipping webhook verification in sandbox mode');
      } else {
        // Verify webhook signature in production
        const isValid = await paypalService.verifyWebhookSignature(req.headers, JSON.stringify(req.body));
        if (!isValid) {
          console.error('Invalid webhook signature');
          return res.status(400).json({ message: 'Invalid webhook signature' });
        }
      }

      // Handle different webhook events
      switch (event.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':

          const bookingId = event.resource.custom_id || event.resource.reference_id;
          if (bookingId) {
            seatController.cancelScheduledRelease(bookingId);
            const booking = await Booking.findById(bookingId);
            if (booking) {
            await seatController.markSeatsAsBooked(bookingId);  
              booking.paymentStatus = 'paid';
              booking.status = 'confirmed';
              await booking.save();
              console.log(`Booking ${booking.paymentStatus} payment status updated to paid`);
            }
          }
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          console.log('Payment denied:', event.resource);
          const deniedTripId = event.resource.custom_id || event.resource.reference_id;
          break;
        case 'PAYMENT.REFUND.COMPLETED':
          console.log('Refund completed:', event.resource);
          const refundedTripId = event.resource.custom_id || event.resource.reference_id;
          break;
        default:
          console.log(`Unhandled event type: ${event.event_type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(500).json({
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async paymentSuccess(req: Request, res: Response) {
    try {
      const { token, bookingId } = req.query;
      if (!token || !bookingId) {
        return res.status(400).json({ message: "Missing token or bookingId" });
      }

      seatController.cancelScheduledRelease(new Types.ObjectId(bookingId as string));

      const session = await paypalService.capturePayment(token as string);
      console.log("Payment successful From CallBack");

      res.json({ message: "Payment successful" });
    } catch (error) {
      console.log("❌ Error in payment success", error);
      res.status(500).json({ message: "Error in payment success" });
    }
  }

  async paymentCancelled(req: Request, res: Response) {
    try {
      const { bookingId } = req.query;
      if (!bookingId) {
        return res.status(400).json({ message: "Missing tripId" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Trip not found" });
      }

      booking.paymentStatus = 'cancelled';
      await booking.save();
      console.log(`Trip ${bookingId} payment status updated to cancelled`);

      res.json({ message: "Payment cancelled" });
    } catch (error) {
      console.log("❌ Error in payment cancelled", error);
      res.status(500).json({ message: "Error in payment cancelled" });
    }
  }

}
