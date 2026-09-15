// اجرای migration از طریق Supabase Management API (بدون نیاز به اتصال مستقیم DB)
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'zepoeywugldczcnvnlyn';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
if (!ACCESS_TOKEN) { console.error('SUPABASE_ACCESS_TOKEN is missing'); process.exit(1); }

const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260915030000_init_site_data.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

(async () => {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const payload = await response.json().catch(() => null);
  console.log(`HTTP ${response.status}`);
  console.log(JSON.stringify(payload, null, 2).slice(0, 2000));
  process.exit(response.ok ? 0 : 1);
})();
