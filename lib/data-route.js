const { writeData } = require('./db');
const { isAuthenticated } = require('../api/_auth');

function createDataRoute(key, field) {
  return async function dataRoute(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    await writeData(key, req.body?.[field]);
    return res.status(200).json({ success: true });
  };
}

module.exports = { createDataRoute };
