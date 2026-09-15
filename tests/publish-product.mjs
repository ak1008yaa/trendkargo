// انتشار/بروزرسانی یک محصول روی بکند Supabase (کلید products)
// اجرا:  node tests/publish-product.mjs
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()])
);

const SUPABASE_URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) { console.error('.env is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// محصول جدید — برای تغییر، همین آبجکت را ویرایش کنید
const product = {
  id: 11,
  category: 'accessory',
  catName: 'اکسسوری و کیف',
  title: 'کمربند بوهو-شیک طرح گل کنده‌کاری با سگک وینتیج نقره‌ای',
  price: '۳,۵۰۰,۰۰۰',
  rawPrice: 3500000,
  tag: '🆕 جدید · استایل وینتیج',
  mainImg: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621784563330-caee0b138a00?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80'
  ],
  desc: 'کمربند با طراحی بوهو-شیک و سگک بیضی توخالی وینتیج؛ اکسسوری خاص و همه‌کاره با ظاهر رترو-مدرن که به‌راحتی با جین، شلوار پارچه‌ای، دامن و پیراهن ست می‌شود. انتخابی شیک برای استایل روزمره، دانشگاه، سفر و مهمانی‌های غیررسمی.',
  specs: [
    'طراحی: بوهو-شیک رترو با کنده‌کاری طرح گل',
    'سگک: بیضی توخالی وینتیج با آبکاری نقره‌ای',
    'رنگ: کلاسیک همه‌کاره قابل ست با انواع لباس',
    'مناسب: جین، شلوار پارچه‌ای، دامن، پیراهن و استایل خیابانی',
    'هدیه: گزینه‌ای عالی برای علاقه‌مندان استایل بوهو و رترو'
  ]
};

// خواندن لیست فعلی
const readRes = await fetch(`${SUPABASE_URL}/rest/v1/site_data?select=value&key=eq.products`, { headers });
if (!readRes.ok) { console.error('Read failed: HTTP', readRes.status); process.exit(1); }
const rows = await readRes.json();
let products = Array.isArray(rows[0]?.value) ? rows[0].value : [];

// افزودن یا بروزرسانی
const idx = products.findIndex((p) => String(p.id) === String(product.id));
if (idx >= 0) { products[idx] = product; console.log('↻ محصول موجود بروزرسانی شد'); }
else { products.unshift(product); console.log('+ محصول جدید اضافه شد'); }

// ذخیره
const writeRes = await fetch(`${SUPABASE_URL}/rest/v1/site_data?on_conflict=key`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify([{ key: 'products', value: products }])
});
console.log('Write → HTTP', writeRes.status, '| total products on backend:', products.length);
process.exit(writeRes.ok ? 0 : 1);
