
import dotenv from "dotenv";
import {generateEmailOtpTemplate, generateEmailTemplate, generateAlertEmailTemplate} from "./email_template";
import { Resend } from "resend";
import { ITrip } from "@/types/trip_types";
import { IRoute } from "@/types/route_types";
import { IBus } from "@/types/bus_types";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email: string, otp: string) {
    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: "Your OTP Code",
            html: generateEmailOtpTemplate(otp),
        });
        return { success: true, message: "OTP sent successfully!" };
    } catch (error) {
        console.error("Error sending OTP:", error);
        return { success: false, message: "Failed to send OTP" };
    }
}

export async function sendEmail(email: string, companyName: string, recipientName: string, message: string) {
    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: "FastBuss",
            html: generateEmailTemplate(companyName, recipientName, message),
        });
        return { success: true, message: "OTP sent successfully!" };
    } catch (error) {
        console.error("Error sending OTP:", error);
        return { success: false, message: "Failed to send OTP" };
    }
}

export async function sendAlertEmail(companyName: string, companyEmail: string, trip: ITrip, route: IRoute, bus: IBus, driverName: string, link?: string) {
    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: companyEmail,  
            subject: "FastBuss",
            html: generateAlertEmailTemplate(companyName, trip, route, bus, driverName, link),
        });
        return { success: true, message: "Alert email sent successfully!" };
    } catch (error) {
        console.error("Error sending alert email:", error);
        return { success: false, message: "Failed to send alert email" };
    }
}