import axios from 'axios';
import { paypalConfig } from '../config/paypal';

export class PayPalService {

  private async getAccessToken() {
    try {
      const auth = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${paypalConfig.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createPayment(amount: number, description: string, metadata: { bookingId: string }) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${paypalConfig.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              items: [
                {
                  name: 'Bus Service Payment',
                  quantity: 1,
                  description: description,
                  unit_amount: {
                    currency_code: 'USD',
                    value: amount.toString()
                  },
                }
              ],
              amount: {
                currency_code: 'USD',
                value: amount.toString(),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: amount.toString()
                  }
                }
              },
              custom_id: metadata.bookingId,
              reference_id: metadata.bookingId
            },
          ],
          application_context: {
            return_url: `${paypalConfig.url}/api/v1/paypal/payment-success?bookingId=${metadata.bookingId}`,
            cancel_url: `${paypalConfig.url}/api/v1/paypal/payment-cancelled?bookingId=${metadata.bookingId}`,
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            landing_page: 'BILLING'
          },
          expiration_time: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Find the approval URL from the links array
      const approvalUrl = response.data.links.find((link: any) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new Error('Approval URL not found in PayPal response');
      }

      return {
        orderId: response.data.id,
        approvalUrl: approvalUrl
      };
    } catch (error: any) {
      console.error('PayPal Error Details:', error.response?.data);
      throw new Error('Failed to create PayPal payment');
    }
  }

  async capturePayment(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await axios.post(
      `${paypalConfig.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const captureId = response.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    if (!captureId) {
      throw new Error('Capture ID not found');
    }

    return {
      data: response.data,
      captureId
    };
  }

  async refundPayment(captureId: string, amount: number, currency: string = 'EUR') {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${paypalConfig.baseUrl}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            currency_code: currency,
            value: amount.toString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to process refund');
    }
  }

  async verifyWebhookSignature(headers: any, body: string) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${paypalConfig.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: body
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      throw new Error('Failed to verify webhook signature');
    }
  }

}