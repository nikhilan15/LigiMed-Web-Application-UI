import app from '../../index.js';
import { TestRunner, makeRequest } from '../run_enterprise_tests.js';
import { resetMockStore } from '../../database/initDb.js';

export async function runSuite16To20() {
  const suites = [];
  await resetMockStore();

  const pharmLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234', role: 'pharmacy' });
  const pTok = pharmLogin.body.token;

  const dealLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'dealer1@ligimed.com', password: 'Pointbreak1234', role: 'dealer' });
  const dTok = dealLogin.body.token;

  // ============================================================
  // SUITE 16: Payment Server-Side Verification & Idempotency
  // ============================================================
  const runner16 = new TestRunner('16_payment_server_verification');

  // Client attempts to pass a tampered price total ($1) for 10 units of Dolo (cost ₹1000)
  const tamperedOrder = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 10, price: 1.00 }], // Client passes fake $1 unit price
    totalAmount: 10.00
  }, { Authorization: `Bearer ${pTok}` });

  runner16.assertEqual(tamperedOrder.status, 201, 'Order created');
  runner16.assertEqual(tamperedOrder.body.orders[0].items[0].unitPrice, 100.00, 'Server recalculated unit price to true catalog price (₹100)');
  runner16.assertEqual(tamperedOrder.body.orders[0].total_amount, 1120.00, 'Server recalculated grand total with GST (₹1120), ignoring tampered client payload');

  suites.push(runner16);

  // ============================================================
  // SUITE 17: BNPL Credit Limit & Ledger Enforcement
  // ============================================================
  const runner17 = new TestRunner('17_bnpl_credit_limit');

  // Current state: Limit = ₹50,000, Used = ₹20,000, Available = ₹30,000
  // Test 1: Try purchase of ₹35,000 -> Exceeds available credit -> REJECTED
  const overLimit = await makeRequest(app, 'POST', '/api/bnpl/drawdown', {
    amount: 35000.00,
    invoiceNo: 'INV-TEST-OVER'
  }, { Authorization: `Bearer ${pTok}` });
  runner17.assertEqual(overLimit.status, 400, 'Drawdown exceeding available credit limit rejected with HTTP 400');

  // Test 2: Try purchase of ₹30,000 -> Exactly available credit -> ALLOWED
  const exactLimit = await makeRequest(app, 'POST', '/api/bnpl/drawdown', {
    amount: 30000.00,
    invoiceNo: 'INV-TEST-EXACT'
  }, { Authorization: `Bearer ${pTok}` });
  runner17.assertEqual(exactLimit.status, 200, 'Drawdown within available credit limit approved with HTTP 200');
  runner17.assertEqual(exactLimit.body.availableCredit, 0, 'Available credit updated to ₹0');
  runner17.assertEqual(exactLimit.body.usedCredit, 50000.00, 'Used credit updated to ₹50,000');

  suites.push(runner17);

  // ============================================================
  // SUITE 18: Returns & Credit Note Decisioning
  // ============================================================
  const runner18 = new TestRunner('18_returns_reverse_logistics');

  // Test 1: Submit return request with valid reason
  const retReq = await makeRequest(app, 'POST', '/api/logistics/returns/submit', {
    orderId: 101,
    reason: 'Damaged medicine',
    refundAmount: 2500.00
  }, { Authorization: `Bearer ${pTok}` });
  runner18.assertEqual(retReq.status, 201, 'Return request HTTP 201');
  const retNo = retReq.body.returnNumber;

  // Test 2: Dealer Rejection
  const rejectRes = await makeRequest(app, 'POST', `/api/logistics/returns/${retNo}/decision`, {
    decision: 'reject'
  }, { Authorization: `Bearer ${dTok}` });
  runner18.assertEqual(rejectRes.status, 200, 'Dealer return decision HTTP 200');
  runner18.assertEqual(rejectRes.body.status, 'rejected', 'Return status updated to rejected');
  runner18.assertEqual(rejectRes.body.creditNoteIssued, false, 'No credit note issued on rejection');

  // Test 3: Dealer Approval -> Credit Note Issued
  const retReq2 = await makeRequest(app, 'POST', '/api/logistics/returns/submit', {
    orderId: 101,
    reason: 'Wrong medicine',
    refundAmount: 1800.00
  }, { Authorization: `Bearer ${pTok}` });
  const retNo2 = retReq2.body.returnNumber;

  const approveRes = await makeRequest(app, 'POST', `/api/logistics/returns/${retNo2}/decision`, {
    decision: 'approve'
  }, { Authorization: `Bearer ${dTok}` });
  runner18.assertEqual(approveRes.status, 200, 'Dealer return approval HTTP 200');
  runner18.assertEqual(approveRes.body.creditNoteIssued, true, 'Credit note issued on approval');
  runner18.assert(Boolean(approveRes.body.creditNoteNumber), 'Valid Credit Note number generated');

  suites.push(runner18);

  // ============================================================
  // SUITE 19: Compliance Document Expiry (<30 days EXPIRING_SOON)
  // ============================================================
  const runner19 = new TestRunner('19_document_expiry_30day');

  const now = new Date();
  const d15Str = new Date(now.getTime() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const d45Str = new Date(now.getTime() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0];

  // Test 1: Document expiring in 15 days -> EXPIRING_SOON
  const exp15 = await makeRequest(app, 'GET', `/api/kyc/expiry-check?expiryDate=${d15Str}`);
  runner19.assertEqual(exp15.body.status, 'EXPIRING_SOON', 'Document expiring in 15 days flagged as EXPIRING_SOON');

  // Test 2: Document expiring in 45 days -> VALID
  const exp45 = await makeRequest(app, 'GET', `/api/kyc/expiry-check?expiryDate=${d45Str}`);
  runner19.assertEqual(exp45.body.status, 'VALID', 'Document expiring in 45 days flagged as VALID');

  suites.push(runner19);

  // ============================================================
  // SUITE 20: AI Inventory Forecasting & Manual Approval Guard
  // ============================================================
  const runner20 = new TestRunner('20_ai_stockout_manual_approval');

  const aiRes = await makeRequest(app, 'GET', '/api/inventory/forecasting', {}, { Authorization: `Bearer ${pTok}` });
  runner20.assertEqual(aiRes.status, 200, 'AI forecasting HTTP 200');
  runner20.assert(aiRes.body.recommendations.length > 0, 'Recommendations returned');

  const doloRec = aiRes.body.recommendations.find(r => r.productId === 101);
  runner20.assertEqual(doloRec.requiresManualApproval, true, 'AI recommendations strictly require manual approval');
  runner20.assertEqual(doloRec.autoPurchaseEnabled, false, 'Automatic purchasing disabled for safety');
  runner20.assertEqual(doloRec.estimatedStockoutDays, Math.round((doloRec.currentStock / doloRec.avgDailySales) * 10) / 10, 'Stockout days estimated via formula (Stock / Daily Sales)');

  suites.push(runner20);

  return suites;
}
