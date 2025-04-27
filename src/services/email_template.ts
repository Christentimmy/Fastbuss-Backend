
import { ITrip } from "@/types/trip_types";
import { IRoute } from "@/types/route_types";
import { IBus } from "@/types/bus_types";

export function generateEmailOtpTemplate(otpCode: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    /* Reset styles for email clients */
    body, p, div, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.4;
    }

    /* Container styles */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #f3f4f6;
      padding: 20px;
    }

    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Header styles */
    .header {
      background-color: #2563eb;
      padding: 24px;
      text-align: center;
    }

    .header img {
      height: 40px;
      margin-bottom: 8px;
    }

    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
    }

    /* Content styles */
    .content {
      padding: 32px;
      text-align: center;
    }

    .email-info {
      color: #4b5563;
      margin-bottom: 16px;
      text-align: center;
    }

    /* OTP code styles */
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      letter-spacing: 8px;
      margin: 32px 0;
      padding: 16px 0;
      background-color: #eff6ff;
      border-radius: 8px;
      display: inline-block;
      min-width: 200px;
      text-align: center;
    }

    /* Timer styles */
    .timer {
      color: #4b5563;
      margin-bottom: 32px;
      text-align: center;
    }

    .timer span {
      color: #2563eb;
      font-weight: 600;
    }

    /* Security notice styles */
    .security-notice {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 16px;
      text-align: left;
      margin-bottom: 24px;
    }

    .security-notice h3 {
      color: #1e40af;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .security-notice p {
      color: #4b5563;
      font-size: 14px;
    }

    /* Footer styles */
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px;
      text-align: center;
    }

    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .support-link {
      color: #2563eb;
      text-decoration: none;
    }

    .support-link:hover {
      text-decoration: underline;
    }

    .copyright {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 16px;
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        padding: 12px;
      }

      .content {
        padding: 24px 16px;
      }

      .otp-code {
        font-size: 24px;
        letter-spacing: 4px;
        min-width: 160px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <!-- Header -->
      <div class="header">
        <img src="https://res.cloudinary.com/dlpetmfks/image/upload/v1745613878/Logo1_n7iv0e.png" alt="Company Logo">
        <h1>Verification Code</h1>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="email-info">Please enter the verification code below to verify your identity:</p>

        <!-- OTP Code -->
        <div class="otp-code">${otpCode}</div>

        <!-- Timer -->
        <p class="timer">
          Code expires in <span>5 minutes</span>
        </p>

        <!-- Security Notice -->
        <div class="security-notice">
          <h3>Security Tip</h3>
          <p>
            Never share this code with anyone. Our representatives will never ask for your verification code.
            This code is only valid for a single use and expires after 5 minutes.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <p>Need help? <a href="#" class="support-link">Contact Support</a></p>
        <p class="copyright">&copy; 2024 Your Company Name. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateEmailTemplate(companyName: string, recipientName: string, message: string) {
  return ` 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        /* Reset default styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }

        body {
            background-color: #f0f4f8;
            padding: 20px;
        }

        /* Main container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Header section */
        .header {
            background: linear-gradient(to right, #2563eb, #3b82f6);
            padding: 32px;
            text-align: center;
        }

        .header img {
            height: 60px;
            margin-bottom: 16px;
        }

        .header h1 {
            color: white;
            font-size: 24px;
            margin-top: 8px;
        }

        /* Content section */
        .content {
            padding: 40px 32px;
            background: linear-gradient(to bottom, #ffffff, #f8fafc);
        }

        .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 24px;
        }

        .message-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            line-height: 1.6;
            color: #334155;
        }

        .signature {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #475569;
        }

        .company-name {
            font-weight: bold;
            color: #1e293b;
            margin-top: 8px;
        }

        /* Footer section */
        .footer {
            background: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .footer p {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
        }

        .copyright {
            margin-top: 16px;
            color: #94a3b8;
            font-size: 12px;
        }

        /* Responsive design */
        @media (max-width: 640px) {
            body {
                padding: 12px;
            }

            .container {
                border-radius: 8px;
            }

            .header {
                padding: 24px;
            }

            .content {
                padding: 24px 20px;
            }

            .message-box {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dlpetmfks/image/upload/v1745613878/Logo1_n7iv0e.png" alt="Company Logo">
            <h1>Important Message</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Dear ${recipientName},
            </div>

            <div class="message-box">
                ${message}
            </div>

            <div class="signature">
                <p>Best regards,</p>
                <p class="company-name">${companyName}</p>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p class="copyright">&copy; 2025 FastBuss. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `
}

export function generateAlertEmailTemplate(companyName: string, trip: ITrip, route: IRoute, bus: IBus, driverName: string, link?: string) {
  return `

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Route Deviation Alert</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .email-header {
            background-color: #1E90FF;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .email-header-text {
            flex-grow: 1;
        }
        .email-header img {
            max-height: 60px;
            max-width: 150px;
            object-fit: contain;
        }
        .email-alert {
            background-color: #FFE4E1;
            border-left: 4px solid #FF4500;
            padding: 15px;
            margin: 20px;
        }
        .email-content {
            padding: 20px;
        }
        .trip-details {
            background-color: #F5F5F5;
            border-radius: 5px;
            padding: 15px;
        }
        .detail-row {
            margin-bottom: 10px;
        }
        .detail-label {
            font-weight: bold;
            color: #333;
            margin-right: 10px;
        }
        .email-footer {
            background-color: #F5F5F5;
            padding: 15px;
            text-align: center;
            border-top: 1px solid #E0E0E0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="email-header-text">
                <h1>Route Deviation Alert</h1>
                <p>Important notification for ${companyName}</p>
            </div>
            <img src="https://res.cloudinary.com/dlpetmfks/image/upload/v1745613878/Logo1_n7iv0e.png" alt="Company Logo">
        </div>

        <div class="email-alert">
            <strong>Route Deviation Detected:</strong> Trip ID ${trip._id} has deviated from its original route.
        </div>

        <div class="email-content">
            <div class="trip-details">
                <div class="detail-row">
                    <span class="detail-label">Original Route:</span>
                    <span>${route.origin} → ${route.destination}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Deviated Route:</span>
                    <span>${route.origin} → ${bus.currentLocation?.address}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time of Deviation:</span>
                    <span>${new Date().toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Driver Name:</span>
                    <span>${driverName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vehicle ID:</span>
                    <span>${bus.plateNumber}</span>
                </div>
            </div>
        </div>

        <div class="email-footer">
            <p>This is an automated alert from your route management system.</p>
            <p>For more details, visit: <a href="${link}">${link}</a></p>
        </div>
    </div>
</body>
</html>

  `
}
