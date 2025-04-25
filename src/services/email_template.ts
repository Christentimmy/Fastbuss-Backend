

function generateEmailTemplate(otpCode: string) {
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

export default generateEmailTemplate;