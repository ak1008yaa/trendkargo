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
  const rates = readData('rates.json');
  if (rates) {
    return res.json({ success: true, data: rates });
  }
  return res.status(404).json({ error: 'No rates found.' });
});

router.post('/', (req, res) => {
  try {
    const { rates } = req.body;
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ error: 'Valid rates object is required.' });
    }
    if (writeData('rates.json', rates)) {
      return res.json({ success: true, message: 'Rates saved successfully.' });
    }
    return res.status(500).json({ error: 'Failed to save rates.' });
  } catch (e) {
    console.error('[rates] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
