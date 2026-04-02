import nodemailer from "nodemailer";

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTP(email: string, otp: string) {
  const mailOptions = {
    from: `"SevaSetu Auth" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your SevaSetu Verification Code",
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SevaSetu Verification</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            padding: 32px 40px;
            text-align: center;
          }
          
          .emblem {
            height: 64px;
            width: auto;
            margin-bottom: 16px;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
          }
          
          .brand-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            margin: 0;
          }
          
          .content {
            padding: 40px;
            color: #1e293b;
            line-height: 1.6;
          }
          
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 24px;
          }
          
          .otp-container {
            background-color: #f1f5f9;
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
            border: 1px dashed #cbd5e1;
          }
          
          .otp-code {
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 12px;
            color: #2563eb;
            margin: 0;
            padding-left: 12px;
          }
          
          .expiry-note {
            font-size: 14px;
            color: #64748b;
            margin-top: 16px;
          }
          
          .footer {
            background-color: #f8fafc;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-text {
            font-size: 12px;
            color: #94a3b8;
            margin: 8px 0;
            line-height: 1.5;
          }
          
          .gov-text {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
          }

          @media only screen and (max-width: 640px) {
            .container {
              margin: 20px 10px;
            }
            .content, .header, .footer {
              padding: 24px;
            }
            .otp-code {
              font-size: 28px;
              letter-spacing: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Government of India" class="emblem">
            <h1 class="brand-name">SevaSetu</h1>
          </div>
          <div class="content">
            <p class="gov-text">Official Communication</p>
            <h2 class="title">Security Verification</h2>
            <p>A sign-in attempt to your SevaSetu account was made. Please use the following one-time password (OTP) to complete your verification:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <p class="expiry-note">Valid for the next 10 minutes</p>
            </div>
            
            <p>If you did not initiate this request, please secure your account immediately or contact our support team.</p>
          </div>
          <div class="footer">
            <p class="footer-text"><strong>SevaSetu Portal</strong><br>Digital India Initiative</p>
            <p class="footer-text">This is an automated security notification. Please do not reply to this email.</p>
            <p class="footer-text">&copy; ${new Date().getFullYear()} Government of India. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
