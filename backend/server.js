const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
// ----------------------------------------------------------------------------
// مسیر ذخیره داده — قابل تنظیم با متغیر محیطی برای دیسک دائمی (Render Disk).
// اگر DATA_DIR تعریف نشده باشد، پوشه پیش‌فرض backend/data استفاده می‌شود.
// ----------------------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Ensure data directory exists + seed from repo copy on first boot (e.g. fresh Disk)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SEED_DIR = path.join(__dirname, 'data');
const SEED_FILES = ['products.json', 'news.json', 'rates.json', 'special-offer.json', 'testimonials.json', 'discounts.json', 'orders.json'];
for (const file of SEED_FILES) {
  try {
    const target = path.join(DATA_DIR, file);
    const seed = path.join(SEED_DIR, file);
    if (!fs.existsSync(target) && fs.existsSync(seed)) {
      fs.copyFileSync(seed, target);
      console.log(`[seed] ${file} copied to DATA_DIR`);
    }
  } catch (e) {
    console.error(`[seed] ${file}:`, e.message);
  }
}

// Middleware
// نکته: فشرده‌سازی برای استریم SSE غیرفعال است تا رویدادها لحظه‌ای برسند.
app.use(compression({
  filter: (req, res) => {
    if (req.originalUrl && req.originalUrl.includes('/api/events')) return false;
    return compression.filter(req, res);
  }
}));
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

// Password hash verification (env-driven; legacy constant as dev fallback)
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_SHA256 ||
  'e03896efeec0a98c9ebe92ed37bafd43ac96900dec57c6af58d1f04787e8ea9b';
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';

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
const ordersRoutes = require('./routes/orders');
const { router: storeRoutes, broadcastStoreUpdate } = require('./routes/store');

// اعلان لحظه‌ای به کلاینت‌ها (SSE) برای همهٔ routeها در دسترس است
app.locals.broadcastStoreUpdate = broadcastStoreUpdate;

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
app.use('/api', ordersRoutes);
app.use('/api', storeRoutes);

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
