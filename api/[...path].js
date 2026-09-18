const { readData, writeData } = require('../lib/db');
const { isAuthenticated } = require('./_auth');

const routeKeys = {
  products: 'products',
  'special-offer': 'special_offer',
  news: 'news',
  rates: 'rates',
  testimonials: 'testimonials',
  discounts: 'discounts',
};

module.exports = async function handler(req, res) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const route = parts.filter(Boolean).join('/');
  const key = routeKeys[route];
  if (!key) return res.status(404).json({ error: 'API route not found' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body || {};
  const value = payload.products ?? payload.offer ?? payload.news
    ?? payload.rates ?? payload.testimonials ?? payload.discounts;
  await writeData(key, value);
  return res.status(200).json({ success: true });
};
