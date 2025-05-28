import dotenv from 'dotenv';

dotenv.config();

const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export const paypalConfig = {
  baseUrl: PAYPAL_API_URL,
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  url: process.env.FRONTEND_URL!
}; 