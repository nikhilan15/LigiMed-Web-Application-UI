import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { logger } from '../config/logger.js';

// FEFO Deduction Logic (First-Expiry-First-Out)
export function deductFEFOStock(productId, quantityToDeduct, deductProductStock = true) {
  const prodId = Number(productId);
  const qty = Number(quantityToDeduct);

  // 1. Deduct overall product stock in memory (if requested)
  const product = mockDbStore.products.find(p => p.id === prodId);
  if (deductProductStock) {
    if (product) {
      product.stock_quantity = Math.max(0, product.stock_quantity - qty);
    }

    if (isDbConnected()) {
      query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?', [qty, prodId]).catch(() => {});
    }
  }

  // 2. Deduct from batches ordered by earliest expiry date (FEFO)
  let remaining = qty;
  const productBatches = mockDbStore.batches
    .filter(b => b.product_id === prodId && b.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  for (const batch of productBatches) {
    if (remaining <= 0) break;
    const deduct = Math.min(batch.quantity, remaining);
    batch.quantity -= deduct;
    remaining -= deduct;
  }

  return { remainingUnfulfilled: Math.max(0, remaining), remainingProductStock: product ? product.stock_quantity : 0 };
}

export async function getInventory(req, res) {
  try {
    const { expiryFilter } = req.query;

    if (expiryFilter) {
      const days = parseInt(expiryFilter, 10);
      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 24 * 3600 * 1000);

      const matchingBatches = mockDbStore.batches.filter(b => {
        const exp = new Date(b.expiry_date);
        return exp >= now && exp <= cutoff;
      });

      return res.json({
        success: true,
        expiryFilterDays: days,
        count: matchingBatches.length,
        batches: matchingBatches
      });
    }

    if (isDbConnected()) {
      const items = await query('SELECT * FROM products ORDER BY stock_quantity ASC');
      if (items) return res.json({ success: true, inventory: items, batches: mockDbStore.batches });
    }

    return res.json({ success: true, inventory: mockDbStore.products, batches: mockDbStore.batches });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
}

export async function updateStock(req, res) {
  try {
    const { productId, type, quantity, reason } = req.body;
    const prodId = Number(productId);
    const product = mockDbStore.products.find(p => p.id === prodId);

    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${productId} not found` });
    }

    const initialStock = product.stock_quantity;
    const qty = Number(quantity);

    if (type === 'PURCHASE') {
      product.stock_quantity += qty;
    } else if (type === 'SALE') {
      deductFEFOStock(prodId, qty);
    } else if (type === 'RETURN') {
      product.stock_quantity += qty;
    } else if (type === 'ADJUSTMENT') {
      product.stock_quantity = Math.max(0, product.stock_quantity + qty);
    } else {
      product.stock_quantity = qty; // direct overwrite
    }

    if (isDbConnected()) {
      await query('UPDATE products SET stock_quantity = ? WHERE id = ?', [product.stock_quantity, prodId]);
    }

    // Audit log
    mockDbStore.auditLogs.unshift({
      id: Date.now() + Math.random(),
      actor: req.user ? req.user.email : 'System',
      action: 'INVENTORY_ADJUSTMENT',
      entity: 'Product',
      entity_id: String(prodId),
      metadata: { initialStock, newStock: product.stock_quantity, type, quantity: qty, reason },
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      productId: prodId,
      initialStock,
      newStock: product.stock_quantity,
      message: `Stock updated successfully via ${type || 'SET'}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
}

export async function getForecasting(req, res) {
  try {
    const recommendations = mockDbStore.products.map(p => {
      const avgDailySales = p.id === 101 ? 10 : 5;
      const currentStock = p.stock_quantity;
      const leadTimeDays = 3;
      const estimatedStockoutDays = avgDailySales > 0 ? Math.round((currentStock / avgDailySales) * 10) / 10 : 999;
      const recommendedOrderQty = Math.max(0, (avgDailySales * 14) - currentStock);

      return {
        productId: p.id,
        name: p.name,
        currentStock,
        avgDailySales,
        leadTimeDays,
        estimatedStockoutDays,
        recommendedOrderQty,
        requiresManualApproval: true,
        autoPurchaseEnabled: false
      };
    });

    return res.json({
      success: true,
      aiEngine: 'LigiMed Inventory AI Engine v2.6',
      safetyPolicy: 'Manual Approval Required (No Automatic Purchasing)',
      recommendations
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate inventory forecast' });
  }
}

