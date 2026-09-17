// محلی‌سازی عکس‌های Unsplash: دانلود به‌صورت WebP در assets/img و بازنویسی URL‌ها در کد
// اجرا:  node tests/localize-images.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'img');
mkdirSync(outDir, { recursive: true });

const files = ['js/script.js', 'index.html', 'admin.html', 'admin/index.html'];
const photoIds = new Map(); // id -> localFile

// پیدا کردن تمام URL‌های unsplash و گروه‌بندی بر اساس photo-id
for (const file of files) {
  const abs = path.join(root, file);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, 'utf8');
  const matches = text.match(/https:\/\/images\.unsplash\.com\/photo-([0-9a-z-]+)[^"'\s)]*/g) || [];
  for (const url of matches) {
    const id = url.match(/photo-([0-9a-z-]+)/)[1];
    if (!photoIds.has(id)) photoIds.set(id, url);
  }
}

console.log(`🔍 ${photoIds.size} عکس یکتای Unsplash پیدا شد`);

let downloaded = 0, failed = 0;
const idToLocal = new Map();

for (const [id, originalUrl] of photoIds) {
  const fileName = `unsplash-${id}.webp`;
  const filePath = path.join(outDir, fileName);
  // دانلود با کیفیت تعادلی: حداکثر عرض 800 و فرمت WebP
  const fetchUrl = `https://images.unsplash.com/photo-${id}?w=800&fm=webp&auto=format&q=78`;
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error('file too small — probably an error page');
    writeFileSync(filePath, buf);
    idToLocal.set(id, `assets/img/${fileName}`);
    downloaded++;
    console.log(`  ✅ ${fileName} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (error) {
    failed++;
    console.log(`  ⚠️ دانلود نشد (URL اصلی نگه داشته می‌شود): ${id} — ${error.message}`);
  }
}

// بازنویسی URL‌ها در فایل‌ها (همه عرض‌های مختلف همان photo-id → یک فایل محلی)
if (downloaded > 0) {
  for (const file of files) {
    const abs = path.join(root, file);
    if (!existsSync(abs)) continue;
    let text = readFileSync(abs, 'utf8');
    let changed = 0;
    for (const [id, local] of idToLocal) {
      const re = new RegExp(`https:\\/\\/images\\.unsplash\\.com\\/photo-${id.replace(/-/g, '-')}\\?[^"'\\s)]*`, 'g');
      const before = text.length;
      text = text.replace(re, local);
      if (text.length !== before) changed++;
    }
    if (changed > 0) { writeFileSync(abs, text, 'utf8'); console.log(`✍️ ${file} بروزرسانی شد`); }
  }
}

console.log(`\n📦 ${downloaded} دانلود شد، ${failed} ناموفق.`);
writeFileSync(path.join(root, 'tests', 'image-map.json'), JSON.stringify(Object.fromEntries(idToLocal), null, 2), 'utf8');
