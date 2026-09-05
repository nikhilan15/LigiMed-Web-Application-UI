import { query, isDbConnected } from '../config/db.js';
import { mockDbStore } from '../database/initDb.js';
import { logger } from '../config/logger.js';

export async function bulkUploadProducts(req, res) {
  try {
    const { items, csvData, dealerId = (req.user ? req.user.id : 2) } = req.body;

    let rawRows = [];

    if (items && Array.isArray(items)) {
      rawRows = items;
    } else if (csvData && typeof csvData === 'string') {
      const lines = csvData.split('\n');
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().toLowerCase()) : [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim());

        rawRows.push({
          lineIndex: i + 1,
          name: cols[0],
          mrp: cols[1],
          discounted_price: cols[2],
          stock_quantity: cols[3],
          expiry_date: cols[4],
          category: cols[5] || 'General',
          manufacturer: cols[6] || 'Pharma Corp',
          moq: cols[7] || 1,
          sku: cols[8] || `SKU-${cols[0]}-${Date.now()}`
        });
      }
    }

    if (rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No product rows found in CSV upload' });
    }

    const validProducts = [];
    const invalidRows = [];
    const existingSkus = new Set(mockDbStore.products.map(p => p.sku));

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const lineNum = row.lineIndex || (index + 1);

      // Validate Product Name
      if (!row.name || !String(row.name).trim()) {
        invalidRows.push({ line: lineNum, product: row.name || 'Unknown', reason: 'Missing product name' });
        continue;
      }

      // Validate Prices
      const price = parseFloat(row.discounted_price || row.price);
      const mrp = parseFloat(row.mrp);

      if (isNaN(price) || price <= 0) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'Invalid or non-positive dealer price' });
        continue;
      }
      if (!isNaN(mrp) && price > mrp) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'Dealer price cannot exceed MRP' });
        continue;
      }

      // Validate Stock
      const stock = parseInt(row.stock_quantity || row.stock, 10);
      if (isNaN(stock) || stock < 0) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'Invalid or negative stock quantity' });
        continue;
      }

      // Validate MOQ
      const moq = parseInt(row.moq || 1, 10);
      if (isNaN(moq) || moq <= 0) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'MOQ must be greater than zero' });
        continue;
      }
      if (moq > stock && stock > 0) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'MOQ cannot exceed total available stock' });
        continue;
      }

      // Validate Expiry Date
      if (row.expiry_date && isNaN(Date.parse(row.expiry_date))) {
        invalidRows.push({ line: lineNum, product: row.name, reason: 'Invalid expiry date format' });
        continue;
      }

      // Validate Duplicates
      const sku = row.sku || `SKU-${row.name.replace(/\s+/g, '-').toUpperCase()}`;
      if (existingSkus.has(sku)) {
        invalidRows.push({ line: lineNum, product: row.name, reason: `Duplicate SKU '${sku}'` });
        continue;
      }
      existingSkus.add(sku);

      const finalProduct = {
        id: Date.now() + Math.floor(Math.random() * 1000000),
        name: String(row.name).trim(),
        category: (row.category || 'General').trim(),
        manufacturer: (row.manufacturer || 'Pharma Corp').trim(),
        sku: sku,
        mrp: isNaN(mrp) ? Math.round(price * 1.2 * 100) / 100 : mrp,
        discounted_price: price,
        dealer_id: dealerId,
        dealer_name: `Dealer #${dealerId}`,
        stock_quantity: stock,
        moq: moq,
        expiry_date: row.expiry_date || '2027-12-31',
        cold_chain_required: (row.category && row.category.toLowerCase().includes('cold')) ? 1 : 0,
        status: 'active'
      };

      validProducts.push(finalProduct);
    }

    // Insert valid products into database and mock store
    if (isDbConnected() && validProducts.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < validProducts.length; i += chunkSize) {
        const chunk = validProducts.slice(i, i + chunkSize);
        const valuePlaceholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flatParams = chunk.flatMap(p => [
          p.name, p.category, p.manufacturer, p.sku, p.mrp, p.discounted_price,
          p.dealer_id, p.stock_quantity, p.moq, p.expiry_date, p.cold_chain_required
        ]);
        await query(
          `INSERT INTO products (name, category, manufacturer, sku, mrp, discounted_price, dealer_id, stock_quantity, moq, expiry_date, cold_chain_required) VALUES ${valuePlaceholders}`,
          flatParams
        );
      }
    }
    for (const p of validProducts) {
      mockDbStore.products.unshift(p);
    }

    logger.info(`[BULK CSV UPLOAD] Imported ${validProducts.length} valid SKUs, Rejected ${invalidRows.length} invalid rows.`);

    return res.status(201).json({
      success: true,
      message: `Processed ${rawRows.length} rows: ${validProducts.length} imported successfully, ${invalidRows.length} invalid rows rejected.`,
      totalRows: rawRows.length,
      importedCount: validProducts.length,
      rejectedCount: invalidRows.length,
      errors: invalidRows
    });
  } catch (err) {
    logger.error(`Bulk upload error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to process bulk product upload' });
  }
}

