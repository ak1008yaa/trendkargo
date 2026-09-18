const { readAll } = require('../lib/db');
const { isAuthenticated } = require('./_auth');

const keys = {
  products: 'products',
  specialOffer: 'special_offer',
  news: 'news',
  rates: 'rates',
  testimonials: 'testimonials',
  discounts: 'discounts',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rows = await readAll();
    const data = {};
    for (const [name, key] of Object.entries(keys)) {
      const row = rows.find((item) => item.key === key);
      if (row) data[name] = row.value;
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: 'Store unavailable' });
  }
};
