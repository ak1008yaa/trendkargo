const keysResp = await fetch('https://api.supabase.com/v1/projects/zepoeywugldczcnvnlyn/api-keys', {
  headers: { Authorization: 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN }
});
console.log('HTTP', keysResp.status);
const keys = await keysResp.json();
const list = Array.isArray(keys) ? keys : keys.keys || [];
const serviceRole = list.find((k) => k.name === 'service_role');
console.log('SUPABASE_URL=https://zepoeywugldczcnvnlyn.supabase.co');
console.log('SUPABASE_SERVICE_ROLE_KEY=' + (serviceRole ? serviceRole.api_key : 'NOT FOUND'));

// تست مستقیم PostgREST — همان مسیری که api/store.js استفاده می‌کند
if (serviceRole) {
  const rest = await fetch('https://zepoeywugldczcnvnlyn.supabase.co/rest/v1/site_data?select=key,value', {
    headers: {
      apikey: serviceRole.api_key,
      Authorization: 'Bearer ' + serviceRole.api_key
    }
  });
  console.log('PostgREST GET → HTTP', rest.status);
  const rows = await rest.json();
  console.log('rows:', (rows || []).map((r) => r.key).join(', '));
}

