// تست دود برای api/store.js — شبیه‌سازی درخواست‌ها بدون Supabase واقعی
const assert = require('assert');

process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.ADMIN_TOKEN = 'secret-pass';

// شبیه‌ساز fetch (به‌جای PostgREST واقعی)
let lastSupabaseCall = null;
global.fetch = async (url, options = {}) => {
  lastSupabaseCall = { url, options };
  if (options.method === 'POST') {
    return { ok: true, json: async () => [], text: async () => '' };
  }
  if (String(url).includes('key=eq.products')) {
    return { ok: true, json: async () => [{ key: 'products', value: [{ id: 1, title: 'تست' }] }] };
  }
  return {
    ok: true,
    json: async () => [
      { key: 'products', value: [{ id: 1, title: 'تست' }] },
      { key: 'invoices', value: [{ id: 'INV-1', total: 5 }] }
    ],
    text: async () => ''
  };
};

const handler = require('../api/store.js');

function mockReq(method, { headers = {}, body, query = {} } = {}) {
  return { method, headers, query, body };
}
function mockRes() {
  const res = { statusCode: 0, headers: {}, output: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = (raw) => { res.output = raw ? JSON.parse(raw) : null; };
  return res;
}

(async () => {
  // 1) GET همه داده‌ها
  let res = mockRes();
  await handler(mockReq('GET'), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.output.ok, true);
  assert.strictEqual(res.output.data.products[0].id, 1);
  console.log('✅ GET all → 200 با داده کامل');

  // 2) GET یک کلید
  res = mockRes();
  await handler(mockReq('GET', { query: { key: 'products' } }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(Object.keys(res.output.data), ['products']);
  console.log('✅ GET ?key=products → فقط همان کلید');

  // 3) PUT بدون توکن → 401
  res = mockRes();
  await handler(mockReq('PUT', { body: { key: 'products', value: [] } }), res);
  assert.strictEqual(res.statusCode, 401);
  console.log('✅ PUT بدون توکن → 401 Unauthorized');

  // 4) PUT با توکن اشتباه → 401
  res = mockRes();
  await handler(mockReq('PUT', { headers: { 'x-admin-token': 'wrong' }, body: { key: 'products', value: [] } }), res);
  assert.strictEqual(res.statusCode, 401);
  console.log('✅ PUT با توکن اشتباه → 401');

  // 5) PUT با توکن درست → upsert به PostgREST
  res = mockRes();
  await handler(mockReq('PUT', { headers: { 'x-admin-token': 'secret-pass' }, body: { key: 'products', value: [{ id: 9 }] } }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.output.saved, ['products']);
  assert.ok(lastSupabaseCall.url.includes('/rest/v1/site_data?on_conflict=key'));
  assert.strictEqual(lastSupabaseCall.options.headers.Prefer, 'resolution=merge-duplicates,return=minimal');
  console.log('✅ PUT با توکن درست → upsert Supabase');

  // 6) PUT فرمت {data: {…}}
  res = mockRes();
  await handler(mockReq('PUT', { headers: { 'x-admin-token': 'secret-pass' }, body: { data: { hero: { title: 'x' }, news: [] } } }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.output.saved, ['hero', 'news']);
  console.log('✅ PUT با فرمت {data:{…}} → چند کلید همزمان');

  // 7) DELETE با توکن درست
  global.fetch = async (url, options = {}) => ({ ok: true, json: async () => ({}), text: async () => '' });
  res = mockRes();
  await handler(mockReq('DELETE', { headers: { 'x-admin-token': 'secret-pass' }, query: { key: 'news' } }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.output.deleted, 'news');
  console.log('✅ DELETE → حذف کلید');

  // 8) متد ناشناخته → 405
  res = mockRes();
  await handler(mockReq('PATCH'), res);
  assert.strictEqual(res.statusCode, 405);
  console.log('✅ PATCH → 405');

  console.log('\n🎉 همه تست‌های بکند پاس شدند.');
})().catch((error) => { console.error('❌ TEST FAILED:', error.message); process.exit(1); });
