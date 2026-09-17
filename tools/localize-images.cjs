#!/usr/bin/env node
/**
 * ==========================================================================
 *  TREND CARGO — LOCAL IMAGE LOCALIZER
 *  Downloads every externally hot-linked image (Unsplash) into assets/img/
 *  and rewrites all site references to local, host-served (Vercel) paths.
 *
 *  Usage:
 *    node tools/localize-images.cjs            # download + rewrite
 *    node tools/localize-images.cjs --dry-run  # report only, no changes
 * ==========================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const HOST = 'https://images.unsplash.com';
const PLACEHOLDER = 'assets/img/placeholder.svg';

const SOURCES = [
  'index.html', 'admin.html', 'blog.html', 'invoice.html', '404.html',
  'js/script.js', 'js/blog.js', 'js/blog-data.js', 'js/blog-admin.js',
  'products.json', 'css/style.css'
];

// Files whose images are editorial/blog artwork rather than catalog products.
const BLOG_FILES = new Set(['js/blog-data.js', 'js/blog-admin.js']);

const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const TERMINATORS = new Set(['"', "'", '`', ' ', '\n', '\r', ')', '\\', '<', '>', ']', ',']);

/** Extract every URL token found in a text blob (no fragile regex quoting). */
function extractUrls(text) {
  const out = [];
  let i = 0;
  for (;;) {
    i = text.indexOf('http', i);
    if (i === -1) break;
    let j = i;
    while (j < text.length && !TERMINATORS.has(text[j])) j++;
    out.push(text.slice(i, j));
    i = j + 1;
  }
  return out;
}

/** assets/img/products/photo-1234-w600.jpg  (width preserved for fidelity) */
function localPathFor(url, isBlog) {
  const photo = url.slice(HOST.length + 1).split('?')[0];
  const query = url.split('?')[1] || '';
  const width = (query.match(/(?:^|&)w=(\d+)/) || [, 'orig'])[1];
  const dir = isBlog ? 'assets/img/blog' : 'assets/img/products';
  return `${dir}/${photo}-w${width}.jpg`;
}

/* -------------------------------------------------------------------------- */
/*  1. COLLECT                                                                */
/* -------------------------------------------------------------------------- */

const plan = new Map(); // remote url -> { dest, files: Set<string>, isBlog }

for (const file of SOURCES) {
  if (!exists(file)) continue;
  const text = readFile(file);
  for (const url of new Set(extractUrls(text))) {
    if (!url.startsWith(HOST + '/')) continue;
    const isBlog = BLOG_FILES.has(file);
    if (!plan.has(url)) plan.set(url, { dest: localPathFor(url, isBlog), files: new Set(), isBlog });
    plan.get(url).files.add(file);
  }
}

console.log(`[collect] ${plan.size} unique remote images found in ${SOURCES.length} source files`);

/* -------------------------------------------------------------------------- */
/*  2. DOWNLOAD                                                               */
/* -------------------------------------------------------------------------- */

async function fetchBinary(url, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TrendCargo-Localizer/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 400 * i));
    }
  }
}

async function downloadAll() {
  const entries = [...plan.entries()];
  let done = 0, bytes = 0, skipped = 0;
  const failed = [];
  const CONCURRENCY = 4;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async ([url, info]) => {
      const abs = path.join(ROOT, info.dest);
      if (fs.existsSync(abs) && fs.statSync(abs).size > 1024) { skipped++; done++; return; }
      if (DRY_RUN) { done++; return; }
      try {
        const buf = await fetchBinary(url);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, buf);
        bytes += buf.length;
        done++;
        console.log(`  [${String(done).padStart(2)}/${entries.length}] ${(buf.length / 1024).toFixed(0).padStart(4)} KB  ${info.dest}`);
      } catch (err) {
        failed.push({ url, message: err.message });
      }
    }));
  }
  return { bytes, skipped, failed };
}

/* -------------------------------------------------------------------------- */
/*  3. REWRITE REFERENCES                                                     */
/* -------------------------------------------------------------------------- */

function rewriteReferences() {
  const changed = [];
  for (const file of SOURCES) {
    if (!exists(file)) continue;
    const original = readFile(file);
    let text = original;
    for (const [url, info] of plan) {
      if (text.includes(url)) text = text.split(url).join(info.dest);
    }
    if (text !== original) {
      if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, file), text, 'utf8');
      changed.push(file);
    }
  }
  return changed;
}

/** The site no longer needs to preconnect to a third-party image CDN. */
function stripRemotePreconnects() {
  const touched = [];
  for (const file of ['index.html', 'blog.html', 'invoice.html', 'admin.html', '404.html']) {
    if (!exists(file)) continue;
    const original = readFile(file);
    const text = original.split('\n').filter((line) => !/images\.unsplash\.com/.test(line)).join('\n');
    if (text !== original) {
      if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, file), text, 'utf8');
      touched.push(file);
    }
  }
  return touched;
}

/* -------------------------------------------------------------------------- */
/*  3b. REPAIR BROKEN LOCAL REFERENCES                                        */
/* -------------------------------------------------------------------------- */

const LOCAL_IMG_RE = /assets\/img\/[A-Za-z0-9._@/-]+\.(?:jpg|jpeg|png|webp|avif|svg)/g;

/** Any referenced local image that is missing on disk falls back to the placeholder. */
function repairMissingImages() {
  const fixed = [];
  for (const file of SOURCES) {
    if (!exists(file)) continue;
    const original = readFile(file);
    const referenced = original.match(LOCAL_IMG_RE) || [];
    const missing = [...new Set(referenced.filter((ref) => !fs.existsSync(path.join(ROOT, ref))))];
    if (!missing.length) continue;
    let text = original;
    for (const ref of missing) text = text.split(ref).join(PLACEHOLDER);
    if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, file), text, 'utf8');
    fixed.push(`${file} -> ${missing.join(', ')}`);
  }
  return fixed;
}

/* -------------------------------------------------------------------------- */
/*  4. TIGHTEN CSP (no third-party image host)                                */
/* -------------------------------------------------------------------------- */

function tightenCsp() {
  if (!exists('vercel.json')) return false;
  const original = readFile('vercel.json');
  const text = original.replace(
    /img-src 'self' data: https:\/\/images\.unsplash\.com https:\/\/fonts\.gstatic\.com;/,
    "img-src 'self' data: https://fonts.gstatic.com;"
  );
  if (text === original) return false;
  if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, 'vercel.json'), text, 'utf8');
  return true;
}

/* -------------------------------------------------------------------------- */
/*  5. CREDITS (attribution / traceability)                                   */
/* -------------------------------------------------------------------------- */

const CREDITS_FILE = 'assets/img/CREDITS.md';
const CREDIT_DIRS = ['assets/img/products', 'assets/img/blog'];
const SOURCE_QUERY = 'auto=format&fit=crop&q=80';

/** Reverse the local naming scheme so credits can be rebuilt from disk alone. */
function sourceUrlFor(localPath) {
  const match = path.basename(localPath).match(/^(photo-[0-9a-z-]+)-w(\d+)\.jpg$/i);
  if (!match) return null;
  return `${HOST}/${match[1]}?w=${match[2]}&${SOURCE_QUERY}`;
}

/**
 * Rebuilds assets/img/CREDITS.md from the local images on disk, merging anything
 * already documented. Idempotent: re-running the localizer never loses rows.
 */
function writeCredits(deadSources = []) {
  const rows = new Map();
  const dead = new Set(deadSources);

  if (exists(CREDITS_FILE)) {
    for (const line of readFile(CREDITS_FILE).split('\n')) {
      const row = line.match(/^\| `([^`]+)` \| (\S+) \|$/);
      if (row && row[1] !== PLACEHOLDER) rows.set(row[1], row[2]);
      const deadHit = line.match(/^- (https:\/\/\S+)$/);
      if (deadHit) dead.add(deadHit[1]);
    }
  }

  for (const dir of CREDIT_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of fs.readdirSync(abs)) {
      const rel = `${dir}/${file}`;
      if (rows.has(rel)) continue;
      const source = sourceUrlFor(rel);
      if (source) rows.set(rel, source);
    }
  }

  const sorted = [...rows.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const body = [
    '# Image Credits',
    '',
    'All product and editorial images used by this site are stored locally under `assets/img/`',
    'and served from the project host (Vercel). No third-party image hot-linking is used.',
    '',
    'Source photographs come from [Unsplash](https://unsplash.com) under the',
    '[Unsplash License](https://unsplash.com/license) — free for commercial use.',
    'Attribution is kept below for traceability.',
    '',
    `## Local images (${sorted.length})`,
    '',
    '| Local file | Source |',
    '| --- | --- |',
    ...sorted.map(([file, source]) => `| \`${file}\` | ${source} |`),
    ''
  ];

  if (dead.size) {
    body.push(
      '## Unavailable upstream sources',
      '',
      'These photographs no longer exist at the source, so the local branded',
      `placeholder (\`${PLACEHOLDER}\`) is used instead. Replace them with real`,
      'product photos from the admin panel when available.',
      '',
      ...[...dead].sort().map((url) => `- ${url}`),
      ''
    );
  }

  if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, CREDITS_FILE), body.join('\n'), 'utf8');
  return sorted.length;
}

/* -------------------------------------------------------------------------- */
/*  MAIN                                                                      */
/* -------------------------------------------------------------------------- */

(async () => {
  if (DRY_RUN) {
    console.log('\n[dry-run] planned map:');
    for (const [url, info] of [...plan].sort((a, b) => a[1].dest.localeCompare(b[1].dest))) {
      console.log(`  ${info.dest}\n    <- ${url}\n    used by: ${[...info.files].join(', ')}`);
    }
    console.log(`\n[summary] ${plan.size} images -> assets/img/products + assets/img/blog`);
    return;
  }

  const { bytes, skipped, failed } = await downloadAll();

  // Dead sources (e.g. deleted Unsplash photos) fall back to the local branded placeholder.
  for (const { url } of failed) {
    const info = plan.get(url);
    if (info) info.dest = PLACEHOLDER;
  }

  const rewritten = rewriteReferences();
  const repaired = repairMissingImages();
  const preconnects = stripRemotePreconnects();
  const csp = tightenCsp();
  const credited = writeCredits(failed.map((f) => f.url));

  console.log('\n================ SUMMARY ================');
  console.log(`downloaded      : ${plan.size - skipped - failed.length} files (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`already present : ${skipped}`);
  console.log(`dead sources    : ${failed.length} -> ${PLACEHOLDER}`);
  console.log(`rewritten files : ${rewritten.join(', ') || 'none'}`);
  console.log(`broken refs repaired : ${repaired.length ? repaired.join(' | ') : 'none'}`);
  console.log(`hotlink lines removed : ${preconnects.join(', ') || 'none'}`);
  console.log(`CSP img-src tightened : ${csp ? 'yes' : 'no change'}`);
  console.log(`credits written : ${CREDITS_FILE} (${credited} images documented)`);
  if (failed.length) {
    console.log(`\nWARNING — ${failed.length} source photo(s) no longer exist upstream:`);
    failed.forEach((f) => console.log(`  ! ${f.url}\n      ${f.message} -> using ${PLACEHOLDER}`));
    console.log('  Replace these from the admin panel when real photos are available.');
  }
})();
