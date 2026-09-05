import app from '../../index.js';
import { TestRunner, makeRequest } from '../run_enterprise_tests.js';
import { resetMockStore } from '../../database/initDb.js';

export async function runSuite11To15() {
  const suites = [];
  await resetMockStore();

  const pharmLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234', role: 'pharmacy' });
  const pTok = pharmLogin.body.token;

  const logLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'logistics@ligimed.com', password: 'Pointbreak1234', role: 'logistics' });
  const lTok = logLogin.body.token;

  // ============================================================
  // SUITE 11: Inventory Math Calculations & Reconciliation
  // ============================================================
  const runner11 = new TestRunner('11_inventory_math_reconciliation');

  // Start stock = 100
  await makeRequest(app, 'POST', '/api/inventory/update', { productId: 103, type: 'SET', quantity: 100 }, { Authorization: `Bearer ${pTok}` });

  // Purchase +50 -> 150
  const step1 = await makeRequest(app, 'POST', '/api/inventory/update', { productId: 103, type: 'PURCHASE', quantity: 50 }, { Authorization: `Bearer ${pTok}` });
  runner11.assertEqual(step1.body.newStock, 150, 'Purchase +50 => 150');

  // Sale -20 -> 130
  const step2 = await makeRequest(app, 'POST', '/api/inventory/update', { productId: 103, type: 'SALE', quantity: 20 }, { Authorization: `Bearer ${pTok}` });
  runner11.assertEqual(step2.body.newStock, 130, 'Sale -20 => 130');

  // Return +5 -> 135
  const step3 = await makeRequest(app, 'POST', '/api/inventory/update', { productId: 103, type: 'RETURN', quantity: 5 }, { Authorization: `Bearer ${pTok}` });
  runner11.assertEqual(step3.body.newStock, 135, 'Return +5 => 135');

  // Adjustment -10 -> 125
  const step4 = await makeRequest(app, 'POST', '/api/inventory/update', { productId: 103, type: 'ADJUSTMENT', quantity: -10 }, { Authorization: `Bearer ${pTok}` });
  runner11.assertEqual(step4.body.newStock, 125, 'Adjustment -10 => 125');

  suites.push(runner11);

  // ============================================================
  // SUITE 12: GST Tax Calculation (Intra-State vs Inter-State)
  // ============================================================
  const runner12 = new TestRunner('12_gst_tax_invoice');

  // Scenario 1: Pharmacy TN, Dealer TN -> Intra-state (CGST 9% + SGST 9%)
  const intraRes = await makeRequest(app, 'POST', '/api/billing/invoices/generate', {
    amount: 1000,
    buyerState: 'Tamil Nadu',
    dealerState: 'Tamil Nadu'
  }, { Authorization: `Bearer ${pTok}` });

  runner12.assertEqual(intraRes.status, 201, 'Intra-state GST calculation HTTP 201');
  runner12.assertEqual(intraRes.body.cgst, 90, 'CGST is 9% (₹90)');
  runner12.assertEqual(intraRes.body.sgst, 90, 'SGST is 9% (₹90)');
  runner12.assertEqual(intraRes.body.igst, 0, 'IGST is 0 for intra-state');
  runner12.assertEqual(intraRes.body.grandTotal, 1180, 'Grand total is ₹1180');

  // Scenario 2: Pharmacy TN, Dealer Kerala -> Inter-state (IGST 18%)
  const interRes = await makeRequest(app, 'POST', '/api/billing/invoices/generate', {
    amount: 1000,
    buyerState: 'Tamil Nadu',
    dealerState: 'Kerala'
  }, { Authorization: `Bearer ${pTok}` });

  runner12.assertEqual(interRes.status, 201, 'Inter-state GST calculation HTTP 201');
  runner12.assertEqual(interRes.body.cgst, 0, 'CGST is 0 for inter-state');
  runner12.assertEqual(interRes.body.sgst, 0, 'SGST is 0 for inter-state');
  runner12.assertEqual(interRes.body.igst, 180, 'IGST is 18% (₹180)');
  runner12.assertEqual(interRes.body.grandTotal, 1180, 'Grand total is ₹1180');

  // Rounding test (99.99 * 0.18 = 17.9982 -> rounded to 2 decimals)
  const roundRes = await makeRequest(app, 'POST', '/api/billing/invoices/generate', {
    amount: 99.99,
    buyerState: 'Tamil Nadu',
    dealerState: 'Tamil Nadu'
  }, { Authorization: `Bearer ${pTok}` });
  runner12.assertEqual(roundRes.body.grandTotal, 117.99, '2-decimal rounding test (99.99 => 117.99)');

  suites.push(runner12);

  // ============================================================
  // SUITE 13: POS Smart Billing & Mobile Links
  // ============================================================
  const runner13 = new TestRunner('13_pos_smart_billing');

  const posRes = await makeRequest(app, 'POST', '/api/billing/pos/generate', {
    customerPhone: '9876543210',
    items: [{ productId: 101, quantity: 2 }]
  }, { Authorization: `Bearer ${pTok}` });

  runner13.assertEqual(posRes.status, 201, 'POS bill generation HTTP 201');
  runner13.assert(Boolean(posRes.body.token), 'Public token generated for POS bill');
  runner13.assert(Boolean(posRes.body.publicUrl), 'Public URL provided for mobile SMS/WhatsApp link');

  // Invalid phone test
  const badPos = await makeRequest(app, 'POST', '/api/billing/pos/generate', {
    customerPhone: '12345',
    items: [{ productId: 101, quantity: 1 }]
  }, { Authorization: `Bearer ${pTok}` });
  runner13.assertEqual(badPos.status, 400, 'Invalid customer phone rejected with HTTP 400');

  suites.push(runner13);

  // ============================================================
  // SUITE 14: Public Invoice Token Security & Anti-Guessing
  // ============================================================
  const runner14 = new TestRunner('14_public_invoice_security');

  const pubToken = posRes.body.token;

  // Valid token access
  const validPub = await makeRequest(app, 'GET', `/api/billing/public/${pubToken}`);
  runner14.assertEqual(validPub.status, 200, 'Valid public token returns invoice data');

  // Guessed / Tampered token access
  const guessedToken = 'sec_tok_00000000000000000000000000000000';
  const badPub = await makeRequest(app, 'GET', `/api/billing/public/${guessedToken}`);
  runner14.assertEqual(badPub.status, 404, 'Guessed token rejected with 404 Not Found');

  suites.push(runner14);

  // ============================================================
  // SUITE 15: Logistics State Machine & OTP 5-Attempt Lockout
  // ============================================================
  const runner15 = new TestRunner('15_logistics_otp_ratelimit');

  // Step 1: ASSIGNED → PICKED_UP
  const stepLog1 = await makeRequest(app, 'PATCH', '/api/logistics/shipments/LM-TRACK-9901/status', {
    status: 'PICKED_UP'
  }, { Authorization: `Bearer ${lTok}` });
  runner15.assertEqual(stepLog1.status, 200, 'Logistics transition ASSIGNED → PICKED_UP allowed');

  // Step 2: PICKED_UP → IN_TRANSIT
  const stepLog2 = await makeRequest(app, 'PATCH', '/api/logistics/shipments/LM-TRACK-9901/status', {
    status: 'IN_TRANSIT'
  }, { Authorization: `Bearer ${lTok}` });
  runner15.assertEqual(stepLog2.status, 200, 'Logistics transition PICKED_UP → IN_TRANSIT allowed');

  // Step 3: Wrong OTP attempts (5 times -> Lockout)
  const trackNo = 'LM-TRACK-LOCKOUT-TEST';
  for (let i = 0; i < 5; i++) {
    await makeRequest(app, 'POST', '/api/logistics/verify-otp', {
      trackingNumber: trackNo,
      otp: '000000'
    }, { Authorization: `Bearer ${lTok}` });
  }

  const lockedOtp = await makeRequest(app, 'POST', '/api/logistics/verify-otp', {
    trackingNumber: trackNo,
    otp: '582910' // Even correct OTP is locked out now
  }, { Authorization: `Bearer ${lTok}` });
  runner15.assertEqual(lockedOtp.status, 429, 'Delivery OTP verification locked out after 5 failed attempts (HTTP 429)');

  suites.push(runner15);

  return suites;
}
