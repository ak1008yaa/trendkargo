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
  const offer = readData('special-offer.json');
  if (offer) {
    return res.json({ success: true, data: offer });
  }
  return res.status(404).json({ error: 'No special offer found.' });
});

router.post('/', (req, res) => {
  try {
    const { offer } = req.body;
    if (!offer || typeof offer !== 'object') {
      return res.status(400).json({ error: 'Valid offer object is required.' });
    }
    if (writeData('special-offer.json', offer)) {
      req.app.locals.broadcastStoreUpdate?.('special-offer');
      return res.json({ success: true, message: 'Special offer saved successfully.' });
    }
    return res.status(500).json({ error: 'Failed to save special offer.' });
  } catch (e) {
    console.error('[special-offer] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
