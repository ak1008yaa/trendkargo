const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Helper: read JSON data file
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return null;
}

// Helper: write JSON data file
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

// Password hash verification
const ADMIN_PASSWORD_HASH = 'e03896efeec0a98c9ebe92ed37bafd43ac96900dec57c6af58d1f04787e8ea9b';
const ADMIN_USERNAME = 'admin';

function verifyPassword(password) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === ADMIN_PASSWORD_HASH;
}

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.cookies['tc_auth'];
  if (auth === 'true') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please login first.' });
}

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const discountsRoutes = require('./routes/discounts');
const ratesRoutes = require('./routes/rates');
const newsRoutes = require('./routes/news');
const offerRoutes = require('./routes/special-offer');
const testimonialsRoutes = require('./routes/testimonials');

// Serve static files (frontend) in production
app.use(express.static(path.join(__dirname, '..'), {
  maxAge: '1d',
  index: false
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'trendkargo-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/special-offer', offerRoutes);
app.use('/api/testimonials', testimonialsRoutes);

// ============================================
// AUTH ENDPOINTS
// ============================================

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid username.' });
    }
    
    if (!verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    
    // Set auth cookie
    res.cookie('tc_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.json({ success: true, message: 'Login successful.' });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('tc_auth');
  return res.json({ success: true, message: 'Logout successful.' });
});

app.get('/api/auth/status', (req, res) => {
  const auth = req.cookies['tc_auth'];
  return res.json({ authenticated: auth === 'true' });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Trend Cargo backend running on http://localhost:${PORT}`);
});
