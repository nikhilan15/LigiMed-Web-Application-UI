import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { createPaymentOrder } from '../services/razorpayService.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { logger } from '../config/logger.js';
import { deductFEFOStock } from './inventoryController.js';

// Order State Machine Definition
export const ORDER_LIFECYCLE = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

export async function getProducts(req, res) {
  try {
    const { category, search } = req.query;

    if (isDbConnected()) {
      let sql = 'SELECT * FROM products WHERE status = "active"';
      const params = [];

      if (category && category !== 'All') {
        sql += ' AND category LIKE ?';
        params.push(`%${category}%`);
      }
      if (search) {
        const cleanSearch = search.trim();
        sql += ' AND (name LIKE ? OR generic_name LIKE ? OR brand LIKE ? OR manufacturer LIKE ? OR composition LIKE ? OR sku LIKE ?)';
        params.push(`%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`);
      }

      const products = await query(sql, params);
      if (products && products.length > 0) {
        return res.json({ success: true, products });
      }
    }

    let products = mockDbStore.products.filter(p => p.status !== 'inactive');

    if (category && category !== 'All') {
      products = products.filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (search) {
      const q = search.trim().toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.composition && p.composition.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, products: products || [] });
  } catch (err) {
    logger.error(`Get products error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
}

export async function compareDealers(req, res) {
  try {
    const { query: searchQuery } = req.query;
    if (!searchQuery) {
      return res.status(400).json({ success: false, message: 'Query parameter is required for comparison' });
    }

    const q = searchQuery.trim().toLowerCase();
    const matches = mockDbStore.products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(q))
    );

    return res.json({
      success: true,
      query: searchQuery,
      dealerOffers: matches.map(m => ({
        productId: m.id,
        dealerId: m.dealer_id,
        dealerName: m.dealer_name,
        name: m.name,
        mrp: m.mrp,
        dealerPrice: m.discounted_price,
        availableStock: m.stock_quantity,
        moq: m.moq
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Dealer comparison failed' });
  }
}

export async function createOrder(req, res) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const buyerId = req.user ? req.user.id : (req.body.buyerId || 1);
    const { items, paymentMethod = 'razorpay', shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    // 1. Double-Click / Idempotency Check
    if (idempotencyKey) {
      if (mockDbStore.idempotencyKeys.has(idempotencyKey)) {
        logger.info(`[IDEMPOTENCY TRIGGERED] Returning cached order response for key: ${idempotencyKey}`);
        return res.status(200).json(mockDbStore.idempotencyKeys.get(idempotencyKey));
      }
    }

    // 2. Validate Items & Group by Dealer (Multi-Dealer Cart Auto-Splitting)
    const dealerGroups = new Map();

    for (const item of items) {
      const prodId = Number(item.productId);
      const catalogItem = isDbConnected()
        ? (await query('SELECT * FROM products WHERE id = ?', [prodId]))?.[0]
        : mockDbStore.products.find(p => p.id === prodId);

      if (!catalogItem) {
        return res.status(400).json({ success: false, message: `Product ID ${item.productId} not found in catalog` });
      }

      if (catalogItem.status === 'inactive') {
        return res.status(400).json({ success: false, message: `Product '${catalogItem.name}' is currently inactive` });
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return res.status(400).json({ success: false, message: `Invalid order quantity for item '${catalogItem.name}'` });
      }

      if (catalogItem.moq && qty < catalogItem.moq) {
        return res.status(400).json({ success: false, message: `Quantity for '${catalogItem.name}' (${qty}) is below Minimum Order Quantity (MOQ: ${catalogItem.moq})` });
      }

      if (isDbConnected()) {
        const lockRes = await query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ? AND status = "active"',
          [qty, prodId, qty]
        );
        if (!lockRes || lockRes.affectedRows === 0) {
          return res.status(400).json({
            success: false,
            message: `Requested quantity (${qty}) for '${catalogItem.name}' exceeds available stock or was modified concurrently.`
          });
        }
        const memProd = mockDbStore.products.find(p => p.id === prodId);
        if (memProd) {
          memProd.stock_quantity = Math.max(0, memProd.stock_quantity - qty);
        }
      } else {
        if (qty > catalogItem.stock_quantity) {
          return res.status(400).json({
            success: false,
            message: `Requested quantity (${qty}) for '${catalogItem.name}' exceeds available stock (${catalogItem.stock_quantity})`
          });
        }
        catalogItem.stock_quantity -= qty;
      }

      const dealerId = catalogItem.dealer_id || 2;
      const verifiedUnitPrice = Number(catalogItem.discounted_price);

      if (!dealerGroups.has(dealerId)) {
        dealerGroups.set(dealerId, []);
      }

      dealerGroups.get(dealerId).push({
        product: catalogItem,
        quantity: qty,
        unitPrice: verifiedUnitPrice,
        subtotal: qty * verifiedUnitPrice
      });
    }

    // 3. Process Each Dealer Order (Split Execution)
    const createdOrders = [];

    for (const [dealerId, groupItems] of dealerGroups.entries()) {
      const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const subtotal = groupItems.reduce((sum, gi) => sum + gi.subtotal, 0);
      const gstAmount = Math.round(subtotal * 0.12 * 100) / 100;
      const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

      // Deduct stock using FEFO Engine (product stock already reserved atomically)
      for (const gi of groupItems) {
        deductFEFOStock(gi.product.id, gi.quantity, false);
      }

      let razorpayOrder = null;
      if (paymentMethod === 'razorpay') {
        razorpayOrder = await createPaymentOrder(grandTotal, 'INR', orderNumber);
      }

      const newOrder = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        order_number: orderNumber,
        buyer_id: buyerId,
        dealer_id: dealerId,
        total_amount: grandTotal,
        gst_amount: gstAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'bnpl' ? 'bnpl_escrow' : 'pending',
        shipping_status: 'PLACED',
        shipping_address: shippingAddress || '120 Pharmacy Street, Chennai, TN',
        items: groupItems.map(gi => ({
          productId: gi.product.id,
          name: gi.product.name,
          quantity: gi.quantity,
          unitPrice: gi.unitPrice,
          subtotal: gi.subtotal
        })),
        created_at: new Date().toISOString()
      };

      if (isDbConnected()) {
        const orderResult = await query(
          `INSERT INTO orders (order_number, buyer_id, dealer_id, total_amount, gst_amount, payment_method, payment_status, shipping_status, shipping_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderNumber, buyerId, dealerId, grandTotal, gstAmount, paymentMethod, newOrder.payment_status, 'PLACED', newOrder.shipping_address]
        );
        newOrder.id = orderResult.insertId;

        for (const gi of groupItems) {
          await query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
            [newOrder.id, gi.product.id, gi.quantity, gi.unitPrice, gi.subtotal]
          );
        }
      }

      mockDbStore.orders.unshift(newOrder);
      createdOrders.push(newOrder);

      // Audit Log
      mockDbStore.auditLogs.unshift({
        id: Date.now() + Math.random(),
        actor: req.user ? req.user.email : 'Pharmacy User',
        action: 'ORDER_PLACED',
        entity: 'Order',
        entity_id: orderNumber,
        metadata: { totalAmount: grandTotal, dealerId },
        timestamp: new Date().toISOString()
      });
    }

    const responsePayload = {
      success: true,
      message: dealerGroups.size > 1 ? `Cart split into ${dealerGroups.size} separate dealer orders successfully.` : 'Order placed successfully.',
      orderCount: createdOrders.length,
      orders: createdOrders
    };

    if (idempotencyKey) {
      mockDbStore.idempotencyKeys.set(idempotencyKey, responsePayload);
    }

    return res.status(201).json(responsePayload);
  } catch (err) {
    logger.error(`Create order error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Order creation failed' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status: newStatus } = req.body;

    const order = mockDbStore.orders.find(o => o.id === Number(orderId) || o.order_number === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${orderId}' not found` });
    }

    const currentStatus = order.shipping_status || 'PLACED';
    const allowedNextStates = ORDER_LIFECYCLE[currentStatus] || [];

    if (!allowedNextStates.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Permitted next states: [${allowedNextStates.join(', ')}]`
      });
    }

    order.shipping_status = newStatus;
    if (isDbConnected()) {
      await query('UPDATE orders SET shipping_status = ? WHERE id = ?', [newStatus, order.id]);
    }

    // Audit Log
    mockDbStore.auditLogs.unshift({
      id: Date.now() + Math.random(),
      actor: req.user ? req.user.email : 'System',
      action: 'ORDER_STATUS_CHANGED',
      entity: 'Order',
      entity_id: order.order_number,
      metadata: { previousStatus: currentStatus, newStatus },
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      orderNumber: order.order_number,
      previousStatus: currentStatus,
      newStatus: newStatus,
      message: `Order status updated to ${newStatus}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
}

export async function getOrders(req, res) {
  try {
    if (isDbConnected()) {
      const orders = await query('SELECT * FROM orders ORDER BY id DESC');
      if (orders) return res.json({ success: true, orders });
    }
    return res.json({ success: true, orders: mockDbStore.orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
}

