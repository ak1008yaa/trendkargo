/**
 * TREND CARGO — REAL BACKEND (Vercel Serverless Function)
 * ---------------------------------------------------------
 * Generic key/value store on Supabase Postgres (PostgREST REST API).
 * Zero npm dependencies — uses Node 18+ global fetch.
 *
 * Routes:
 *   GET    /api/store              → همه داده‌های سایت (عمومی، بدون توکن)
 *   GET    /api/store?key=products → فقط یک کلید خاص
 *   PUT    /api/store              → ذخیره/بروزرسانی (نیازمند هدر x-admin-token)
 *   DELETE /api/store?key=...      → حذف یک کلید (نیازمند هدر x-admin-token)
 *
 * Required environment variables (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL               مثل: https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  کلید service_role (فقط سمت سرور — هرگز expose نشود)
 *   ADMIN_TOKEN                رمز پنل ادمین (مقدار وارد شده در صفحه لاگین ادمین)
 */

const crypto = require('crypto');

const TABLE = 'site_data';
const MAX_BODY_BYTES = 8 * 1024 * 1024; // حداکثر ۸ مگابایت (تصاویر Base64 محصولات)

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.end(JSON.stringify(body));
}

function getConfig() {
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const adminToken = String(process.env.ADMIN_TOKEN || '').trim();
  return { url, key, adminToken, configured: Boolean(url && key) };
}

/** احراز هویت: یا رمز اصلی ادمین (ADMIN_TOKEN) یا توکن امضاشده صادرشده از /api/auth */
function isAuthorized(req, adminToken) {
  const provided = String(req.headers['x-admin-token'] || '');
  if (!adminToken || !provided) return false;

  // ۱) رمز مستقیم ادمین (سازگاری با نسخه قبلی)
  const a = Buffer.from(provided);
  const b = Buffer.from(adminToken);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;

  // ۲) توکن امضاشده جلسه:  <expiryMs>.<hmac>
  const parts = provided.split('.');
  if (parts.length === 2) {
    const expiry = Number(parts[0]);
    const signature = String(parts[1]);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
    const expected = crypto.createHmac('sha256', adminToken).update(`tc-session:${expiry}`).digest('hex');
    const x = Buffer.from(signature);
    const y = Buffer.from(expected);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  }

  return false;
}

function supabaseFetch(config, path, options = {}) {
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  const config = getConfig();

  if (!config.configured) {
    send(res, 503, {
      ok: false,
      error: 'Backend not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.'
    });
    return;
  }

  try {
    // ---------- GET: خواندن داده‌ها ----------
    if (req.method === 'GET') {
      const singleKey = req.query && req.query.key ? String(req.query.key) : null;
      let path = `${TABLE}?select=key,value,updated_at&order=key.asc`;
      if (singleKey) path = `${TABLE}?select=key,value&key=eq.${encodeURIComponent(singleKey)}`;

      const response = await supabaseFetch(config, path);
      if (!response.ok) {
        send(res, 502, { ok: false, error: `Supabase error: HTTP ${response.status}` });
        return;
      }
      const rows = await response.json();
      const data = {};
      for (const row of rows || []) data[row.key] = row.value;
      send(res, 200, { ok: true, data: singleKey ? { [singleKey]: data[singleKey] } : data });
      return;
    }

    // ---------- PUT / POST: ذخیره ----------
    if (req.method === 'PUT' || req.method === 'POST') {
      if (!isAuthorized(req, config.adminToken)) {
        send(res, 401, { ok: false, error: 'Unauthorized — invalid admin token' });
        return;
      }

      const body = typeof req.body === 'object' && req.body ? req.body : await readBody(req);

      // پشتیبانی از دو فرمت: {key, value} یا {data: {key: value, ...}}
      let entries = [];
      if (body && typeof body.key === 'string' && 'value' in body) {
        entries.push([body.key, body.value]);
      } else if (body && body.data && typeof body.data === 'object') {
        entries = Object.entries(body.data);
      }

      entries = entries.filter(([key]) => typeof key === 'string' && key.trim().length > 0 && key.length <= 100);
      if (!entries.length) {
        send(res, 400, { ok: false, error: 'Request must include {key, value} or {data: {key: value}}' });
        return;
      }

      const rows = entries.map(([key, value]) => ({ key: key.trim(), value: value === undefined ? null : value }));
      const response = await supabaseFetch(config, `${TABLE}?on_conflict=key`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(rows)
      });

      if (!response.ok) {
        const errorText = await response.text();
        send(res, 502, { ok: false, error: `Supabase upsert failed: ${errorText.slice(0, 300)}` });
        return;
      }

      send(res, 200, { ok: true, saved: rows.map((row) => row.key) });
      return;
    }

    // ---------- DELETE: حذف ----------
    if (req.method === 'DELETE') {
      if (!isAuthorized(req, config.adminToken)) {
        send(res, 401, { ok: false, error: 'Unauthorized — invalid admin token' });
        return;
      }
      const key = req.query && req.query.key ? String(req.query.key) : '';
      if (!key) {
        send(res, 400, { ok: false, error: 'Missing ?key= parameter' });
        return;
      }
      const response = await supabaseFetch(config, `${TABLE}?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (!response.ok) {
        send(res, 502, { ok: false, error: `Supabase delete failed: HTTP ${response.status}` });
        return;
      }
      send(res, 200, { ok: true, deleted: key });
      return;
    }

    send(res, 405, { ok: false, error: `Method ${req.method} not allowed` });
  } catch (error) {
    send(res, 500, { ok: false, error: error.message || 'Internal server error' });
  }
};


