// تست قرارداد DOM — بررسی تطابق HTML و JS
// ۱) هر onclick/onchange در HTML باید تابعش در JS تعریف شده باشد
// ۲) هر getElementById('x') در JS باید عنصرش در HTML موجود باشد
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const scriptJs = read('js/script.js');
const adminHtml = read('admin.html');
const adminInlineScript = adminHtml.slice(adminHtml.lastIndexOf('<script>'));

const sources = {
  'index.html': { html: read('index.html'), scripts: [scriptJs], ownScripts: [] },
  'admin.html': { html: adminHtml, scripts: [scriptJs], ownScripts: [adminInlineScript] },
  'invoice.html': { html: read('invoice.html'), scripts: [scriptJs], ownScripts: [] }
};
const allHtmlIds = new Set(Object.values(sources).flatMap((cfg) => [...cfg.html.matchAll(/id\s*=\s*"([^"]+)"/g)].map((x) => x[1])));
const NATIVE_HANDLERS = new Set(['print', 'stopPropagation', 'preventDefault', 'open', 'location', 'alert', 'history', 'blur', 'focus', 'submit', 'reset']);
// عناصر اختیاری: در بعضی صفحات وجود ندارند و کد با محافظ (if) مدیریتشان می‌کند
const OPTIONAL_IDS = new Set([
  'toast',                     // توست ادمین — در فروشگاه از live-toast استفاده می‌شود
  'dynamic-structured-data'    // تگ JSON-LD که در زمان اجرا توسط JS ساخته می‌شود
]);

let failures = 0;
const fail = (msg) => { failures++; console.log(' ⛔ ' + msg); };

function definedFunctions(code) {
  const names = new Set();
  const patterns = [/function\s+([A-Za-z_$][\w$]*)\s*\(/g, /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(code))) names.add(m[1]);
  }
  return names;
}

// ---------- ۱) رویدادهای inline ----------
for (const [page, cfg] of Object.entries(sources)) {
  const defined = new Set();
  cfg.scripts.concat(cfg.ownScripts).forEach((code) => definedFunctions(code).forEach((n) => defined.add(n)));

  const inlineCalls = new Set();
  const re = /on(?:click|change|input|submit)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(cfg.html))) {
    // فقط فراخوانی‌های سراسری (بدون نقطه قبل از نام) — نه متدها مثل event.stopPropagation()
    const callRe = /(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
    let c;
    while ((c = callRe.exec(m[1]))) inlineCalls.add(c[2]);
  }

  let checked = 0;
  for (const fn of inlineCalls) {
    if (NATIVE_HANDLERS.has(fn)) continue;
    checked++;
    if (!defined.has(fn)) fail(`${page}: تابع «${fn}» در رویداد inline صدا زده شده ولی در JS تعریف نشده است`);
  }
  console.log(`✅ ${page}: ${checked} فراخوانی inline بررسی شد`);
}

// ---------- ۲) شناسه‌های DOM ----------
for (const [page, cfg] of Object.entries(sources)) {
  const htmlIds = new Set([...cfg.html.matchAll(/id\s*=\s*"([^"]+)"/g)].map((x) => x[1]));
  const ownInlineIds = new Set([...cfg.ownScripts.join('\n').matchAll(/getElementById\(\s*['"`]([^'"`$]+)['"`]\s*\)/g)].map((x) => x[1]));
  const sharedScriptIds = new Set([...cfg.scripts.join('\n').matchAll(/getElementById\(\s*['"`]([^'"`$]+)['"`]\s*\)/g)].map((x) => x[1]));

  // شناسه‌های اسکریپت اختصاصی همان صفحه → باید در همان صفحه باشند
  for (const id of ownInlineIds) {
    if (!htmlIds.has(id)) fail(`${page}: اسکریپت اختصاصی به عنصر «#${id}» دسترسی دارد ولی در همین صفحه وجود ندارد`);
  }
  // شناسه‌های اسکریپت مشترک (script.js) → در همین صفحه یا یکی از صفحات دیگر
  for (const id of sharedScriptIds) {
    if (OPTIONAL_IDS.has(id)) continue;
    if (!htmlIds.has(id) && !allHtmlIds.has(id)) fail(`${page}: اسکریپت مشترک به عنصر «#${id}» دسترسی دارد که در هیچ صفحه‌ای وجود ندارد`);
  }
  console.log(`✅ ${page}: ${ownInlineIds.size} شناسه اختصاصی + ${sharedScriptIds.size} شناسه مشترک بررسی شد`);
}

if (failures) {
  console.log(`\n${failures} مورد ناسازگاری پیدا شد.`);
  process.exit(1);
}
console.log('\n🎉 همه فراخوانی‌های HTML ↔ JS سالم هستند.');