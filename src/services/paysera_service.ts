import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

async function generatePayseraSignature(data: any) {
    const sortedParams = Object.keys(data).sort().reduce((acc: any, key: any) => {
        acc[key] = data[key];
        return acc;
    }, {});

    const encodedParams = new URLSearchParams(sortedParams).toString();
    if (!process.env.PAYSERA_PASSWORD) {
        throw new Error('PAYSERA_PASSWORD environment variable is not defined');
    }

    return crypto
        .createHmac('sha256', process.env.PAYSERA_PASSWORD)
        .update(encodedParams)
        .digest('hex');
}

async function makePayseraRequest(endpoint: string, data: any) {
    if (!process.env.PAYSERA_BASE_URL) {
        throw new Error('PAYSERA_BASE_URL environment variable is not defined');
    }

    const signature = await generatePayseraSignature(data);
    const baseUrl = process.env.PAYSERA_BASE_URL;

    try {
        console.log('Making Paysera request with data:', {
            url: `${baseUrl}${endpoint}`,
            data: { ...data, signature }, // Log data without sensitive info
            headers: {
                'Authorization': `Bearer ${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const response = await axios.post(`${baseUrl}${endpoint}`, data, {
            headers: {
                'Authorization': `Bearer ${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('Paysera response:', response.data);
        return response;
    } catch (error: any) {
        console.error('Paysera request failed:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
}

async function verifyPayseraSignature(data: any) {
    const receivedSignature = data.signature || '';
    delete data.signature;

    const expectedSignature = await generatePayseraSignature(data);
    return crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

export async function createPayment(userId: string, tripId: string, amount: number, currency: string = 'EUR') {
    try {
            const orderId = `BUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const paymentData = {
                projectid: process.env.PAYSERA_PROJECT_ID,
                orderid: orderId,
            amount: (amount * 100).toFixed(0), // Convert to cents
            currency: currency,
                accepturl: process.env.PAYSERA_ACCEPT_URL,
                cancelurl: process.env.PAYSERA_CANCEL_URL,
                callbackurl: process.env.PAYSERA_CALLBACK_URL,
                test: process.env.NODE_ENV !== 'production' ? 1 : 0,
            payment: 'paysera'
        };

        // Use root endpoint for payment creation
        const response = await makePayseraRequest('/', paymentData);

        if (!response.data?.redirect_url) {
            throw new Error('Failed to get redirect URL from Paysera');
        }

            // Store payment details in database
        // TODO: Implement savePaymentDetails
        console.log('Saving payment details:', {
            userId,
            tripId,
            orderId,
            amount,
            currency,
                status: 'pending',
                payseraPaymentId: response.data?.id || null,
                createdAt: new Date()
            });

            return {
                success: true,
            redirectUrl: response.data.redirect_url,
                orderId: orderId,
                paymentId: response.data?.id
            };
    } catch (error: any) {
            console.error('Payment creation failed:', error);
            throw new Error(`Failed to create payment: ${error.message}`);
        }
}

export async function verifyPaymentCallback(data: any) {
    try {
        const isValid = await verifyPayseraSignature(data);

        if (!isValid) {
            throw new Error('Invalid signature in callback data');
        }

        const paymentStatus = data.status || 'unknown';

        // TODO: Implement updatePaymentStatus
        console.log(`Updating payment status for order ${data.orderid} to ${paymentStatus}`);

        if (paymentStatus === 'confirmed' || paymentStatus === '1') {
            // TODO: Implement updateBookingStatus
            console.log(`Updating booking status for order ${data.orderid} to confirmed`);
        }

        return {
            success: true,
            status: paymentStatus,
            orderId: data.orderid
        };
    } catch (error: any) {
        console.error('Payment verification failed:', error);
        throw new Error(`Failed to verify payment: ${error.message}`);
    }
}

export async function getPaymentStatus(orderId: string) {
    try {
        const response = await makePayseraRequest('/payment/status', { orderid: orderId });

        return {
            success: true,
            status: response.data?.status,
            paymentData: response.data
        };
    } catch (error: any) {
        console.error('Payment status check failed:', error);
        throw new Error(`Failed to check payment status: ${error.message}`);
    }
}

export async function handleWebhook(data: any) {
    try {
        // Verify the webhook signature
        const isValid = await verifyPayseraSignature(data);
        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        const {
            orderid,
            status,
            projectid,
            payment,
            paytext,
            test,
            version,
            type,
            payamount,
            paycurrency,
            p_email,
            p_firstname,
            p_lastname
        } = data;

        // Validate project ID
        if (projectid !== process.env.PAYSERA_PROJECT_ID) {
            throw new Error('Invalid project ID');
        }

        // Process different webhook types
        switch (type) {
            case 'payment':
                // Handle payment status updates
                if (status === '1' || status === 'confirmed') {
                    // Payment successful
                    console.log(`Payment successful for order ${orderid}`);
                    // TODO: Update booking status to confirmed
                } else if (status === '0' || status === 'pending') {
                    // Payment pending
                    console.log(`Payment pending for order ${orderid}`);
                } else if (status === '2' || status === 'cancelled') {
                    // Payment cancelled
                    console.log(`Payment cancelled for order ${orderid}`);
                    // TODO: Update booking status to cancelled
                }
                break;
            case 'refund':
                // Handle refund notifications
                console.log(`Refund processed for order ${orderid}`);
                // TODO: Update booking status to refunded
                break;
            default:
                console.log(`Unhandled webhook type: ${type}`);
        }

        return {
            success: true,
            orderId: orderid,
            status: status,
            type: type
        };
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        throw new Error(`Failed to process webhook: ${error.message}`);
    }
}

