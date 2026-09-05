import app from '../../index.js';
import { TestRunner, makeRequest } from '../run_enterprise_tests.js';
import { resetMockStore, mockDbStore } from '../../database/initDb.js';

export async function runSuite06To10() {
  const suites = [];
  await resetMockStore();

  const dealLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'dealer1@ligimed.com', password: 'Pointbreak1234', role: 'dealer' });
  const dTok = dealLogin.body.token;

  const pharmLogin = await makeRequest(app, 'POST', '/api/auth/login', { email: 'pharmacy@ligimed.com', password: 'Pointbreak1234', role: 'pharmacy' });
  const pTok = pharmLogin.body.token;

  // ============================================================
  // SUITE 06: Bulk CSV Upload Scaling & Invalid Row Reporting
  // ============================================================
  const runner06 = new TestRunner('06_bulk_csv_upload');

  // Test File B: Mixed valid & invalid rows
  const mixedCsv = `Name,MRP,Price,Stock,Expiry,Category,Manufacturer,MOQ,SKU
Product Valid 1,100,80,50,2027-12-31,General,Pharma,1,SKU-V1
Product Bad Price,-100,80,20,2027-12-31,General,Pharma,1,SKU-V2
Product Bad Stock,100,80,-10,2027-12-31,General,Pharma,1,SKU-V3
Product Bad Date,100,80,20,InvalidDate,General,Pharma,1,SKU-V4
Product Valid 2,150,110,100,2028-06-30,General,Pharma,2,SKU-V5`;

  const uploadRes = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', {
    csvData: mixedCsv
  }, { Authorization: `Bearer ${dTok}` });

  runner06.assertEqual(uploadRes.status, 201, 'Bulk CSV upload HTTP 201');
  runner06.assertEqual(uploadRes.body.importedCount, 2, 'Exactly 2 valid rows imported');
  runner06.assertEqual(uploadRes.body.rejectedCount, 3, 'Exactly 3 invalid rows rejected');
  runner06.assert(uploadRes.body.errors.length === 3, 'Detailed itemized error reports provided for rejected rows');

  // Test File D: Large dataset simulation (1,000 SKUs batch)
  const largeItems = [];
  for (let i = 1; i <= 1000; i++) {
    largeItems.push({
      name: `Mass Item ${i}`,
      mrp: 200,
      discounted_price: 150,
      stock_quantity: 100,
      moq: 1,
      sku: `MASS-SKU-${i}`
    });
  }

  const startTime = Date.now();
  const largeUpload = await makeRequest(app, 'POST', '/api/dealers/products/bulk-upload', {
    items: largeItems
  }, { Authorization: `Bearer ${dTok}` });
  const durationMs = Date.now() - startTime;

  runner06.assertEqual(largeUpload.status, 201, '1,000 SKU Bulk Upload HTTP 201');
  runner06.assertEqual(largeUpload.body.importedCount, 1000, 'All 1,000 SKUs imported without error');
  runner06.assert(durationMs < 2000, `High performance import completed in ${durationMs}ms (< 2000ms target)`);

  suites.push(runner06);

  // ============================================================
  // SUITE 07: Cart Testing & Multi-Dealer Auto-Splitting
  // ============================================================
  const runner07 = new TestRunner('07_cart_dealer_split');

  // Order items from Dealer A (id 101) & Dealer B (id 102)
  const splitOrder = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [
      { productId: 101, quantity: 5 }, // Dealer A
      { productId: 102, quantity: 2 }  // Dealer B
    ],
    paymentMethod: 'razorpay'
  }, { Authorization: `Bearer ${pTok}` });

  runner07.assertEqual(splitOrder.status, 201, 'Multi-dealer order checkout HTTP 201');
  runner07.assertEqual(splitOrder.body.orderCount, 2, 'Cart automatically split into 2 separate dealer orders');
  runner07.assert(splitOrder.body.orders[0].dealer_id !== splitOrder.body.orders[1].dealer_id, 'Orders have distinct dealer IDs');

  // Quantity > Stock validation
  const stockExceeded = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 99999 }]
  }, { Authorization: `Bearer ${pTok}` });
  runner07.assertEqual(stockExceeded.status, 400, 'Order quantity > stock rejected with HTTP 400');

  // Quantity < MOQ validation
  const belowMoq = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 1 }] // MOQ is 5
  }, { Authorization: `Bearer ${pTok}` });
  runner07.assertEqual(belowMoq.status, 400, 'Order quantity < MOQ rejected with HTTP 400');

  suites.push(runner07);

  // ============================================================
  // SUITE 08: Order State Machine & Invalid Transition Rejections
  // ============================================================
  const runner08 = new TestRunner('08_order_state_machine');

  const newOrd = await makeRequest(app, 'POST', '/api/marketplace/orders', {
    items: [{ productId: 101, quantity: 5 }]
  }, { Authorization: `Bearer ${pTok}` });
  const ordNo = newOrd.body.orders[0].order_number;

  // Invalid jump 1: PLACED → DELIVERED
  const badJump1 = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${ordNo}/status`, {
    status: 'DELIVERED'
  }, { Authorization: `Bearer ${dTok}` });
  runner08.assertEqual(badJump1.status, 400, 'Illegal jump PLACED → DELIVERED rejected with HTTP 400');

  // Invalid jump 2: PLACED → PACKED
  const badJump2 = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${ordNo}/status`, {
    status: 'PACKED'
  }, { Authorization: `Bearer ${dTok}` });
  runner08.assertEqual(badJump2.status, 400, 'Illegal jump PLACED → PACKED rejected with HTTP 400');

  // Valid step: PLACED → CONFIRMED
  const step1 = await makeRequest(app, 'PATCH', `/api/marketplace/orders/${ordNo}/status`, {
    status: 'CONFIRMED'
  }, { Authorization: `Bearer ${dTok}` });
  runner08.assertEqual(step1.status, 200, 'Valid step PLACED → CONFIRMED allowed');

  suites.push(runner08);

  // ============================================================
  // SUITE 09: Inventory Expiry Filters (<30, <60, <90 days)
  // ============================================================
  const runner09 = new TestRunner('09_inventory_expiry_filters');

  // Query <30 days
  const filter30 = await makeRequest(app, 'GET', '/api/inventory?expiryFilter=30', {}, { Authorization: `Bearer ${pTok}` });
  runner09.assertEqual(filter30.status, 200, '<30 days expiry filter HTTP 200');
  runner09.assert(filter30.body.batches.some(b => b.batch_number === 'BATCH-A-20'), 'Batch A (20 days) included in <30 days filter');
  runner09.assert(!filter30.body.batches.some(b => b.batch_number === 'BATCH-B-70'), 'Batch B (70 days) excluded from <30 days filter');

  // Query <90 days
  const filter90 = await makeRequest(app, 'GET', '/api/inventory?expiryFilter=90', {}, { Authorization: `Bearer ${pTok}` });
  runner09.assert(filter90.body.batches.some(b => b.batch_number === 'BATCH-A-20'), 'Batch A included in <90 days filter');
  runner09.assert(filter90.body.batches.some(b => b.batch_number === 'BATCH-B-70'), 'Batch B included in <90 days filter');
  runner09.assert(!filter90.body.batches.some(b => b.batch_number === 'BATCH-C-150'), 'Batch C (150 days) excluded from <90 days filter');

  suites.push(runner09);

  // ============================================================
  // SUITE 10: FEFO Batch Allocation & Deduction
  // ============================================================
  const runner10 = new TestRunner('10_fefo_batch_deduction');

  // Initial state: Product 101 has Batch A (20 days, 10 units), Batch B (70 days, 20 units)
  mockDbStore.batches.find(b => b.batch_number === 'BATCH-A-20').quantity = 10;
  mockDbStore.batches.find(b => b.batch_number === 'BATCH-B-70').quantity = 20;

  // Sell 5 units
  await makeRequest(app, 'POST', '/api/inventory/update', {
    productId: 101,
    type: 'SALE',
    quantity: 5
  }, { Authorization: `Bearer ${pTok}` });

  const invState = await makeRequest(app, 'GET', '/api/inventory', {}, { Authorization: `Bearer ${pTok}` });
  const batchA = invState.body.batches.find(b => b.batch_number === 'BATCH-A-20');
  const batchB = invState.body.batches.find(b => b.batch_number === 'BATCH-B-70');

  runner10.assertEqual(batchA.quantity, 5, 'FEFO allocated deduction to Batch A (expires in 20 days: remaining = 5)');
  runner10.assertEqual(batchB.quantity, 20, 'Batch B (expires in 70 days) remained untouched (remaining = 20)');

  suites.push(runner10);

  return suites;
}
