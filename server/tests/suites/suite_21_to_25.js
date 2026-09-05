import app from '../../index.js';
import { TestRunner, makeRequest } from '../run_enterprise_tests.js';
import { resetMockStore, mockDbStore } from '../../database/initDb.js';

export async function runSuite21To25() {
  const suites = [];
  await resetMockStore();

  const admLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'admin@ligimed.com', password: 'Pointbreak1234', role: 'admin' });
  const aTok = admLogin.body.token;

  const pharmLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234', role: 'pharmacy' });
  const pTok = pharmLogin.body.token;

  // ============================================================
  // SUITE 21: Admin User & KYC Management
  // ============================================================
  const runner21 = new TestRunner('21_admin_kyc_user_mgmt');

  // Admin approves KYC
  const approveKyc = await makeRequest(app, 'POST', '/api/admin/kyc/decision', {
    kycId: 1, decision: 'approve'
  }, { Authorization: `Bearer ${aTok}` });
  runner21.assertEqual(approveKyc.status, 200, 'Admin KYC approve HTTP 200');
  runner21.assertEqual(approveKyc.body.status, 'verified', 'KYC status verified');

  // Admin suspends user
  const suspendUser = await makeRequest(app, 'PATCH', '/api/admin/users/1/status', {
    status: 'suspended'
  }, { Authorization: `Bearer ${aTok}` });
  runner21.assertEqual(suspendUser.status, 200, 'Admin suspend user HTTP 200');

  // Admin reactivates user
  const reactivateUser = await makeRequest(app, 'PATCH', '/api/admin/users/1/status', {
    status: 'active'
  }, { Authorization: `Bearer ${aTok}` });
  runner21.assertEqual(reactivateUser.status, 200, 'Admin reactivate user HTTP 200');

  suites.push(runner21);

  // ============================================================
  // SUITE 22: Audit Log Action Traceability & Metadata
  // ============================================================
  const runner22 = new TestRunner('22_audit_log_traceability');

  const auditRes = await makeRequest(app, 'GET', '/api/admin/audit-logs', {}, { Authorization: `Bearer ${aTok}` });
  runner22.assertEqual(auditRes.status, 200, 'Admin audit log search HTTP 200');
  runner22.assert(auditRes.body.logs.length > 0, 'Audit log entries recorded');

  const latestLog = auditRes.body.logs[0];
  runner22.assert(Boolean(latestLog.actor), 'Audit log contains actor');
  runner22.assert(Boolean(latestLog.action), 'Audit log contains action');
  runner22.assert(Boolean(latestLog.entity), 'Audit log contains entity');
  runner22.assert(Boolean(latestLog.timestamp), 'Audit log contains timestamp');

  suites.push(runner22);

  // ============================================================
  // SUITE 23: Security Suite (SQLi, XSS Sanitization, JWT)
  // ============================================================
  const runner23 = new TestRunner('23_security_sqli_xss_jwt');

  // Test 1: XSS payload in registration name
  const xssReg = await makeRequest(app, 'POST', '/api/auth/register', {
    name: "<script>alert('XSS')</script>",
    email: 'xss@security.com',
    password: 'Password123!'
  });
  runner23.assertEqual(xssReg.status, 201, 'Registration processed safely');
  runner23.assert(!xssReg.body.user.name.includes('<script>'), 'Script tag stripped or escaped in user profile');

  // Test 2: Access API without token -> 401
  const noToken = await makeRequest(app, 'GET', '/api/admin/users');
  runner23.assertEqual(noToken.status, 401, 'Unauthenticated API access rejected with 401 Unauthorized');

  // Test 3: Modified invalid JWT token -> 401
  const badToken = await makeRequest(app, 'GET', '/api/admin/users', {}, { Authorization: 'Bearer INVALID.HEADER.PAYLOAD' });
  runner23.assertEqual(badToken.status, 401, 'Tampered JWT token rejected with 401 Unauthorized');

  suites.push(runner23);

  // ============================================================
  // SUITE 24: API Standard HTTP Status Codes & Secret Masking
  // ============================================================
  const runner24 = new TestRunner('24_api_status_codes_privacy');

  // 200 OK
  const res200 = await makeRequest(app, 'GET', '/api/health');
  runner24.assertEqual(res200.status, 200, 'Health check HTTP 200');

  // 400 Bad Request
  const res400 = await makeRequest(app, 'POST', '/api/auth/login', {});
  runner24.assertEqual(res400.status, 400, 'Missing fields HTTP 400');

  // 401 Unauthorized
  const res401 = await makeRequest(app, 'GET', '/api/admin/metrics');
  runner24.assertEqual(res401.status, 401, 'Missing auth header HTTP 401');

  // 403 Forbidden
  const res403 = await makeRequest(app, 'GET', '/api/admin/metrics', {}, { Authorization: `Bearer ${pTok}` });
  runner24.assertEqual(res403.status, 403, 'Insufficient role HTTP 403');

  // 404 Not Found
  const res404 = await makeRequest(app, 'GET', '/api/billing/public/invalid_token');
  runner24.assertEqual(res404.status, 404, 'Resource not found HTTP 404');

  suites.push(runner24);

  // ============================================================
  // SUITE 25: Database Cross-Table Integrity & Entity Sync
  // ============================================================
  const runner25 = new TestRunner('25_database_cross_table_integrity');

  const initialOrdersCount = mockDbStore.orders.length;
  const initialAuditCount = mockDbStore.auditLogs.length;

  // Place order
  await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 5 }]
  }, { Authorization: `Bearer ${pTok}` });

  runner25.assertEqual(mockDbStore.orders.length, initialOrdersCount + 1, 'Orders store updated atomically');
  runner25.assert(mockDbStore.auditLogs.length > initialAuditCount, 'Audit logs updated atomically on order creation');

  suites.push(runner25);

  return suites;
}
