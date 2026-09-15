/**
 * TREND CARGO — PUBLIC ORDERS API (استعلام قیمت مشتریان)
 * ---------------------------------------------------------
 * POST /api/order  { link, name?, phone?, note? }
 * عمومی (بدون توکن) — برای فرم ثبت لینک مشتریان، با اعتبارسنجی و rate-limit.
 * درخواست‌ها در جدول site_data با کلید "orders" ذخیره می‌شوند و در پنل ادمین
 * (بخش مدیریت سفارش‌ها) نمایش داده می‌شوند.
 *
 * Required environment variables (همان api/store.js):
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */

const TABLE = 'site_data';
const ORDERS_KEY = 'orders';
const MAX_ORDERS = 500;                 // حداکثر تعداد نگهداری
const RATE_LIMIT = 5;                   // حداکثر درخواست از هر IP
const RATE_WINDOW_MS = 10 * 60 * 1000;  // در هر ۱۰ دقیقه
const MAX_BODY_BYTES = 64 * 1024;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.end(JSON.stringify(body));
}

function getConfig() {
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, key, configured: Boolean(url && key) };
}

/** rate-limit ساده در حافظه (هر instance جداگانه است — برای جلوگیری از اسپم بمب کافی است) */
const hits = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10000) hits.clear();
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new Error('Payload too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { const raw = Buffer.concat(chunks).toString('utf8'); resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function sanitize(value, maxLen) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function authHeaders(cfg) {
  return { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' };
}

async function fetchOrders(cfg) {
  const response = await fetch(`${cfg.url}/rest/v1/${TABLE}?select=value&key=eq.${ORDERS_KEY}`, {
    headers: authHeaders(cfg)
  });
  if (!response.ok) throw new Error(`Supabase read failed: HTTP ${response.status}`);
  const rows = await response.json();
  const value = rows && rows[0] ? rows[0].value : null;
  return Array.isArray(value) ? value : [];
}

async function saveOrders(cfg, orders) {
  const response = await fetch(`${cfg.url}/rest/v1/${TABLE}?on_conflict=key`, {
    method: 'POST',
    headers: { ...authHeaders(cfg), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ key: ORDERS_KEY, value: orders }])
  });
  if (!response.ok) throw new Error(`Supabase write failed: HTTP ${response.status}`);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
  if (req.method !== 'POST') { send(res, 405, { ok: false, error: 'Method not allowed — use POST' }); return; }

  const cfg = getConfig();
  if (!cfg.configured) { send(res, 503, { ok: false, error: 'Backend not configured' }); return; }

  try {
    const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) { send(res, 429, { ok: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.' }); return; }

    const body = typeof req.body === 'object' && req.body ? req.body : await readBody(req);

    const link = sanitize(body.link, 1000);
    // پذیرش لینک کامل یا حتی دامنه‌ی ساده (temu.com/xyz)
    if (!link || (!/^https?:\/\//i.test(link) && !/^[^\s]+\.[a-z]{2,}/i.test(link))) {
      send(res, 400, { ok: false, error: 'لینک محصول معتبر نیست.' });
      return;
    }

    const order = {
      id: `ORD-${Date.now()}`,
      link,
      name: sanitize(body.name, 100) || '-',
      phone: sanitize(body.phone, 30) || '-',
      note: sanitize(body.note, 500),
      source: 'custom-link',
      status: 'new',
      createdAt: new Date().toISOString()
    };

    const orders = await fetchOrders(cfg);
    orders.unshift(order);
    await saveOrders(cfg, orders.slice(0, MAX_ORDERS));

    send(res, 201, { ok: true, id: order.id });
  } catch (error) {
    send(res, 500, { ok: false, error: error.message || 'Internal server error' });
  }
};

