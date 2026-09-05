-- ============================================================
-- LigiMed Database DDL Schema
-- Database: ligimed
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('pharmacy', 'dealer', 'admin', 'logistics') NOT NULL DEFAULT 'pharmacy',
  company_name VARCHAR(255),
  phone VARCHAR(50),
  google_id VARCHAR(255),
  is_kyc_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kyc_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  gstin VARCHAR(50),
  pan VARCHAR(50),
  drug_license VARCHAR(100),
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_at TIMESTAMP NULL,
  verification_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  cold_chain_required TINYINT(1) DEFAULT 0,
  temp_min_celsius DECIMAL(4,1) DEFAULT 2.0,
  temp_max_celsius DECIMAL(4,1) DEFAULT 8.0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  buyer_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) DEFAULT 'razorpay',
  payment_status ENUM('pending', 'paid', 'failed', 'bnpl_escrow') DEFAULT 'pending',
  shipping_status ENUM('processing', 'shipped', 'in_transit', 'delivered', 'returned') DEFAULT 'processing',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  cgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sgst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  igst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  pdf_url VARCHAR(500),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  carrier VARCHAR(100) DEFAULT 'LigiMed Express ColdChain',
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  current_location VARCHAR(255),
  status ENUM('manifested', 'pickup', 'in_transit', 'out_for_delivery', 'delivered') DEFAULT 'manifested',
  temperature_celsius DECIMAL(4,1) DEFAULT 4.5,
  humidity_percent INT DEFAULT 45,
  estimated_delivery TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS cold_chain_telemetry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  temperature_celsius DECIMAL(4,1) NOT NULL,
  humidity_percent INT NOT NULL,
  is_alert TINYINT(1) DEFAULT 0,
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bnpl_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  total_credit_limit DECIMAL(12,2) DEFAULT 500000.00,
  available_credit DECIMAL(12,2) DEFAULT 320000.00,
  used_credit DECIMAL(12,2) DEFAULT 180000.00,
  credit_score INT DEFAULT 780,
  status ENUM('active', 'frozen', 'under_review') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reverse_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_number VARCHAR(100) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  item_condition VARCHAR(100) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  status ENUM('requested', 'approved', 'pickup_scheduled', 'inspected', 'refunded', 'rejected') DEFAULT 'requested',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
