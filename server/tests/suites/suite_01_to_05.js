import app from '../../index.js';
import { TestRunner, makeRequest } from '../run_enterprise_tests.js';
import { resetMockStore } from '../../database/initDb.js';

export async function runSuite01To05() {
  const suites = [];

  // ============================================================
  // SUITE 01: Complete Business Flow
  // ============================================================
  const runner01 = new TestRunner('01_complete_business_flow');
  await resetMockStore();

  // Step 1: Pharmacy Register & Login
  const regRes = await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Apollo Pharmacy',
    email: 'apollo@pharmacy.com',
    password: 'Password123!',
    role: 'pharmacy',
    company_name: 'Apollo Healthcare',
    phone: '9876500001',
    gstin: '33AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    pincode: '600001'
  });
  runner01.assertEqual(regRes.status, 201, 'Pharmacy Registration HTTP 201');
  const pharmToken = regRes.body.token;
  runner01.assert(Boolean(pharmToken), 'JWT token returned on registration');

  // Step 2: KYC Submission
  const kycRes = await makeRequest(app, 'POST', '/api/kyc/verify', {
    gstin: '33AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    drugLicense: 'TN-CHE-2026-9999',
    documentExpiryDate: '2027-12-31'
  }, { Authorization: `Bearer ${pharmToken}` });
  runner01.assertEqual(kycRes.status, 200, 'KYC Submission HTTP 200');
  runner01.assertEqual(kycRes.body.status, 'verified', 'KYC status verified');

  // Step 3: Find medicine & Compare dealers
  const searchRes = await makeRequest(app, 'GET', '/api/marketplace/products?search=Paracetamol');
  runner01.assertEqual(searchRes.status, 200, 'Search Paracetamol HTTP 200');
  runner01.assert(searchRes.body.products.length >= 2, 'Found multiple dealer offers for Paracetamol');

  // Step 4: Add to cart & Place Order
  const orderRes = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 5 }],
    paymentMethod: 'razorpay',
    shippingAddress: '100 Mount Road, Chennai, TN'
  }, { Authorization: `Bearer ${pharmToken}` });
  runner01.assertEqual(orderRes.status, 201, 'Order Placement HTTP 201');
  const orderNo = orderRes.body.orders[0].order_number;

  // Step 5: Dealer Confirm & Pack
  const dealerLogin = await makeRequest(app, 'POST', '/api/auth/login', {
    email: 'dealer1@ligimed.com',
    password: 'Pointbreak1234'
  });
  const dealerToken = dealerLogin.body.token;

  const packRes = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${orderNo}/status`, {
    status: 'CONFIRMED'
  }, { Authorization: `Bearer ${dealerToken}` });
  runner01.assertEqual(packRes.status, 200, 'Dealer CONFIRMED status jump');

  const confirmPackRes = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${orderNo}/status`, {
    status: 'PACKED'
  }, { Authorization: `Bearer ${dealerToken}` });
  runner01.assertEqual(confirmPackRes.status, 200, 'Dealer PACKED status jump');

  // Step 6: Logistics Transport & Delivery OTP
  const logLogin = await makeRequest(app, 'POST', '/api/auth/login', {
    email: 'logistics@ligimed.com',
    password: 'Pointbreak1234'
  });
  const logToken = logLogin.body.token;

  const statusInTransit = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${orderNo}/status`, {
    status: 'IN_TRANSIT'
  }, { Authorization: `Bearer ${logToken}` });
  runner01.assertEqual(statusInTransit.status, 200, 'Logistics IN_TRANSIT status jump');

  const otpRes = await makeRequest(app, 'POST', '/api/logistics/verify-otp', {
    trackingNumber: 'LM-TRACK-9901',
    otp: '582910'
  }, { Authorization: `Bearer ${logToken}` });
  runner01.assertEqual(otpRes.status, 200, 'Logistics Delivery OTP verification HTTP 200');
  runner01.assertEqual(otpRes.body.status, 'DELIVERED', 'Shipment status updated to DELIVERED');

  suites.push(runner01);

  // ============================================================
  // SUITE 02: Pharmacy Auth & Validation
  // ============================================================
  const runner02 = new TestRunner('02_pharmacy_auth_validation');

  // Edge Case 1: Invalid Phone
  const badPhone = await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Pharmacy 1', email: 'p1@test.com', password: 'Password123!', phone: '12345'
  });
  runner02.assertEqual(badPhone.status, 400, 'Reject 5-digit phone number');

  // Edge Case 2: Invalid Email
  const badEmail = await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Pharmacy 2', email: 'not-an-email', password: 'Password123!'
  });
  runner02.assertEqual(badEmail.status, 400, 'Reject invalid email format');

  // Edge Case 3: Weak Password
  const weakPass = await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Pharmacy 3', email: 'weak@test.com', password: '123'
  });
  runner02.assertEqual(weakPass.status, 400, 'Reject password < 8 characters');

  // Edge Case 4: Invalid GSTIN
  const badGST = await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Pharmacy 4', email: 'gst@test.com', password: 'Password123!', gstin: 'INVALID-GST'
  });
  runner02.assertEqual(badGST.status, 400, 'Reject invalid GSTIN format');

  // Edge Case 5: Failed Login Lockout (5 wrong attempts)
  const lockEmail = 'lockout@test.com';
  await makeRequest(app, 'POST', '/api/auth/register', {
    name: 'Lockout User', email: lockEmail, password: 'CorrectPassword123!'
  });

  for (let i = 0; i < 5; i++) {
    await makeRequest(app, 'POST', '/api/auth/login', { email: lockEmail, password: 'WrongPassword!' });
  }

  const lockedRes = await makeRequest(app, 'POST', '/api/auth/login', { email: lockEmail, password: 'CorrectPassword123!' });
  runner02.assertEqual(lockedRes.status, 429, 'Account locked out after 5 failed login attempts');

  // Edge Case 6: Logout Revocation
  const validLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234' });
  const userTok = validLogin.body.token;

  const logoutRes = await makeRequest(app, 'POST', '/api/auth/logout', {}, { Authorization: `Bearer ${userTok}` });
  runner02.assertEqual(logoutRes.status, 200, 'Logout HTTP 200');

  const revokedAccess = await makeRequest(app, 'GET', '/api/inventory', {}, { Authorization: `Bearer ${userTok}` });
  runner02.assertEqual(revokedAccess.status, 401, 'Access denied after token revocation / logout');

  suites.push(runner02);

  // ============================================================
  // SUITE 03: RBAC Matrix Security
  // ============================================================
  const runner03 = new TestRunner('03_rbac_matrix_security');

  // Login as Pharmacy
  const pharmLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234', role: 'pharmacy' });
  const pTok = pharmLogin.body.token;

  // Login as Dealer
  const dealLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'dealer1@ligimed.com', password: 'Pointbreak1234', role: 'dealer' });
  const dTok = dealLogin.body.token;

  // Login as Admin
  const admLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'admin@ligimed.com', password: 'Pointbreak1234', role: 'admin' });
  const aTok = admLogin.body.token;

  // Test 1: Pharmacy opens Admin users URL
  const test1 = await makeRequest(app, 'GET', '/api/admin/users', {}, { Authorization: `Bearer ${pTok}` });
  runner03.assertEqual(test1.status, 403, 'Pharmacy accessing Admin users API rejected with 403 Forbidden');

  // Test 2: Dealer opens Pharmacy inventory
  const test2 = await makeRequest(app, 'GET', '/api/inventory/forecasting', {}, { Authorization: `Bearer ${dTok}` });
  runner03.assertEqual(test2.status, 403, 'Dealer accessing Pharmacy AI forecast rejected with 403 Forbidden');

  // Test 3: Pharmacy opens Dealer bulk upload API
  const test3 = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', { items: [] }, { Authorization: `Bearer ${pTok}` });
  runner03.assertEqual(test3.status, 403, 'Pharmacy executing Dealer bulk upload rejected with 403 Forbidden');

  // Test 4: Admin opens Admin metrics
  const test4 = await makeRequest(app, 'GET', '/api/admin/metrics', {}, { Authorization: `Bearer ${aTok}` });
  runner03.assertEqual(test4.status, 200, 'Admin accessing Admin metrics allowed with HTTP 200');

  suites.push(runner03);

  // ============================================================
  // SUITE 04: Medicine Search & SQL Injection
  // ============================================================
  const runner04 = new TestRunner('04_medicine_search_sqli');

  // Test 1: Exact search
  const exact = await makeRequest(app, 'GET', '/api/marketplace/products?search=Paracetamol');
  runner04.assertEqual(exact.status, 200, 'Exact search HTTP 200');
  runner04.assert(exact.body.products.some(p => p.name.includes('Paracetamol')), 'Contains Paracetamol');

  // Test 2: Case insensitivity
  const cased = await makeRequest(app, 'GET', '/api/marketplace/products?search=PaRaCeTaMoL');
  runner04.assertEqual(cased.status, 200, 'Case insensitive search HTTP 200');
  runner04.assert(cased.body.products.length > 0, 'Found case insensitive match');

  // Test 3: Composition search
  const comp = await makeRequest(app, 'GET', '/api/marketplace/products?search=Azithromycin');
  runner04.assertEqual(comp.status, 200, 'Composition search HTTP 200');
  runner04.assert(comp.body.products.some(p => p.composition.includes('Azithromycin')), 'Returns Azithromycin brand');

  // Test 4: Missing product -> clean [] output
  const missing = await makeRequest(app, 'GET', '/api/marketplace/products?search=xxxxxxxx');
  runner04.assertEqual(missing.status, 200, 'Non-existent item returns HTTP 200');
  runner04.assertEqual(missing.body.products.length, 0, 'Returns clean empty array [] without server crash');

  // Test 5: SQL Injection payload
  const sqli = await makeRequest(app, 'GET', "/api/marketplace/products?search=' OR 1=1 --");
  runner04.assertEqual(sqli.status, 200, 'SQL injection payload sanitized smoothly without error');

  suites.push(runner04);

  // ============================================================
  // SUITE 05: Dealer Catalogue & Comparison Edge Cases
  // ============================================================
  const runner05 = new TestRunner('05_dealer_catalogue_comparison');

  // Test 1: Compare multiple dealers for Paracetamol
  const compRes = await makeRequest(app, 'GET', '/api/marketplace/compare?query=Paracetamol');
  runner05.assertEqual(compRes.status, 200, 'Dealer comparison HTTP 200');
  runner05.assert(compRes.body.dealerOffers.length >= 2, 'Multiple dealer price offers returned for side-by-side comparison');

  // Test 2: Price = 0 validation
  const zeroPrice = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', {
    items: [{ name: 'Zero Price Med', mrp: 100, discounted_price: 0, stock_quantity: 50 }]
  }, { Authorization: `Bearer ${dTok}` });
  runner05.assertEqual(zeroPrice.body.rejectedCount, 1, 'Zero price row rejected');

  // Test 3: Dealer price > MRP
  const priceOverMRP = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', {
    items: [{ name: 'Over MRP Med', mrp: 100, discounted_price: 150, stock_quantity: 50 }]
  }, { Authorization: `Bearer ${dTok}` });
  runner05.assertEqual(priceOverMRP.body.rejectedCount, 1, 'Dealer price > MRP row rejected');

  // Test 4: MOQ > Stock
  const moqExceeds = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', {
    items: [{ name: 'High MOQ Med', mrp: 100, discounted_price: 80, stock_quantity: 10, moq: 50 }]
  }, { Authorization: `Bearer ${dTok}` });
  runner05.assertEqual(moqExceeds.body.rejectedCount, 1, 'MOQ > stock row rejected');

  suites.push(runner05);

  return suites;
}
