// import Stripe from "stripe";
// import { Payment } from "../models/payment_model";
// import { Booking } from "../models/booking_model";
// import { User } from "../models/user_model";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//     apiVersion: "2023-10-16"
// });

// export const paymentService = {
//     createPaymentIntent: async (bookingId: string, amount: number, currency: string = "usd") => {
//         try {
//             const booking = await Booking.findById(bookingId);
//             if (!booking) {
//                 throw new Error("Booking not found");
//             }

//             const user = await User.findById(booking.user);
//             if (!user) {
//                 throw new Error("User not found");
//             }

//             // Create or retrieve Stripe customer
//             let customerId = user.stripeCustomerId;
//             if (!customerId) {
//                 const customer = await stripe.customers.create({
//                     email: user.email,
//                     name: user.name,
//                     metadata: {
//                         userId: user._id.toString()
//                     }
//                 });
//                 customerId = customer.id;
//                 user.stripeCustomerId = customerId;
//                 await user.save();
//             }

//             // Create payment intent
//             const paymentIntent = await stripe.paymentIntents.create({
//                 amount: Math.round(amount * 100), // Convert to cents
//                 currency,
//                 customer: customerId,
//                 metadata: {
//                     bookingId: booking._id.toString(),
//                     ticketNumber: booking.ticketNumber
//                 },
//                 description: `Payment for booking ${booking.ticketNumber}`
//             });

//             // Create payment record
//             const payment = await Payment.create({
//                 booking: bookingId,
//                 amount,
//                 currency,
//                 paymentMethod: "card",
//                 status: "pending",
//                 stripePaymentId: paymentIntent.id,
//                 stripeCustomerId: customerId,
//                 metadata: {
//                     clientSecret: paymentIntent.client_secret
//                 }
//             });

//             return {
//                 clientSecret: paymentIntent.client_secret,
//                 paymentId: payment._id
//             };
//         } catch (error) {
//             console.error("createPaymentIntent error:", error);
//             throw error;
//         }
//     },

//     confirmPayment: async (paymentIntentId: string) => {
//         try {
//             const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
//             const payment = await Payment.findOne({ stripePaymentId: paymentIntentId });
//             if (!payment) {
//                 throw new Error("Payment not found");
//             }

//             if (paymentIntent.status === "succeeded") {
//                 payment.status = "succeeded";
//                 await payment.save();

//                 // Update booking status
//                 await Booking.findByIdAndUpdate(payment.booking, {
//                     status: "confirmed",
//                     paymentStatus: "paid"
//                 });

//                 return {
//                     success: true,
//                     payment
//                 };
//             } else {
//                 payment.status = "failed";
//                 await payment.save();

//                 return {
//                     success: false,
//                     payment
//                 };
//             }
//         } catch (error) {
//             console.error("confirmPayment error:", error);
//             throw error;
//         }
//     },

//     processRefund: async (paymentId: string, amount: number, reason?: string) => {
//         try {
//             const payment = await Payment.findById(paymentId);
//             if (!payment) {
//                 throw new Error("Payment not found");
//             }

//             if (payment.status !== "succeeded") {
//                 throw new Error("Payment must be successful to process refund");
//             }

//             // Create refund in Stripe
//             const refund = await stripe.refunds.create({
//                 payment_intent: payment.stripePaymentId,
//                 amount: Math.round(amount * 100), // Convert to cents
//                 reason: reason || "requested_by_customer"
//             });

//             // Update payment record
//             payment.status = "refunded";
//             payment.refundAmount = amount;
//             payment.refundReason = reason;
//             await payment.save();

//             // Update booking status
//             await Booking.findByIdAndUpdate(payment.booking, {
//                 status: "cancelled",
//                 paymentStatus: "refunded",
//                 refundAmount: amount
//             });

//             return {
//                 success: true,
//                 refund,
//                 payment
//             };
//         } catch (error) {
//             console.error("processRefund error:", error);
//             throw error;
//         }
//     },

//     handleWebhook: async (event: Stripe.Event) => {
//         try {
//             switch (event.type) {
//                 case "payment_intent.succeeded":
//                     const paymentIntent = event.data.object as Stripe.PaymentIntent;
//                     await paymentService.confirmPayment(paymentIntent.id);
//                     break;

//                 case "payment_intent.payment_failed":
//                     const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
//                     const payment = await Payment.findOne({ stripePaymentId: failedPaymentIntent.id });
//                     if (payment) {
//                         payment.status = "failed";
//                         await payment.save();
//                     }
//                     break;

//                 case "charge.refunded":
//                     const charge = event.data.object as Stripe.Charge;
//                     const refundedPayment = await Payment.findOne({ stripePaymentId: charge.payment_intent });
//                     if (refundedPayment) {
//                         refundedPayment.status = "refunded";
//                         await refundedPayment.save();
//                     }
//                     break;
//             }
//         } catch (error) {
//             console.error("handleWebhook error:", error);
//             throw error;
//         }
//     }
// }; 