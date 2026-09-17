// ----------------------------------------------------------------------------
// تحویل‌گر رویدادهای لحظه‌ای (SSE) + خروجی تجمیعی فروشگاه
// ادمین با هر ذخیره به همهٔ کلاینت‌ها اعلان می‌کند و سایت اصلی همان لحظه
// خودش را با سرور همگام می‌کند.
// ----------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const clients = new Set();
let storeVersion = 0;

function broadcastStoreUpdate(changed) {
  storeVersion += 1;
  const payload = `event: store-update\ndata: ${JSON.stringify({
    version: storeVersion,
    changed: Array.isArray(changed) ? changed : [changed],
    at: new Date().toISOString()
  })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (e) {
      clients.delete(res);
    }
  }
}

function readDataFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`[store] Error reading ${filename}:`, e.message);
  }
  return null;
}

// یک خروجی تجمیعی برای همگام‌سازی اولیه سایت اصلی
router.get('/store', (req, res) => {
  return res.json({
    success: true,
    version: storeVersion,
    data: {
      products: readDataFile('products.json'),
      news: readDataFile('news.json'),
      rates: readDataFile('rates.json'),
      specialOffer: readDataFile('special-offer.json'),
      testimonials: readDataFile('testimonials.json'),
      discounts: readDataFile('discounts.json')
    }
  });
});

router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ version: storeVersion })}\n\n`);
  clients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

module.exports = { router, broadcastStoreUpdate };