import { verifyGSTIN, verifyPAN, verifyDrugLicense } from '../services/kycService.js';
import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { logger } from '../config/logger.js';

export function evaluateDocumentExpiry(expiryDateStr) {
  if (!expiryDateStr) return { status: 'VALID', daysRemaining: 365 };

  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

  if (diffDays <= 0) {
    return { status: 'EXPIRED', daysRemaining: diffDays, flag: 'EXPIRED' };
  } else if (diffDays <= 30) {
    return { status: 'EXPIRING_SOON', daysRemaining: diffDays, flag: 'EXPIRING_SOON' };
  } else {
    return { status: 'VALID', daysRemaining: diffDays, flag: 'VALID' };
  }
}

export async function submitKYC(req, res) {
  try {
    const { gstin, pan, drugLicense, documentExpiryDate, userId = (req.user ? req.user.id : 1) } = req.body;

    logger.info(`Received KYC verification request for User ${userId}`);

    const gstResult = gstin ? await verifyGSTIN(gstin) : null;
    const panResult = pan ? await verifyPAN(pan) : null;
    const drugResult = drugLicense ? await verifyDrugLicense(drugLicense) : null;

    const expiryEval = evaluateDocumentExpiry(documentExpiryDate);

    const isVerified = Boolean(
      (gstResult ? gstResult.verified : true) &&
      (panResult ? panResult.verified : true) &&
      (drugResult ? drugResult.verified : true) &&
      expiryEval.status !== 'EXPIRED'
    );

    const status = isVerified ? 'verified' : 'rejected';

    if (isDbConnected()) {
      await query(
        `INSERT INTO kyc_records (user_id, gstin, pan, drug_license, status) VALUES (?, ?, ?, ?, ?)`,
        [userId, gstin || '', pan || '', drugLicense || '', status]
      );
      await query('UPDATE users SET is_kyc_verified = ? WHERE id = ?', [isVerified ? 1 : 0, userId]);
    } else {
      mockDbStore.kyc.push({
        id: Date.now(),
        user_id: userId,
        gstin,
        pan,
        drug_license: drugLicense,
        expiryDate: documentExpiryDate,
        expiryStatus: expiryEval.status,
        status
      });
    }

    return res.json({
      success: true,
      status: status,
      isVerified: isVerified,
      documentExpiry: expiryEval,
      details: {
        gst: gstResult,
        pan: panResult,
        drugLicense: drugResult
      }
    });
  } catch (err) {
    logger.error(`KYC submission error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'KYC Verification process failed' });
  }
}

export async function checkDocumentExpiry(req, res) {
  try {
    const { expiryDate } = req.query;
    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'expiryDate parameter is required' });
    }

    const evaluation = evaluateDocumentExpiry(expiryDate);
    return res.json({
      success: true,
      expiryDate,
      ...evaluation
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate document expiry' });
  }
}

export async function getKYCStatus(req, res) {
  try {
    const userId = req.params.userId || (req.user ? req.user.id : 1);
    if (isDbConnected()) {
      const records = await query('SELECT * FROM kyc_records WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
      if (records && records.length > 0) {
        return res.json({ success: true, kyc: records[0] });
      }
    }
    const record = mockDbStore.kyc.find(k => k.user_id === Number(userId)) || mockDbStore.kyc[0];
    return res.json({ success: true, kyc: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC status' });
  }
}

