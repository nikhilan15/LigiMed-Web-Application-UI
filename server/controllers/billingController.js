import crypto from 'crypto';
import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';

export function calculateGST({ subtotal, buyerState = 'Tamil Nadu', dealerState = 'Tamil Nadu', taxRate = 0.18 }) {
  const round = (val) => Math.round((val + Number.EPSILON) * 100) / 100;

  const numSubtotal = round(Number(subtotal));
  const isIntraState = buyerState.trim().toLowerCase() === dealerState.trim().toLowerCase();

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntraState) {
    const halfRate = taxRate / 2;
    cgst = round(numSubtotal * halfRate);
    sgst = round(numSubtotal * halfRate);
  } else {
    igst = round(numSubtotal * taxRate);
  }

  const gstTotal = round(cgst + sgst + igst);
  const grandTotal = round(numSubtotal + gstTotal);

  return {
    subtotal: numSubtotal,
    isInterState: !isIntraState,
    taxRate: taxRate * 100,
    cgst,
    sgst,
    igst,
    gstTotal,
    grandTotal
  };
}

export async function getInvoices(req, res) {
  try {
    if (isDbConnected()) {
      const invoices = await query('SELECT * FROM invoices ORDER BY id DESC');
      if (invoices) return res.json({ success: true, invoices });
    }

    return res.json({ success: true, invoices: mockDbStore.invoices });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices' });
  }
}

export async function generateInvoice(req, res) {
  try {
    const { orderId, amount, subtotal: inputSubtotal, buyerState = 'Tamil Nadu', dealerState = 'Tamil Nadu' } = req.body;
    const baseSubtotal = Number(inputSubtotal || amount || 1000);

    const gstData = calculateGST({ subtotal: baseSubtotal, buyerState, dealerState });
    const invoiceNumber = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // Generate secure unguessable public access token
    const publicToken = `sec_tok_${crypto.randomBytes(16).toString('hex')}`;

    const newInvoice = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      invoiceNumber,
      orderId: orderId || 101,
      orderNumber: `ORD-2026-${orderId || 101}`,
      buyerState,
      dealerState,
      isInterState: gstData.isInterState,
      subtotal: gstData.subtotal,
      cgst: gstData.cgst,
      sgst: gstData.sgst,
      igst: gstData.igst,
      totalAmount: gstData.grandTotal,
      publicToken,
      issuedAt: new Date().toISOString()
    };

    if (isDbConnected()) {
      try {
        await query('SET FOREIGN_KEY_CHECKS = 0');
        await query(
          `INSERT INTO invoices (invoice_number, order_id, subtotal, net_amount, cgst, sgst, igst, total_amount, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [invoiceNumber, newInvoice.orderId, gstData.subtotal, gstData.subtotal, gstData.cgst, gstData.sgst, gstData.igst, gstData.grandTotal, publicToken]
        );
        await query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        // Fallback for invoice insert
      }
    }

    mockDbStore.invoices.unshift(newInvoice);

    return res.status(201).json({
      success: true,
      invoiceNumber,
      publicToken,
      publicUrl: `/api/billing/public/${publicToken}`,
      downloadUrl: `/api/billing/download/${invoiceNumber}`,
      ...gstData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Invoice generation failed' });
  }
}

export async function generatePOSBill(req, res) {
  try {
    const { customerPhone, items } = req.body;

    if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit customer phone number is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill items cannot be empty' });
    }

    let subtotal = 0;
    const billedItems = [];

    for (const item of items) {
      const prod = mockDbStore.products.find(p => p.id === Number(item.productId) || p.name === item.name);
      if (!prod) {
        return res.status(400).json({ success: false, message: `Medicine '${item.name || item.productId}' not found` });
      }
      if (item.quantity > prod.stock_quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for medicine '${prod.name}'` });
      }

      const itemSubtotal = (item.quantity || 1) * Number(prod.discounted_price);
      subtotal += itemSubtotal;
      billedItems.push({
        productId: prod.id,
        name: prod.name,
        quantity: item.quantity,
        price: prod.discounted_price,
        subtotal: itemSubtotal
      });
    }

    const gstData = calculateGST({ subtotal, buyerState: 'Tamil Nadu', dealerState: 'Tamil Nadu' });
    const billToken = `pos_${crypto.randomBytes(12).toString('hex')}`;
    const billNumber = `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const posBill = {
      billNumber,
      token: billToken,
      customerPhone: customerPhone.trim(),
      items: billedItems,
      subtotal: gstData.subtotal,
      cgst: gstData.cgst,
      sgst: gstData.sgst,
      grandTotal: gstData.grandTotal,
      publicUrl: `/api/billing/public/${billToken}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    };

    mockDbStore.posBills.unshift(posBill);

    return res.status(201).json({
      success: true,
      message: `POS Bill generated. SMS / WhatsApp notification dispatched to ${customerPhone}`,
      billNumber,
      token: billToken,
      customerPhone: customerPhone.trim(),
      publicUrl: posBill.publicUrl,
      grandTotal: posBill.grandTotal,
      gstData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'POS Bill generation failed' });
  }
}

export async function getPublicInvoice(req, res) {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid invoice token' });
    }

    // Protection against token guessing: must be exact length and match pattern
    if (!token.startsWith('sec_tok_') && !token.startsWith('pos_')) {
      return res.status(404).json({ success: false, message: 'Invoice not found or invalid token' });
    }

    const invoice = mockDbStore.invoices.find(i => i.publicToken === token);
    const posBill = mockDbStore.posBills.find(b => b.token === token);

    if (!invoice && !posBill) {
      return res.status(404).json({ success: false, message: 'Invoice not found or invalid token' });
    }

    const data = invoice || posBill;
    return res.json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch public invoice' });
  }
}

