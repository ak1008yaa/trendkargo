// تست دود برای api/order.js — شبیه‌سازی درخواست‌ها بدون Supabase واقعی
const assert = require('assert');

process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

const stored = { orders: [{ id: 'ORD-1', link: 'https://temu.com/x', status: 'new' }] };
let lastWrite = null;

global.fetch = async (url, options = {}) => {
  if (String(url).includes('key=eq.orders') && (!options.method || options.method === 'GET')) {
    return { ok: true, json: async () => [{ key: 'orders', value: stored.orders }] };
  }
  if (options.method === 'POST') {
    lastWrite = JSON.parse(options.body);
    return { ok: true, json: async () => [], text: async () => '' };
  }
  return { ok: true, json: async () => [], text: async () => '' };
};

const handler = require('../api/order.js');

function mockReq(method, { headers = {}, body } = {}) {
  return { method, headers, query: {}, body };
}
function mockRes() {
  const res = { statusCode: 0, headers: {}, output: null };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = (raw) => { res.output = raw ? JSON.parse(raw) : null; };
  return res;
}

(async () => {
  // 1) POST معتبر → 201 و ذخیره در Supabase
  let res = mockRes();
  await handler(mockReq('POST', { headers: { 'x-forwarded-for': '1.1.1.1' }, body: { link: 'https://www.temu.com/product/123.html', name: 'علی' } }), res);
  assert.strictEqual(res.statusCode, 201);
  assert.ok(res.output.id.startsWith('ORD-'));
  assert.strictEqual(lastWrite[0].key, 'orders');
  assert.strictEqual(lastWrite[0].value[0].name, 'علی');
  assert.strictEqual(lastWrite[0].value.length, 2); // قبلی + جدید
  console.log('✅ POST معتبر → 201، سفارش append شد');

  // 2) لینک نامعتبر → 400
  res = mockRes();
  await handler(mockReq('POST', { headers: { 'x-forwarded-for': '2.2.2.2' }, body: { link: 'سلام این لینک نیست' } }), res);
  assert.strictEqual(res.statusCode, 400);
  console.log('✅ لینک نامعتبر → 400');

  // 3) GET → 405
  res = mockRes();
  await handler(mockReq('GET'), res);
  assert.strictEqual(res.statusCode, 405);
  console.log('✅ GET → 405');

  // 4) rate-limit: ۵ درخواست مجاز، ششمین از یک IP → 429
  let got429 = false;
  for (let i = 0; i < 6; i++) {
    res = mockRes();
    await handler(mockReq('POST', { headers: { 'x-forwarded-for': '3.3.3.3' }, body: { link: 'https://shein.com/x' } }), res);
    if (i === 5) assert.strictEqual(res.statusCode, 429, '6th request must be rate-limited');
  }
  console.log('✅ Rate-limit → 429 بعد از ۵ درخواست از یک IP');

  console.log('\n🎉 همه تست‌های api/order پاس شدند.');
  process.exit(0);
})().catch((error) => { console.error('❌ TEST FAILED:', error.message); process.exit(1); });
