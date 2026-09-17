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

router.get('/', (req, res) => {
  const products = readData('products.json');
  if (products) {
    return res.json({ success: true, data: products });
  }
  return res.status(404).json({ error: 'No products found.' });
});

router.post('/', (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products must be an array.' });
    }
    if (writeData('products.json', products)) {
      req.app.locals.broadcastStoreUpdate?.('products');
      return res.json({ success: true, message: 'Products saved successfully.' });
    }
    return res.status(500).json({ error: 'Failed to save products.' });
  } catch (e) {
    console.error('[products] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
