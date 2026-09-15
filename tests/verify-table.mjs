const resp = await fetch('https://api.supabase.com/v1/projects/zepoeywugldczcnvnlyn/database/query', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "SELECT key, jsonb_typeof(value) as type, updated_at FROM public.site_data ORDER BY key;" })
});
console.log('HTTP', resp.status);
console.log(JSON.stringify(await resp.json(), null, 2));
