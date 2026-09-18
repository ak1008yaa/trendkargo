const { validCredentials } = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  if (!validCredentials(username, password)) return res.status(401).json({ error: 'Invalid credentials' });
  res.setHeader('Set-Cookie', 'tc_auth=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400');
  return res.status(200).json({ success: true });
};
