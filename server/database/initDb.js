import { getDbPool, query, isDbConnected } from '../config/db.js';
import { logger } from '../config/logger.js';
import { clearTokenBlacklist } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

export const mockDbStore = {
  users: [],
  kyc: [],
  products: [],
  batches: [],
  orders: [],
  order_items: [],
  invoices: [],
  shipments: [],
  bnplAccounts: new Map(),
  returns: [],
  auditLogs: [],
  posBills: [],
  failedLoginAttempts: new Map(),
  idempotencyKeys: new Map()
};

export async function resetMockStore() {
  clearTokenBlacklist();
  mockDbStore.failedLoginAttempts.clear();
  mockDbStore.idempotencyKeys.clear();
  mockDbStore.bnplAccounts.clear();
  mockDbStore.users = [
    { id: 1, name: 'Pharmacy Admin', email: 'pharmacy@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'pharmacy', company_name: 'MediCare Pharmacy', phone: '9876543210', state: 'Tamil Nadu', is_kyc_verified: 1 },
    { id: 2, name: 'Wholesale Dealer A', email: 'dealer1@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'dealer', company_name: 'Apex Pharma Distributors', phone: '9876543211', state: 'Tamil Nadu', is_kyc_verified: 1 },
    { id: 3, name: 'Wholesale Dealer B', email: 'dealer2@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'dealer', company_name: 'Metro Bio Meds', phone: '9876543212', state: 'Kerala', is_kyc_verified: 1 },
    { id: 4, name: 'Logistics Partner', email: 'logistics@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'logistics', company_name: 'Express ColdChain Logistics', phone: '9876543213', state: 'Tamil Nadu', is_kyc_verified: 1 },
    { id: 5, name: 'System Admin', email: 'admin@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'admin', company_name: 'LigiMed Corporate', phone: '9876543214', state: 'Tamil Nadu', is_kyc_verified: 1 },
    { id: 6, name: 'Finance Controller', email: 'finance@ligimed.com', password_hash: bcrypt.hashSync('Pointbreak1234', 10), role: 'finance', company_name: 'LigiMed Capital', phone: '9876543215', state: 'Tamil Nadu', is_kyc_verified: 1 }
  ];

  mockDbStore.kyc = [
    { id: 1, user_id: 1, gstin: '33AAAAA0000A1Z5', pan: 'ABCDE1234F', drug_license: 'TN-CHE-2026-1092', status: 'verified', verification_details: { gst: { verified: true }, pan: { verified: true } }, created_at: new Date().toISOString() }
  ];

  mockDbStore.products = [
    {
      id: 101,
      name: 'Paracetamol 650mg (Dolo)',
      generic_name: 'Paracetamol',
      brand: 'Dolo-650',
      manufacturer: 'Micro Labs',
      sku: 'SKU-PARA-650',
      composition: 'Paracetamol 650mg',
      category: 'Analgesic',
      mrp: 120.00,
      discounted_price: 100.00,
      dealer_id: 2,
      dealer_name: 'Apex Pharma Distributors',
      stock_quantity: 50,
      moq: 5,
      cold_chain_required: 0,
      status: 'active'
    },
    {
      id: 102,
      name: 'Paracetamol 650mg (Crocin)',
      generic_name: 'Paracetamol',
      brand: 'Crocin',
      manufacturer: 'GlaxoSmithKline',
      sku: 'SKU-CROCIN-650',
      composition: 'Paracetamol 650mg',
      category: 'Analgesic',
      mrp: 125.00,
      discounted_price: 95.00,
      dealer_id: 3,
      dealer_name: 'Metro Bio Meds',
      stock_quantity: 20,
      moq: 2,
      cold_chain_required: 0,
      status: 'active'
    },
    {
      id: 103,
      name: 'Azithromycin 500mg',
      generic_name: 'Azithromycin',
      brand: 'Azee-500',
      manufacturer: 'Cipla',
      sku: 'SKU-AZEE-500',
      composition: 'Azithromycin Dihydrate 500mg',
      category: 'Antibiotics',
      mrp: 350.00,
      discounted_price: 280.00,
      dealer_id: 2,
      dealer_name: 'Apex Pharma Distributors',
      stock_quantity: 100,
      moq: 10,
      cold_chain_required: 0,
      status: 'active'
    }
  ];

  const now = new Date();
  const d20 = new Date(now.getTime() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const d70 = new Date(now.getTime() + 70 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const d150 = new Date(now.getTime() + 150 * 24 * 3600 * 1000).toISOString().split('T')[0];

  mockDbStore.batches = [
    { id: 1, product_id: 101, batch_number: 'BATCH-A-20', expiry_date: d20, quantity: 10, unit_cost: 80.00, mrp: 120.00 },
    { id: 2, product_id: 101, batch_number: 'BATCH-B-70', expiry_date: d70, quantity: 20, unit_cost: 80.00, mrp: 120.00 },
    { id: 3, product_id: 101, batch_number: 'BATCH-C-150', expiry_date: d150, quantity: 50, unit_cost: 80.00, mrp: 120.00 }
  ];

  mockDbStore.orders = [];
  mockDbStore.order_items = [];
  mockDbStore.invoices = [];
  mockDbStore.shipments = [
    {
      id: 1,
      tracking_number: 'LM-TRACK-9901',
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
    }
  ];

  mockDbStore.bnplAccounts.set(1, {
    userId: 1,
    totalCreditLimit: 50000.00,
    usedCredit: 20000.00,
    availableCredit: 30000.00,
    status: 'active',
    creditScore: 780
  });

  mockDbStore.returns = [];
  mockDbStore.auditLogs = [];
  mockDbStore.posBills = [];
  mockDbStore.failedLoginAttempts.clear();
  mockDbStore.idempotencyKeys.clear();

  if (isDbConnected()) {
    try {
      await query('SET FOREIGN_KEY_CHECKS = 0');
      await query('DELETE FROM users WHERE email NOT IN ("pharmacy@ligimed.com", "dealer1@ligimed.com", "dealer2@ligimed.com", "logistics@ligimed.com", "admin@ligimed.com", "finance@ligimed.com")');
      await query('DELETE FROM products WHERE id NOT IN (101, 102, 103)');
      await query('UPDATE products SET name = "Paracetamol 650mg (Dolo)", generic_name = "Paracetamol", brand = "Dolo-650", stock_quantity = 50, status = "active" WHERE id = 101');
      await query('UPDATE products SET name = "Paracetamol 650mg (Crocin)", generic_name = "Paracetamol", brand = "Crocin", stock_quantity = 20, status = "active" WHERE id = 102');
      await query('UPDATE products SET name = "Azithromycin 500mg", generic_name = "Azithromycin", brand = "Azee-500", stock_quantity = 100, status = "active" WHERE id = 103');
      await query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      // Ignore DB reset error
    }
  }
}

// Reset mock store on initialization
resetMockStore();

export async function initializeDatabase() {
  const pool = await getDbPool();
  if (!pool) {
    logger.info('Database pool not active. Fallback transactional mock dataset ready.');
    return;
  }

  try {
    const passwordHash = await bcrypt.hash('Pointbreak1234', 10);

    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('pharmacy', 'dealer', 'admin', 'logistics', 'finance') NOT NULL DEFAULT 'pharmacy',
        company_name VARCHAR(255),
        phone VARCHAR(50),
        state VARCHAR(100) DEFAULT 'Tamil Nadu',
        google_id VARCHAR(255),
        is_kyc_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS kyc_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        gstin VARCHAR(50),
        pan VARCHAR(50),
        drug_license VARCHAR(100),
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        brand VARCHAR(255),
        manufacturer VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        composition VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        batch_number VARCHAR(100),
        expiry_date DATE,
        mrp DECIMAL(10,2) NOT NULL,
        discounted_price DECIMAL(10,2) NOT NULL,
        dealer_id INT DEFAULT 2,
        dealer_name VARCHAR(255),
        stock_quantity INT NOT NULL DEFAULT 0,
        moq INT DEFAULT 1,
        cold_chain_required TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        batch_number VARCHAR(100) NOT NULL,
        expiry_date DATE NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        unit_cost DECIMAL(10,2) DEFAULT 0,
        mrp DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        buyer_id INT NOT NULL,
        dealer_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        gst_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'razorpay',
        payment_status VARCHAR(50) DEFAULT 'pending',
        shipping_status VARCHAR(50) DEFAULT 'PLACED',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        order_id INT NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        cgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        sgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        igst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(12,2) NOT NULL,
        token VARCHAR(255) UNIQUE,
        pdf_url VARCHAR(500),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        order_id INT NOT NULL,
        carrier VARCHAR(100) DEFAULT 'LigiMed Express ColdChain',
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        driver_id INT DEFAULT 4,
        otp_code VARCHAR(10),
        failed_otp_attempts INT DEFAULT 0,
        status ENUM('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED') DEFAULT 'ASSIGNED',
        temperature_celsius DECIMAL(4,1) DEFAULT 4.5,
        humidity_percent INT DEFAULT 45,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bnpl_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        total_credit_limit DECIMAL(12,2) DEFAULT 50000.00,
        available_credit DECIMAL(12,2) DEFAULT 30000.00,
        used_credit DECIMAL(12,2) DEFAULT 20000.00,
        credit_score INT DEFAULT 780,
        status ENUM('active', 'frozen', 'under_review') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        metadata JSON,
        ip VARCHAR(50) DEFAULT '127.0.0.1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reverse_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_number VARCHAR(100) UNIQUE NOT NULL,
        order_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        item_condition VARCHAR(100) DEFAULT 'unopened',
        refund_amount DECIMAL(10,2) DEFAULT 0.00,
        credit_note_number VARCHAR(100),
        status ENUM('requested', 'approved', 'rejected', 'credit_issued') DEFAULT 'requested',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration helpers for existing MySQL schemas
    const ensureColumnsExist = async (table, requiredColumns) => {
      try {
        const rows = await query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = ?`, [table]);
        const existing = new Set((rows || []).map(r => r.COLUMN_NAME));
        for (const [col, def] of requiredColumns) {
          if (!existing.has(col)) {
            await query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
          }
        }
      } catch (e) {
        logger.warn(`Migration check for ${table}: ${e.message}`);
      }
    };

    await ensureColumnsExist('products', [
      ['status', "VARCHAR(50) DEFAULT 'active'"],
      ['category', "VARCHAR(100) DEFAULT 'General'"],
      ['manufacturer', "VARCHAR(255) DEFAULT 'Pharma Corp'"],
      ['generic_name', 'VARCHAR(255)'],
      ['brand', 'VARCHAR(255)'],
      ['sku', 'VARCHAR(100)'],
      ['composition', 'VARCHAR(255)'],
      ['mrp', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['discounted_price', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['stock_quantity', 'INT DEFAULT 0'],
      ['moq', 'INT DEFAULT 1'],
      ['dealer_id', 'INT DEFAULT 2'],
      ['dealer_name', 'VARCHAR(255)'],
      ['expiry_date', 'DATE'],
      ['batch_number', 'VARCHAR(100)'],
      ['cold_chain_required', 'TINYINT(1) DEFAULT 0']
    ]);

    await ensureColumnsExist('users', [
      ['state', "VARCHAR(100) DEFAULT 'Tamil Nadu'"],
      ['company_name', 'VARCHAR(255)'],
      ['phone', 'VARCHAR(50)'],
      ['is_kyc_verified', 'TINYINT(1) DEFAULT 0']
    ]);

    await ensureColumnsExist('orders', [
      ['buyer_id', 'INT DEFAULT 1'],
      ['dealer_id', 'INT DEFAULT 2'],
      ['total_amount', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['gst_amount', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['payment_method', "VARCHAR(50) DEFAULT 'razorpay'"],
      ['payment_status', "VARCHAR(50) DEFAULT 'pending'"],
      ['shipping_status', "VARCHAR(50) DEFAULT 'PLACED'"],
      ['shipping_address', 'TEXT']
    ]);

    await ensureColumnsExist('invoices', [
      ['subtotal', 'DECIMAL(12,2) DEFAULT 0.00'],
      ['net_amount', 'DECIMAL(12,2) DEFAULT 0.00'],
      ['cgst', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['sgst', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['igst', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['total_amount', 'DECIMAL(12,2) DEFAULT 0.00'],
      ['token', 'VARCHAR(255)']
    ]);

    await ensureColumnsExist('order_items', [
      ['subtotal', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['unit_price', 'DECIMAL(10,2) DEFAULT 0.00'],
      ['quantity', 'INT DEFAULT 1']
    ]);

    // Seed default test users into MySQL database
    for (const u of mockDbStore.users) {
      try {
        const existing = await query('SELECT id FROM users WHERE email = ?', [u.email]);
        if (!existing || existing.length === 0) {
          await query(
            `INSERT INTO users (name, email, password_hash, role, company_name, phone, state, is_kyc_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [u.name, u.email, u.password_hash, u.role, u.company_name || '', u.phone || '', u.state || 'Tamil Nadu']
          );
        }
      } catch (e) {
        // User insertion fallback
      }
    }

    // Seed default test products into MySQL database
    for (const p of mockDbStore.products) {
      try {
        const existingP = await query('SELECT id FROM products WHERE id = ?', [p.id]);
        if (!existingP || existingP.length === 0) {
          await query(
            `INSERT INTO products (id, name, generic_name, brand, manufacturer, sku, composition, category, mrp, discounted_price, dealer_id, dealer_name, stock_quantity, moq, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.name, p.generic_name, p.brand, p.manufacturer, p.sku, p.composition, p.category, p.mrp, p.discounted_price, p.dealer_id, p.dealer_name, p.stock_quantity, p.moq, p.status]
          );
        } else {
          await query(
            `UPDATE products SET name = ?, generic_name = ?, brand = ?, manufacturer = ?, sku = ?, composition = ?, category = ?, moq = ?, dealer_id = ?, dealer_name = ?, stock_quantity = ?, discounted_price = ?, mrp = ?, status = 'active' WHERE id = ?`,
            [p.name, p.generic_name, p.brand, p.manufacturer, p.sku, p.composition, p.category, p.moq, p.dealer_id, p.dealer_name, p.stock_quantity, p.discounted_price, p.mrp, p.id]
          );
        }
      } catch (e) {
        // Product seeding fallback
      }
    }

    logger.info('Database initialized with complete schema, migrations, and seeded test data.');
  } catch (err) {
    logger.error(`Database initialization error: ${err.message}`);
  }
}







