// ممیزی خودکار SEO + GEO — اجرا: node tests/seo-audit.test.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SITE = 'https://trendkargo.ir';

let failures = 0;
const ok = (msg) => console.log('✅ ' + msg);
const fail = (msg) => { failures++; console.log(' ⛔ ' + msg); };
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

const index = read('index.html');
const admin = read('admin.html');
const invoice = read('invoice.html');
const notFound = read('404.html');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const llms = read('llms.txt');
const vercel = JSON.parse(read('vercel.json'));
const script = read('js/script.js');

// ---------- ۱) متاتگ‌های پایه ----------
const title = (index.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
const desc = (index.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '';
check(title.length >= 30 && title.length <= 75, `عنوان صفحه: ${title.length} کاراکتر (بازه مطلوب ۳۰-۷۵)`);
check(desc.length >= 120 && desc.length <= 165, `توضیحات متا: ${desc.length} کاراکتر (بازه مطلوب ۱۲۰-۱۶۵)`);
check(index.includes('name="viewport"'), 'متاتگ viewport موجود است');
check(/<html lang="fa" dir="rtl"/.test(index), 'زبان و جهت صفحه (fa / rtl) درست است');

// ---------- ۲) دامنه یکپارچه ----------
check(!index.includes('trendcargo.com'), 'هیچ ارجاع کهنه‌ای به trendcargo.com در index.html نیست');
for (const [name, content] of Object.entries({ robots, sitemap, llms, admin, invoice, notFound })) {
  if (content.includes('trendcargo.com')) fail(`${name}: هنوز دامنه قدیمی trendcargo.com دارد`);
}
ok('دامنه trendkargo.ir در robots/sitemap/llms/admin یکپارچه است');

// ---------- ۳) canonical و hreflang ----------
check(index.includes(`<link rel="canonical" href="${SITE}/">`), 'canonical به دامنه اصلی اشاره می‌کند');
check(index.includes('hreflang="fa-IR"') && index.includes('hreflang="x-default"'), 'hreflang برای fa-IR و x-default تنظیم شده است');

// ---------- ۴) Open Graph و Twitter ----------
for (const prop of ['og:type', 'og:title', 'og:description', 'og:image', 'og:url', 'og:locale', 'og:site_name']) {
  check(index.includes(`property="${prop}"`), `تگ ${prop} موجود است`);
}
for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
  check(index.includes(`name="${name}"`), `تگ ${name} موجود است`);
}

// ---------- ۵) سئوی جغرافیایی ----------
for (const geo of ['geo.region', 'geo.placename', 'geo.position', 'ICBM']) {
  check(index.includes(`name="${geo}"`), `متاتگ جغرافیایی ${geo} موجود است`);
}

// ---------- ۶) داده ساختاریافته (JSON-LD) ----------
const ldBlocks = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
check(ldBlocks.length > 0, `تعداد بلوک‌های JSON-LD: ${ldBlocks.length}`);
let merged = '';
for (const [i, block] of ldBlocks.entries()) {
  try {
    merged += JSON.stringify(JSON.parse(block));
    ok(`JSON-LD بلوک ${i + 1} معتبر است`);
  } catch (error) {
    fail(`JSON-LD بلوک ${i + 1} نامعتبر است: ${error.message}`);
  }
}
for (const type of ['Organization', 'WebSite', 'LocalBusiness', 'Service', 'FAQPage', 'WebPage']) {
  check(merged.includes(`"@type":"${type}"`), `اسکیمای ${type} تعریف شده است`);
}
check(merged.includes('"GeoCoordinates"'), 'مختصات جغرافیایی در اسکیمای LocalBusiness هست');
check(merged.includes('تبریز'), 'شهر تبریز در اسکیمای آدرس ثبت شده است');
check((merged.match(/"@type":"Question"/g) || []).length >= 3, 'حداقل ۳ پرسش در اسکیمای FAQPage هست');
check(merged.includes('"@id"'), 'ارجاعات @id برای اتصال موجودیت‌ها استفاده شده است');

// ---------- ۷) صفحات خصوصی نباید ایندکس شوند ----------
for (const [name, html] of Object.entries({ 'admin.html': admin, 'invoice.html': invoice, '404.html': notFound })) {
  check(/<meta name="robots" content="noindex/.test(html), `${name} با noindex محافظت شده است`);
}
const xRobots = JSON.stringify(vercel.headers);
check(xRobots.includes('X-Robots-Tag'), 'هدر X-Robots-Tag در vercel.json تنظیم شده است');
check(xRobots.includes('/api/'), 'مسیر API در هدرهای امنیتی پوشش داده شده است');
check(xRobots.includes('/llms.txt'), 'مسیر llms.txt در vercel.json تعریف شده است');

// ---------- ۸) robots.txt ----------
check(robots.includes(`Sitemap: ${SITE}/sitemap.xml`), 'آدرس sitemap در robots.txt درست است');
check(!robots.includes('/assets/private/'), 'مسیر ناموجود /assets/private حذف شده است');
check(/Disallow: \/admin/.test(robots), 'پنل ادمین در robots.txt مسدود شده است');
check(/Disallow: \/api\//.test(robots), 'API در robots.txt مسدود شده است');
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent']) {
  check(robots.includes(bot), `خزنده هوش مصنوعی ${bot} پوشش داده شده است`);
}

// ---------- ۹) sitemap.xml ----------
check(sitemap.includes(`<loc>${SITE}/</loc>`), 'صفحه اصلی در sitemap ثبت شده است');
check(!/#(products|calculator|custom-order|tech-news)</.test(sitemap), 'آدرس‌های fragment (#) از sitemap حذف شده‌اند (طبق استاندارد گوگل نامعتبرند)');
check(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap), 'lastmod با فرمت استاندارد هست');
check(sitemap.includes('xmlns:image'), 'namespace تصاویر در sitemap هست');
check((sitemap.match(/<url>/g) || []).length === (sitemap.match(/<\/url>/g) || []).length, 'تگ‌های url در sitemap متوازن هستند');

// ---------- ۱۰) llms.txt (استاندارد GEO) ----------
check(llms.startsWith('# '), 'llms.txt با تیتر H1 شروع می‌شود');
check(llms.length > 1000, `llms.txt حجم کافی دارد (${llms.length} کاراکتر)`);
for (const [label, needle] of [['فرمول قیمت', '۲۵'], ['زمان تحویل', '۱۵'], ['مسیر ایروان', 'ایروان'], ['تماس واتساپ', 'wa.me'], ['شهرها', 'تبریز'], ['نام برند', 'Trend Cargo']]) {
  check(llms.includes(needle), `llms.txt شامل ${label} است`);
}
check(llms.includes(SITE), 'llms.txt با دامنه اصلی به‌روزرسانی شده است');

// ---------- ۱۱) ساختار محتوایی ----------
const h1Count = (index.match(/<h1/g) || []).length;
check(h1Count === 1, `تعداد H1 دقیقاً یکی است (${h1Count})`);
const imgs = [...index.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const imgsNoAlt = imgs.filter((tag) => !/\balt=/.test(tag));
check(imgsNoAlt.length === 0, `همه تصاویر صفحه اصلی alt دارند (${imgs.length} تصویر بررسی شد)`);
check(index.includes('rel="preconnect"') && index.includes('rel="dns-prefetch"'), 'preconnect و dns-prefetch برای سرعت بارگذاری تنظیم شده است');
check(index.includes('theme-color'), 'رنگ تم برای موبایل تنظیم شده است');
check(index.includes('/llms.txt'), 'llms.txt در head صفحه معرفی شده است');

// ---------- ۱۲) داده ساختاریافته پویا ----------
check(script.includes('function injectDynamicStructuredData'), 'تزریق داده ساختاریافته پویا پیاده‌سازی شده است');
check(script.includes("'Product'"), 'اسکیمای Product برای محصولات ساخته می‌شود');
check(script.includes('AggregateRating'), 'امتیاز کل نظرات مشتریان به اسکیما اضافه می‌شود');
check(script.includes('BlogPosting'), 'اسکیمای مقالات وبلاگ تولید می‌شود');

console.log('');
if (failures) {
  console.log(`${failures} مورد نیاز به اصلاح دارد.`);
  process.exit(1);
}
console.log('🎉 ممیزی SEO + GEO کامل بدون خطا پاس شد.');