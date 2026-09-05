import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { logger } from '../config/logger.js';

export const VALID_RETURN_REASONS = [
  'Wrong medicine',
  'Damaged medicine',
  'Short shipment',
  'Expired medicine',
  'Other'
];

export async function submitReturn(req, res) {
  try {
    const { orderId, reason, itemCondition, refundAmount } = req.body;

    if (!reason || !VALID_RETURN_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid return reason. Valid reasons: [${VALID_RETURN_REASONS.join(', ')}]`
      });
    }

    const returnNumber = `RET-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReturn = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      returnNumber,
      orderId: orderId || 101,
      orderNumber: `ORD-2026-${orderId || 101}`,
      reason,
      itemCondition: itemCondition || 'Sealed / Original Packing',
      refundAmount: Number(refundAmount || 1200.00),
      status: 'requested',
      creditNoteNumber: null,
      requestedAt: new Date().toISOString()
    };

    if (isDbConnected()) {
      await query(
        `INSERT INTO reverse_returns (return_number, order_id, reason, item_condition, refund_amount, status) VALUES (?, ?, ?, ?, ?, 'requested')`,
        [returnNumber, newReturn.orderId, reason, newReturn.itemCondition, newReturn.refundAmount]
      );
    }

    mockDbStore.returns.unshift(newReturn);

    return res.status(201).json({
      success: true,
      returnNumber,
      status: 'requested',
      message: 'Reverse logistics return request submitted successfully.'
    });
  } catch (err) {
    logger.error(`Return submission error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to submit return request' });
  }
}

export async function processReturnDecision(req, res) {
  try {
    const { returnNumber } = req.params;
    const { decision } = req.body; // 'approve' or 'reject'

    const ret = mockDbStore.returns.find(r => r.returnNumber === returnNumber || r.id === Number(returnNumber));
    if (!ret) {
      return res.status(404).json({ success: false, message: `Return request '${returnNumber}' not found` });
    }

    if (decision === 'reject') {
      ret.status = 'rejected';
      ret.creditNoteNumber = null;
      return res.json({
        success: true,
        returnNumber: ret.returnNumber,
        status: 'rejected',
        creditNoteIssued: false,
        message: 'Return request rejected by dealer. No credit note issued.'
      });
    }

    if (decision === 'approve') {
      ret.status = 'credit_note_issued';
      ret.creditNoteNumber = `CN-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      return res.json({
        success: true,
        returnNumber: ret.returnNumber,
        status: 'credit_note_issued',
        creditNoteIssued: true,
        creditNoteNumber: ret.creditNoteNumber,
        refundAmount: ret.refundAmount,
        message: 'Return approved. Reverse pickup completed, quarantine verified, credit note issued.'
      });
    }

    return res.status(400).json({ success: false, message: "Invalid decision value. Must be 'approve' or 'reject'" });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to process return decision' });
  }
}

export async function getReturns(req, res) {
  try {
    if (isDbConnected()) {
      const returns = await query('SELECT * FROM reverse_returns ORDER BY id DESC');
      if (returns) return res.json({ success: true, returns });
    }

    return res.json({ success: true, returns: mockDbStore.returns });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch returns' });
  }
}

