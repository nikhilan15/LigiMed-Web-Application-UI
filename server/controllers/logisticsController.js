import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { logger } from '../config/logger.js';
import { sendDispatchOTPEmail } from '../services/emailService.js';

export const LOGISTICS_LIFECYCLE = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: []
};

export async function getShipmentTracking(req, res) {
  try {
    const trackingNumber = req.params.trackingNumber || 'LM-TRACK-9901';

    if (isDbConnected()) {
      const shipments = await query('SELECT * FROM shipments WHERE tracking_number = ?', [trackingNumber]);
      if (shipments && shipments.length > 0) {
        return res.json({ success: true, shipment: shipments[0] });
      }
    }

    let mockShipment = mockDbStore.shipments.find(s => s.tracking_number === trackingNumber);
    if (!mockShipment) {
      mockShipment = {
        id: 1,
        tracking_number: trackingNumber,
        order_id: 101,
        carrier: 'LigiMed Express ColdChain',
        origin: 'Apex Wholesale Hub, Chennai, TN',
        destination: 'MediCare Pharmacy, Madurai, TN',
        driver_id: 4,
        status: 'ASSIGNED',
        otp_code: '582910',
        failed_otp_attempts: 0,
        temperature_celsius: 4.5,
        humidity_percent: 45
      };
      mockDbStore.shipments.unshift(mockShipment);
    }

    return res.json({
      success: true,
      shipment: {
        ...mockShipment,
        telemetry: [
          { time: '10:00 AM', temp: 4.1, humidity: 45, status: 'normal' },
          { time: '11:00 AM', temp: 4.3, humidity: 44, status: 'normal' },
          { time: '12:00 PM', temp: 4.6, humidity: 46, status: 'normal' },
          { time: '01:00 PM', temp: 4.2, humidity: 44, status: 'normal' }
        ]
      }
    });
  } catch (err) {
    logger.error(`Get tracking error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch shipment tracking' });
  }
}

export async function updateShipmentStatus(req, res) {
  try {
    const { trackingNumber } = req.params;
    const { status: newStatus, driverId } = req.body;

    const shipment = mockDbStore.shipments.find(s => s.tracking_number === trackingNumber || s.id === Number(trackingNumber));
    if (!shipment) {
      return res.status(404).json({ success: false, message: `Shipment '${trackingNumber}' not found` });
    }

    // Driver Authorization Check
    if (driverId && shipment.driver_id && Number(driverId) !== Number(shipment.driver_id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver. Driver ID mismatch.' });
    }

    const currentStatus = shipment.status || 'ASSIGNED';
    const allowedNext = LOGISTICS_LIFECYCLE[currentStatus] || [];

    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid logistics transition from '${currentStatus}' to '${newStatus}'. Permitted next states: [${allowedNext.join(', ')}]`
      });
    }

    shipment.status = newStatus;
    if (isDbConnected()) {
      await query('UPDATE shipments SET status = ? WHERE tracking_number = ?', [newStatus, trackingNumber]);
    }

    return res.json({
      success: true,
      trackingNumber: shipment.tracking_number,
      previousStatus: currentStatus,
      newStatus,
      message: `Shipment status updated to ${newStatus}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update shipment status' });
  }
}

export async function verifyDeliveryOTP(req, res) {
  try {
    const { trackingNumber, otp, pharmacyId } = req.body;

    if (!trackingNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Tracking number and OTP code are required' });
    }

    let shipment = mockDbStore.shipments.find(s => s.tracking_number === trackingNumber || s.id === Number(trackingNumber));
    if (!shipment) {
      shipment = {
        id: 1,
        tracking_number: trackingNumber,
        order_id: 101,
        status: 'IN_TRANSIT',
        otp_code: '582910',
        failed_otp_attempts: 0
      };
      mockDbStore.shipments.push(shipment);
    }

    if (shipment.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Shipment has already been delivered.' });
    }

    // Check Lockout (5 wrong attempts)
    if (shipment.failed_otp_attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Delivery OTP verification locked due to 5 consecutive failed attempts. Contact dispatch admin.'
      });
    }

    const cleanOTP = String(otp).trim();
    const expectedOTP = shipment.otp_code || '582910';

    if (cleanOTP !== expectedOTP) {
      shipment.failed_otp_attempts = (shipment.failed_otp_attempts || 0) + 1;
      const remainingAttempts = 5 - shipment.failed_otp_attempts;

      return res.status(400).json({
        success: false,
        message: `Invalid delivery OTP code. ${remainingAttempts} attempts remaining before lockout.`,
        remainingAttempts
      });
    }

    // Correct OTP -> Deliver Shipment
    shipment.status = 'DELIVERED';
    shipment.failed_otp_attempts = 0;

    // Update associated order status to DELIVERED
    const associatedOrder = mockDbStore.orders.find(o => o.id === shipment.order_id || o.order_number === shipment.order_number);
    if (associatedOrder) {
      associatedOrder.shipping_status = 'DELIVERED';
    }

    // Audit Log
    mockDbStore.auditLogs.unshift({
      id: Date.now() + Math.random(),
      actor: req.user ? req.user.email : 'Logistics Driver',
      action: 'SHIPMENT_DELIVERED_OTP',
      entity: 'Shipment',
      entity_id: shipment.tracking_number,
      metadata: { otpVerified: true },
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      trackingNumber: shipment.tracking_number,
      status: 'DELIVERED',
      message: 'Delivery OTP verified successfully. Stock received and inventory recorded.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Delivery OTP verification failed' });
  }
}

export async function updateColdChainLog(req, res) {
  try {
    const { shipmentId, temperatureCelsius, humidityPercent, lat, lng } = req.body;
    const isAlert = temperatureCelsius < 2.0 || temperatureCelsius > 8.0;

    if (isAlert) {
      logger.warn(`COLD CHAIN ALARM triggered for Shipment ID ${shipmentId}! Temperature: ${temperatureCelsius}°C`);
    }

    if (isDbConnected()) {
      await query(
        `INSERT INTO cold_chain_telemetry (shipment_id, temperature_celsius, humidity_percent, is_alert, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?)`,
        [shipmentId, temperatureCelsius, humidityPercent, isAlert ? 1 : 0, lat || null, lng || null]
      );
      await query(`UPDATE shipments SET temperature_celsius = ?, humidity_percent = ? WHERE id = ?`, [temperatureCelsius, humidityPercent, shipmentId]);
    }

    return res.json({
      success: true,
      isAlert,
      message: isAlert ? 'Cold chain threshold breached! Alert logged.' : 'Cold chain telemetry updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to log cold chain telemetry' });
  }
}

export async function sendDispatchOTP(req, res) {
  try {
    const { orderId, pharmacyName, pharmacyEmail, otpCode } = req.body;
    let targetEmail = pharmacyEmail || 'pharmacy@ligimed.com';

    const generatedOtp = otpCode || '582910';
    logger.info(`Transmitting Delivery Verification OTP ${generatedOtp} for Order #${orderId} to ${targetEmail}`);

    await sendDispatchOTPEmail(targetEmail, {
      orderNumber: orderId || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      pharmacyName: pharmacyName || 'Pharmacy Partner',
      otpCode: generatedOtp
    }).catch(err => logger.warn(`OTP email send notice: ${err.message}`));

    return res.json({
      success: true,
      otpCode: generatedOtp,
      recipient: targetEmail,
      message: `Delivery Verification OTP sent to ${targetEmail}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send delivery verification OTP email' });
  }
}

