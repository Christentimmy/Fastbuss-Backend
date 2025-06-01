import dotenv from "dotenv";
import { generateBookingEmailTemplate, generateEmailOtpTemplate, generateEmailTemplate, generateAlertEmailTemplate } from "./email_template";
import { Resend } from "resend";
import { ITrip } from "../types/trip_types";
import { IRoute } from "../types/route_types";
import { IBus } from "../types/bus_types";
import { generatePDF } from "../utils/convert_html_to_image";
import { Types } from "mongoose";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email: string, otp: string) {
    try {
        const res = await resend.emails.send({
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

export interface Passenger {
    name: string;
    seat: string;
    price: number;
    type?: "adult" | "child",
    seatId? : Types.ObjectId | null,
}

export async function sendTicketEmail(
    userEmail: string,
    companyName: string,
    trip: ITrip,
    route: IRoute,
    bus: IBus,
    driverName: string,
    passengers: Passenger[],
    ticketNumber: string,
) {
    const html = generateBookingEmailTemplate(companyName, trip, route, bus, driverName, passengers, ticketNumber);
    // const imageBuffer = await convertHtmlToImage(html);
    const imageBuffer = await generatePDF(html);

    // Create a simple email message
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">Your FastBuss Ticket</h2>
            <p style="color: #4b5563; text-align: center; margin-bottom: 20px;">
                Thank you for booking with ${companyName}. Your ticket is attached below.
            </p>
            <p style="color: #4b5563; text-align: center; margin-top: 20px;">
                Please present this ticket to the driver when boarding. Boarding begins 15 minutes before departure.
            </p>
        </div>
    `;

    try {
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: userEmail,
            subject: "Your FastBuss Ticket Confirmation",
            attachments: [{
                filename: 'ticket.pdf',
                content: imageBuffer.toString('base64'),
                contentType: 'application/pdf'
            }],
            html: emailHtml,
        });
        return { success: true, message: "Ticket email sent successfully!", imageBuffer };
    } catch (error) {
        console.error("Error sending ticket email:", error);
        return { success: false, message: "Failed to send ticket email", imageBuffer };
    }
}

export async function sendBulkEmail(emails: string[], subject: string, recipientName: string, message: string) {
    try {
        // Send emails in parallel using Promise.all
        const emailPromises = emails.map(email => 
            resend.emails.send({
                from: process.env.RESEND_FROM!,
                to: email,
                subject: subject,
                html: generateEmailTemplate("FastBuss", recipientName, message),
            })
        );

        const results = await Promise.all(emailPromises);
        
        // Count successful and failed emails
        const successful = results.filter(result => result.error === null).length;
        const failed = results.filter(result => result.error !== null).length;

        return {
            success: true,
            message: `Bulk email sent successfully. ${successful} delivered, ${failed} failed.`,
            data: {
                total: emails.length,
                successful,
                failed
            }
        };
    } catch (error) {
        console.error("Error sending bulk email:", error);
        return {
            success: false,
            message: "Failed to send bulk email",
            error
        };
    }
}