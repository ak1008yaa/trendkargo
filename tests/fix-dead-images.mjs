// جایگزینی ۳ عکس نامعتبر Unsplash با تصویر محلی پایه
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FALLBACK = 'assets/img/unsplash-1526738549149-8e07eca6c147.webp';
const DEAD = ['1622445262464-84b1456045b6', '1609592426508-cc0272464a7a', '1615913289763-53ff838cd9c1'];

for (const file of ['js/script.js', 'index.html', 'admin.html', 'admin/index.html']) {
  const abs = path.join(root, file);
  let text = readFileSync(abs, 'utf8');
  let hits = 0;
  for (const id of DEAD) {
    const re = new RegExp(`https:\\/\\/images\\.unsplash\\.com\\/photo-${id}\\?[^"'\\s)]*`, 'g');
    text = text.replace(re, () => { hits++; return FALLBACK; });
  }
  if (hits) { writeFileSync(abs, text, 'utf8'); console.log(`✍️ ${file}: ${hits} URL اصلاح شد`); }
}
console.log('done');
