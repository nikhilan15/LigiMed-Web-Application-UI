import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || 'ligimedlogistics@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'qkwkrqnfltxhuoid';

    logger.info(`[GMAIL SMTP INITIALIZED] Using account ${smtpUser} via ${smtpHost}:${smtpPort}`);

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // port 587 uses STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const fromAddress = process.env.SMTP_FROM || '"LigiMed B2B Logistics" <ligimedlogistics@gmail.com>';
  logger.info(`Transmitting REAL Gmail to ${to}: "${subject}" from ${fromAddress}`);

  try {
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`[GMAIL REAL EMAIL SUCCESS] Sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[GMAIL SMTP ERROR] Failed to deliver email to ${to}: ${err.message}`);
    return {
      success: false,
      error: err.message,
      message: `Failed to deliver email: ${err.message}`
    };
  }
}

export async function sendOTPEmail(userEmail, otpCode) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 30px; border: 2px solid #2563eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 800; tracking-tight: -0.5px;">LigiMed</h1>
        <p style="color: #2563eb; font-size: 13px; font-weight: 600; margin-top: 4px;">AI-Powered B2B Healthcare & Pharmacy Network</p>
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; text-align: center;">
        <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0; font-weight: 700;">Your Login Verification OTP Code</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 14px 24px; border-radius: 10px; display: inline-block; font-family: monospace; border: 1px solid #bfdbfe;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 14px; font-weight: 500;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-t: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0;">Sent via LigiMed B2B Gmail Mail Engine (<a href="mailto:ligimedlogistics@gmail.com" style="color: #2563eb;">ligimedlogistics@gmail.com</a>)</p>
        <p style="margin: 4px 0 0 0;">If you did not request this email, please ignore this message.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `[LigiMed Auth] Your Verification OTP Code: ${otpCode}`,
    html
  });
}

export async function sendOrderConfirmationEmail(userEmail, orderDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb; margin-top: 0;">LigiMed B2B Logistics - Order Confirmation</h2>
      <p>Dear Pharmacy Partner,</p>
      <p>Your B2B order <strong>#${orderDetails.orderNumber}</strong> has been successfully placed!</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background: #f8fafc;">
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Order ID</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${orderDetails.orderNumber}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Total Amount</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0; color: #059669; font-weight: bold;">₹${orderDetails.totalAmount}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Payment Method</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${orderDetails.paymentMethod}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Thank you for partnering with LigiMed Healthcare Logistics.</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `[LigiMed] Order Confirmation #${orderDetails.orderNumber}`,
    html
  });
}

export async function sendDispatchOTPEmail(userEmail, orderDetails) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto; padding: 30px; border: 2px solid #2563eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 800; tracking-tight: -0.5px;">LigiMed B2B Logistics</h1>
        <p style="color: #2563eb; font-size: 13px; font-weight: 600; margin-top: 4px;">Delivery Verification Service</p>
      </div>
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 24px; border-radius: 12px; text-align: center;">
        <p style="font-size: 14px; color: #1e40af; margin: 0 0 8px 0; font-weight: 700;">Order Dispatched: #${orderDetails.orderNumber}</p>
        <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">Share this 6-digit delivery verification OTP with the courier driver upon arrival to verify delivery:</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; background-color: #ffffff; padding: 14px 24px; border-radius: 10px; display: inline-block; font-family: monospace; border: 2px dashed #3b82f6;">
          ${orderDetails.otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 14px; font-weight: 500;">
          Pharmacy Partner: <strong>${orderDetails.pharmacyName || 'Pharmacy Partner'}</strong>
        </p>
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-t: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0;">Sent via LigiMed B2B Gmail Mail Engine (<a href="mailto:ligimedlogistics@gmail.com" style="color: #2563eb;">ligimedlogistics@gmail.com</a>)</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `[LigiMed Auth] Your Verification OTP Code: ${orderDetails.otpCode} - Order #${orderDetails.orderNumber} Dispatched`,
    html
  });
}
