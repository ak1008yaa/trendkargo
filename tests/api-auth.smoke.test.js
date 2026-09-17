// تست دود برای api/auth.js + اعتبار توکن امضاشده در api/store.js
const assert = require('assert');

process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.ADMIN_TOKEN = 'secret-pass';

global.fetch = async () => ({ ok: true, json: async () => [], text: async () => '' });

const authHandler = require('../api/auth.js');
const storeHandler = require('../api/store.js');

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
  // 1) لاگین با رمز اشتباه → 401
  let res = mockRes();
  await authHandler(mockReq('POST', { headers: { 'x-forwarded-for': '9.9.9.9' }, body: { password: 'wrong' } }), res);
  assert.strictEqual(res.statusCode, 401);
  console.log('✅ رمز اشتباه → 401');

  // 2) لاگین با رمز درست → 200 + توکن امضاشده
  res = mockRes();
  await authHandler(mockReq('POST', { headers: { 'x-forwarded-for': '8.8.8.8' }, body: { password: 'secret-pass' } }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.output.ok && res.output.token.includes('.'));
  const sessionToken = res.output.token;
  console.log('✅ لاگین موفق → توکن امضاشده صادر شد');

  // 3) توکن جلسه در api/store برای PUT پذیرفته می‌شود
  res = mockRes();
  await storeHandler(mockReq('PUT', { headers: { 'x-admin-token': sessionToken }, body: { key: 'hero', value: { title: 'x' } } }), res);
  assert.strictEqual(res.statusCode, 200);
  console.log('✅ توکن جلسه → PUT در store پذیرفته شد (200)');

  // 4) توکن دستکاری‌شده رد می‌شود
  res = mockRes();
  await storeHandler(mockReq('PUT', { headers: { 'x-admin-token': sessionToken.slice(0, -2) + 'zz' }, body: { key: 'hero', value: {} } }), res);
  assert.strictEqual(res.statusCode, 401);
  console.log('✅ توکن جعلی → 401 در store');

  // 5) توکن منقضی رد می‌شود
  const crypto = require('crypto');
  const past = Date.now() - 60000;
  const sig = crypto.createHmac('sha256', 'secret-pass').update(`tc-session:${past}`).digest('hex');
  res = mockRes();
  await storeHandler(mockReq('PUT', { headers: { 'x-admin-token': `${past}.${sig}` }, body: { key: 'hero', value: {} } }), res);
  assert.strictEqual(res.statusCode, 401);
  console.log('✅ توکن منقضی → 401 در store');

  // 6) rate-limit ورود: ۷ تلاش اشتباه از یک IP → 429
  let got429 = false;
  for (let i = 0; i < 7; i++) {
    res = mockRes();
    await authHandler(mockReq('POST', { headers: { 'x-forwarded-for': '7.7.7.7' }, body: { password: 'nope' } }), res);
    if (res.statusCode === 429) got429 = true;
  }
  assert.ok(got429, 'login brute-force should be blocked');
  console.log('✅ حمله حدس رمز → 429');

  console.log('\n🎉 همه تست‌های احراز هویت پاس شدند.');
  process.exit(0);
})().catch((error) => { console.error('❌ TEST FAILED:', error.message); process.exit(1); });
