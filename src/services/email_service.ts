

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import generateEmailTemplate from "./email_template";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email: string, otp: string) {
    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: "Your OTP Code",
            html: generateEmailTemplate(otp),
        });
        return { success: true, message: "OTP sent successfully!" };
    } catch (error) {
        console.error("Error sending OTP:", error);
        return { success: false, message: "Failed to send OTP" };
    }
}
