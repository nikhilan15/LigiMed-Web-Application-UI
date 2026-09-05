import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';

export function getOrCreateBNPLAccount(userId = 1) {
  const uid = Number(userId);
  if (!mockDbStore.bnplAccounts.has(uid)) {
    mockDbStore.bnplAccounts.set(uid, {
      userId: uid,
      totalCreditLimit: 50000.00,
      usedCredit: 20000.00,
      availableCredit: 30000.00,
      creditScore: 780,
      status: 'active'
    });
  }
  return mockDbStore.bnplAccounts.get(uid);
}

export async function getBNPLDetails(req, res) {
  try {
    const userId = req.user ? req.user.id : 1;

    if (isDbConnected()) {
      const records = await query('SELECT * FROM bnpl_accounts WHERE user_id = ?', [userId]);
      if (records && records.length > 0) {
        return res.json({ success: true, bnpl: records[0] });
      }
    }

    const account = getOrCreateBNPLAccount(userId);

    return res.json({
      success: true,
      bnpl: {
        ...account,
        upcomingDues: [
          { id: 1, invoiceNo: 'INV-2026-902', dueDate: '2026-09-30', amount: 20000.00, status: 'Pending' }
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch BNPL credit account details' });
  }
}

export async function requestDrawdown(req, res) {
  try {
    const userId = req.user ? req.user.id : (req.body.userId || 1);
    const { amount, invoiceNo } = req.body;
    const requestedAmount = Number(amount);

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Drawdown amount must be a positive number' });
    }

    const account = getOrCreateBNPLAccount(userId);

    if (requestedAmount > account.availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Requested purchase amount (₹${requestedAmount.toLocaleString('en-IN')}) exceeds available credit limit (₹${account.availableCredit.toLocaleString('en-IN')}).`,
        totalCreditLimit: account.totalCreditLimit,
        usedCredit: account.usedCredit,
        availableCredit: account.availableCredit
      });
    }

    // Process Drawdown
    account.availableCredit -= requestedAmount;
    account.usedCredit += requestedAmount;

    if (isDbConnected()) {
      await query(
        'UPDATE bnpl_accounts SET available_credit = ?, used_credit = ? WHERE user_id = ?',
        [account.availableCredit, account.usedCredit, userId]
      );
    }

    // Audit Log
    mockDbStore.auditLogs.unshift({
      id: Date.now() + Math.random(),
      actor: req.user ? req.user.email : 'Pharmacy User',
      action: 'BNPL_DRAWDOWN_APPROVED',
      entity: 'BNPL Account',
      entity_id: String(userId),
      metadata: { requestedAmount, invoiceNo, newAvailableCredit: account.availableCredit, newUsedCredit: account.usedCredit },
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'BNPL credit drawdown approved and disbursed to seller escrow',
      amount: requestedAmount,
      invoiceNo,
      totalCreditLimit: account.totalCreditLimit,
      usedCredit: account.usedCredit,
      availableCredit: account.availableCredit
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Drawdown request failed' });
  }
}

