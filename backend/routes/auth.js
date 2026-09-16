const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const ADMIN_PASSWORD_HASH = 'e03896efeec0a98c9ebe92ed37bafd43ac96900dec57c6af58d1f04787e8ea9b';
const ADMIN_USERNAME = 'admin';

function verifyPassword(password) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === ADMIN_PASSWORD_HASH;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid username.' });
    }
    
    if (!verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    
    // Set auth cookie (works with credentials: true in fetch)
    res.cookie('tc_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.json({ success: true, message: 'Login successful.' });
  } catch (e) {
    console.error('[auth/login]', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('tc_auth');
  return res.json({ success: true, message: 'Logout successful.' });
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  const auth = req.cookies['tc_auth'];
  return res.json({ authenticated: auth === 'true' });
});

module.exports = router;
