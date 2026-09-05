import express from 'express';
import { register, login, logout, refreshToken, googleOAuth, sendOTP, verifyOTP } from '../controllers/authController.js';
import { submitKYC, getKYCStatus, checkDocumentExpiry } from '../controllers/kycController.js';
import { getProducts, compareDealers, createOrder, getOrders, updateOrderStatus } from '../controllers/marketplaceController.js';
import { getInventory, updateStock, getForecasting } from '../controllers/inventoryController.js';
import { getShipmentTracking, updateShipmentStatus, verifyDeliveryOTP, updateColdChainLog, sendDispatchOTP } from '../controllers/logisticsController.js';
import { getInvoices, generateInvoice, generatePOSBill, getPublicInvoice } from '../controllers/billingController.js';
import { getBNPLDetails, requestDrawdown } from '../controllers/bnplController.js';
import { submitReturn, processReturnDecision, getReturns } from '../controllers/reverseLogisticsController.js';
import { bulkUploadProducts } from '../controllers/dealerController.js';
import { getAdminMetrics, getUsers, toggleUserStatus, processKYCDecision, getAuditLogs } from '../controllers/adminController.js';
import { verifyToken, checkRole, optionalToken } from '../middleware/auth.js';
import { upload } from '../services/storageService.js';
import { isDbConnected } from '../config/db.js';
import { config } from '../config/env.js';

const router = express.Router();

// --- Health Check ---
router.get(['/health', '/health/', '/health.'], (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: {
      connected: isDbConnected(),
      host: config.db.host,
      name: config.db.name
    },
    integrations: {
      kycProvider: config.kyc.provider,
      paymentProvider: config.payment.provider,
      smtpHost: config.smtp.host
    }
  });
});

// --- Auth Routes ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/refresh-token', refreshToken);
router.post('/auth/google', googleOAuth);
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);

// --- KYC & Compliance Routes ---
router.post('/kyc/verify', optionalToken, submitKYC);
router.get('/kyc/expiry-check', checkDocumentExpiry);
router.get('/kyc/status/:userId?', verifyToken, getKYCStatus);

// --- Marketplace & Dealer Catalog Routes ---
router.get('/marketplace/products', getProducts);
router.get('/marketplace/compare', compareDealers);
router.post('/marketplace/orders', verifyToken, checkRole(['pharmacy', 'admin']), createOrder);
router.get('/marketplace/orders', verifyToken, checkRole(['pharmacy', 'dealer', 'admin', 'logistics', 'finance']), getOrders);
router.patch('/marketplace/orders/:orderId/status', verifyToken, checkRole(['dealer', 'admin', 'logistics']), updateOrderStatus);
router.post('/dealers/products/bulk-upload', verifyToken, checkRole(['dealer', 'admin']), bulkUploadProducts);

// --- Pharmacy Inventory & AI Intelligence Routes ---
router.get('/inventory', verifyToken, checkRole(['pharmacy', 'admin', 'dealer']), getInventory);
router.post('/inventory/update', verifyToken, checkRole(['pharmacy', 'admin', 'dealer']), updateStock);
router.get('/inventory/forecasting', verifyToken, checkRole(['pharmacy', 'admin']), getForecasting);

// --- Logistics & Delivery OTP Verification Routes ---
router.get('/logistics/tracking/:trackingNumber?', getShipmentTracking);
router.patch('/logistics/shipments/:trackingNumber/status', verifyToken, checkRole(['logistics', 'admin']), updateShipmentStatus);
router.post('/logistics/verify-otp', verifyToken, checkRole(['logistics', 'pharmacy', 'admin']), verifyDeliveryOTP);
router.post('/logistics/coldchain/telemetry', updateColdChainLog);
router.post('/logistics/send-dispatch-otp', sendDispatchOTP);

// --- Billing, Invoices & POS Routes ---
router.get('/billing/invoices', verifyToken, checkRole(['pharmacy', 'dealer', 'admin', 'finance']), getInvoices);
router.post('/billing/invoices/generate', verifyToken, checkRole(['pharmacy', 'dealer', 'admin', 'finance']), generateInvoice);
router.post('/billing/pos/generate', verifyToken, checkRole(['pharmacy', 'admin']), generatePOSBill);
router.get('/billing/public/:token', getPublicInvoice);

// --- BNPL Credit Payments Routes ---
router.get('/bnpl/account', verifyToken, checkRole(['pharmacy', 'admin', 'finance']), getBNPLDetails);
router.post('/bnpl/drawdown', verifyToken, checkRole(['pharmacy', 'admin']), requestDrawdown);

// --- Reverse Logistics & Returns Routes ---
router.get('/logistics/returns', verifyToken, checkRole(['pharmacy', 'dealer', 'admin', 'logistics']), getReturns);
router.post('/logistics/returns/submit', verifyToken, checkRole(['pharmacy', 'admin']), submitReturn);
router.post('/logistics/returns/:returnNumber/decision', verifyToken, checkRole(['dealer', 'admin']), processReturnDecision);

// --- Admin Control Center & Audit Log Routes ---
router.get('/admin/metrics', verifyToken, checkRole(['admin']), getAdminMetrics);
router.get('/admin/users', verifyToken, checkRole(['admin']), getUsers);
router.patch('/admin/users/:userId/status', verifyToken, checkRole(['admin']), toggleUserStatus);
router.post('/admin/kyc/decision', verifyToken, checkRole(['admin']), processKYCDecision);
router.get('/admin/audit-logs', verifyToken, checkRole(['admin']), getAuditLogs);

// --- Storage File Upload ---
router.post('/storage/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      size: req.file.size,
      path: `/uploads/${config.storage.bucket}/${req.file.filename}`
    }
  });
});

export default router;

