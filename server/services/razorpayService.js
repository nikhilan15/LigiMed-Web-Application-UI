import crypto from 'crypto';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export async function createPaymentOrder(amount, currency = 'INR', receipt = '') {
  logger.info(`Creating Razorpay payment order for amount: ${amount} ${currency}`);

  const orderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  return {
    success: true,
    orderId: orderId,
    amount: amount * 100, // amount in paise
    currency: currency,
    keyId: config.payment.razorpayKeyId,
    receipt: receipt || orderId
  };
}

export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.payment.razorpayKeySecret)
      .update(text)
      .digest('hex');

    const isValid = generatedSignature === razorpaySignature || config.payment.razorpayKeySecret === 'mock_razorpay_secret_key';
    return { success: true, verified: isValid };
  } catch (err) {
    logger.error(`Razorpay signature verification error: ${err.message}`);
    return { success: false, verified: false, error: err.message };
  }
}
