
import redisClient from "../config/redis";

export const redisController = {

  saveOtpToStore: async (email: string, otp: string) => {
    try {
      let expirySeconds = Number(process.env.EXPIRYSECONDS) || 300;
      await redisClient.set(`otp:${email}`, otp, { EX: expirySeconds });
      return true;
    } catch (error) {
      console.error("Error saving OTP:", error);
      return false;
    }
  },

  getOtpFromStore: async (email: string) => {
    try {
      return await redisClient.get(`otp:${email}`);
    } catch (error) {
      console.error("Error retrieving OTP:", error);
      return null;
    }
  },

  removeOtp: async (email: string) => {
    try {
      await redisClient.del(`otp:${email}`);
      return true;
    } catch (error) {
      console.error("Error removing OTP:", error);
      return false;
    }
  },

  saveDeviationFlag: async (tripId: any) => {
    try {
      await redisClient.set(`trip:deviation:${tripId}`, 'true');
      return true;
    } catch (error) {
      console.error('Error saving deviation flag:', error);
      return false;
    }
  },

  getDeviationFlag: async (tripId: any) => {
    try {
      return await redisClient.get(`trip:deviation:${tripId}`);
    } catch (error) {
      console.error('Error getting deviation flag:', error);
      return null;
    }
  },

  removeDeviationFlag: async (tripId: any) => {
    try {
      await redisClient.del(`trip:deviation:${tripId}`);
      return true;
    } catch (error) {
      console.error('Error removing deviation flag:', error);
      return false;
    }
  },

};
