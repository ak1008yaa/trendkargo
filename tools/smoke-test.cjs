#!/usr/bin/env node
/**
 * ==========================================================================
 *  TREND CARGO — STATIC SITE SMOKE TEST
 *  Serves the project from a temporary local server and verifies that every
 *  page, script, stylesheet, manifest and image resolves with HTTP 200 and a
 *  sane content type. Also checks that JSON config files are parseable.
 *
 *  Usage:
 *    node tools/smoke-test.cjs
 * ==========================================================================
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const PAGES = [
  'index.html', 'admin.html', 'invoice.html', 'blog.html', '404.html',
  'robots.txt', 'sitemap.xml', 'manifest.json', 'sw.js', 'css/style.css',
  'js/script.js', 'js/blog.js', 'js/blog-data.js', 'js/blog-admin.js',
  'assets/logo.png', 'assets/img/placeholder.svg', 'assets/favicon_io/favicon.ico',
  'assets/favicon_io/android-chrome-192x192.png', 'assets/favicon_io/android-chrome-512x512.png'
];

const JSON_FILES = ['manifest.json', 'vercel.json', 'data/products.seed.json', 'backend/data/products.json'];

function collectImages() {
  const out = [];
  for (const dir of ['assets/img/products', 'assets/img/blog']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of fs.readdirSync(abs)) out.push(`${dir}/${file}`);
  }
  return out;
}

function createServer() {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const abs = path.join(ROOT, rel);
    if (!abs.startsWith(ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.writeHead(404);
      return res.end('404');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(abs)] || 'application/octet-stream' });
    fs.createReadStream(abs).pipe(res);
  });
}

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;

  const urls = [...PAGES, ...collectImages()];
  let ok = 0;
  const failed = [];
  const mismatched = [];

  for (const url of urls) {
    let res;
    try {
      res = await fetch(base + url);
    } catch (err) {
      failed.push(`${url} -> ${err.message}`);
      continue;
    }
    if (!res.ok) {
      failed.push(`${url} -> HTTP ${res.status}`);
      continue;
    }
    ok++;
    const type = res.headers.get('content-type') || '';
    const ext = path.extname(url);
    if (ext === '.jpg' && !type.includes('image/jpeg')) mismatched.push(`${url} -> ${type}`);
    if (ext === '.svg' && !type.includes('image/svg')) mismatched.push(`${url} -> ${type}`);
  }

  console.log('checked           :', urls.length);
  console.log('HTTP 200          :', ok);
  console.log('failed            :', failed.length);
  failed.forEach((f) => console.log('   !', f));
  console.log('content-type bad  :', mismatched.length);
  mismatched.forEach((m) => console.log('   !', m));

  console.log('\n-- reference integrity --');
  const SCAN = [
    'index.html', 'admin.html', 'blog.html', 'invoice.html', '404.html',
    'js/script.js', 'js/blog.js', 'js/blog-data.js', 'js/blog-admin.js',
    'css/style.css', 'manifest.json', 'sw.js', 'data/products.seed.json'
  ];
  const REF_RE = /assets\/[A-Za-z0-9._@/-]+\.(?:jpg|jpeg|png|webp|avif|svg|ico)/g;
  let refsOk = 0;
  const missingRefs = [];
  const hotlinks = [];

  for (const file of SCAN) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const refs = [...new Set(text.match(REF_RE) || [])];
    for (const ref of refs) {
      if (fs.existsSync(path.join(ROOT, ref))) refsOk++;
      else missingRefs.push(`${file}: ${ref}`);
    }
    if (/images\.unsplash\.com/.test(text)) hotlinks.push(file);
  }

  console.log('   local refs resolving :', refsOk);
  console.log('   missing local refs   :', missingRefs.length);
  missingRefs.forEach((m) => console.log('   !', m));
  console.log('   files with hotlinks  :', hotlinks.length);
  hotlinks.forEach((h) => console.log('   !', h));

  console.log('\n-- JSON config --');
  for (const file of JSON_FILES) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) { console.log('   -', file, '(absent)'); continue; }
    try {
      JSON.parse(fs.readFileSync(abs, 'utf8'));
      console.log('   OK', file);
    } catch (err) {
      console.log('   !', file, '-> INVALID:', err.message);
    }
  }

  server.close();
  if (failed.length) process.exitCode = 1;
})();