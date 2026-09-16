const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

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
  const discounts = readData('discounts.json');
  if (discounts) {
    return res.json({ success: true, data: discounts });
  }
  return res.json({ success: true, data: [] });
});

router.post('/', (req, res) => {
  try {
    const { discounts } = req.body;
    if (!Array.isArray(discounts)) {
      return res.status(400).json({ error: 'Discounts must be an array.' });
    }
    if (writeData('discounts.json', discounts)) {
      return res.json({ success: true, message: 'Discounts saved successfully.' });
    }
    return res.status(500).json({ error: 'Failed to save discounts.' });
  } catch (e) {
    console.error('[discounts] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
