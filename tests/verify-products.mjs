// تأیید خواندن محصولات از بکند
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_data?select=value&key=eq.products`, { headers });
const data = await res.json();
const products = data[0]?.value || [];
console.log('HTTP', res.status, '| products on server:', products.length);
for (const p of products) console.log(`- [${p.id}] ${p.title} | ${p.price} تومان | ${p.catName}`);
