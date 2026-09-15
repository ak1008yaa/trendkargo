// خروجی کامل جدول site_data از Supabase برای بکاپ
import { writeFileSync } from 'fs';

const resp = await fetch('https://api.supabase.com/v1/projects/zepoeywugldczcnvnlyn/database/query', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "SELECT coalesce(jsonb_agg(jsonb_build_object('key', key, 'value', value, 'updated_at', updated_at) order by key), '[]'::jsonb) as data FROM public.site_data;" })
});
const payload = await resp.json();
if (!resp.ok) { console.error('HTTP', resp.status, JSON.stringify(payload)); process.exit(1); }

const rows = payload[0] ? payload[0].data : [];
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const outPath = `backups/supabase-site_data-${stamp}.json`;
writeFileSync(outPath, JSON.stringify({ exportedAt: new Date().toISOString(), projectRef: 'zepoeywugldczcnvnlyn', tables: { site_data: rows } }, null, 2), 'utf8');
console.log(`✅ ${rows.length} رکورد از site_data در ${outPath} ذخیره شد (${(rows.map(r=>r.key)).join(', ')})`);
