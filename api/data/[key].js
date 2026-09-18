const { readData, writeData } = require('../../lib/db');
const { isAuthenticated } = require('../_auth');

const allowed = new Set(['products', 'special_offer', 'news', 'rates', 'testimonials', 'discounts']);

module.exports = async function handler(req, res) {
  const key = req.query.key;
  if (!allowed.has(key)) return res.status(404).json({ error: 'Unknown data key' });
  try {
    if (req.method === 'GET') {
      const row = await readData(key);
      return res.status(200).json({ value: row?.value || null, updatedAt: row?.updated_at || null });
    }
    if (req.method === 'POST') {
      if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
      await writeData(key, req.body?.value);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Data service unavailable' });
  }
};
