const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return null;
}

function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filename}:`, e.message);
    return false;
  }
}

// POST /api/order — ثبت استعلام لینک محصول توسط مشتری (عمومی)
router.post('/order', (req, res) => {
  try {
    const { link, name, phone } = req.body || {};
    if (!link || !String(link).trim()) {
      return res.status(400).json({ error: 'Product link is required.' });
    }
    const orders = readData('orders.json') || [];
    const entry = {
      id: `Q-${Date.now()}`,
      link: String(link).trim(),
      name: String(name || '').trim() || 'مشتری',
      phone: String(phone || '').trim() || '-',
      status: 'new',
      createdAt: new Date().toISOString()
    };
    orders.unshift(entry);
    if (writeData('orders.json', orders.slice(0, 500))) {
      req.app.locals.broadcastStoreUpdate?.('orders');
      return res.json({ success: true, message: 'Quote request saved.', data: entry });
    }
    return res.status(500).json({ error: 'Failed to save quote request.' });
  } catch (e) {
    console.error('[order] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/orders — فهرست استعلام‌ها (ادمین)
router.get('/orders', (req, res) => {
  const orders = readData('orders.json') || [];
  return res.json({ success: true, data: orders });
});

// POST /api/orders/status — تغییر وضعیت استعلام (ادمین)
router.post('/orders/status', (req, res) => {
  try {
    const { id, status } = req.body || {};
    const allowed = ['new', 'contacted', 'invoiced', 'closed'];
    if (!id || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Valid id and status required.' });
    }
    const orders = readData('orders.json') || [];
    const idx = orders.findIndex((o) => String(o.id) === String(id));
    if (idx < 0) return res.status(404).json({ error: 'Order not found.' });
    orders[idx].status = status;
    if (writeData('orders.json', orders)) {
      req.app.locals.broadcastStoreUpdate?.('orders');
      return res.json({ success: true, message: 'Order status updated.' });
    }
    return res.status(500).json({ error: 'Failed to save order status.' });
  } catch (e) {
    console.error('[orders/status] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;