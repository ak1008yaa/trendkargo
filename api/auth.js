/**
 * TREND CARGO — ADMIN AUTH API (Vercel Serverless Function)
 * ---------------------------------------------------------
 * POST /api/auth  { password } → { ok, token }
 *
 * لاگین واقعی سمت سرور: رمز ادمین با متغیر محیطی ADMIN_TOKEN مقایسه می‌شود
 * (timing-safe) و در صورت موفقیت یک توکن امضاشده HMAC با اعتبار ۱۲ ساعته
 * صادر می‌گردد که در هدر x-admin-token برای /api/store قابل استفاده است.
 *
 * فرمت توکن:  <expiryMs>.<hmac-sha256-hex>   (امضا با ADMIN_TOKEN به‌عنوان کلید)
 */

const crypto = require('crypto');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // ۱۲ ساعت

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 8192) { reject(new Error('Payload too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { const raw = Buffer.concat(chunks).toString('utf8'); resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** صدور توکن امضاشده — همان منطقِ اعتبارسنجی در api/store.js */
function issueToken(secret) {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const signature = crypto.createHmac('sha256', secret).update(`tc-session:${expiry}`).digest('hex');
  return `${expiry}.${signature}`;
}

// rate-limit ساده ضد حدس رمز (Brute-force)
const attempts = new Map();
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 10 * 60 * 1000;
function isBlocked(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  if (attempts.size > 10000) attempts.clear();
  return list.length >= MAX_ATTEMPTS;
}
function recordAttempt(ip) {
  const list = attempts.get(ip) || [];
  list.push(Date.now());
  attempts.set(ip, list);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
  if (req.method !== 'POST') { send(res, 405, { ok: false, error: 'Method not allowed' }); return; }

  const secret = String(process.env.ADMIN_TOKEN || '').trim();
  if (!secret) { send(res, 503, { ok: false, error: 'Auth not configured (ADMIN_TOKEN missing)' }); return; }

  try {
    const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
    if (isBlocked(ip)) { send(res, 429, { ok: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است. ۱۰ دقیقه دیگر دوباره تلاش کنید.' }); return; }

    const body = typeof req.body === 'object' && req.body ? req.body : await readBody(req);
    const password = String(body.password || '');

    if (!password || !timingSafeEqualStr(password, secret)) {
      recordAttempt(ip);
      send(res, 401, { ok: false, error: 'رمز عبور نادرست است' });
      return;
    }

    send(res, 200, { ok: true, token: issueToken(secret), expiresInHours: 12 });
  } catch (error) {
    send(res, 500, { ok: false, error: error.message || 'Internal server error' });
  }
};
