#!/usr/bin/env node
/**
 * spark.mjs — اپراتور Google Spark (ساخت اپ/بازی تعاملی با AI داخل Gemini)
 *
 * Usage:
 *   node spark.mjs open                 ← باز کردن جیمینای + جستجوی ابزار Spark
 *   node spark.mjs create "درخواست..."  ← انتخاب Spark، ارسال درخواست، انتظار خروجی
 *   node spark.mjs screenshot [file]
 *
 * ⚠️ ponytail: سلیکتورهای v1 حدسی هستند (Spark DOM عمومی ندارد) — بعد از اولین
 * اجرای لاگینشده با اسکرینشات کالیبره شوند. الگو: مثل gemini.mjs.
 */
import { withPage, firstVisible } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "spark-outputs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const [cmd, ...rest] = process.argv.slice(2);

async function openGemini(page) {
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
}

/** پیدا و کلیک روی ابزار Spark در منوی ابزارهای جیمینای (متنمحور، مستقل از DOM) */
async function activateSpark(page) {
  // گزینههای متنی ممکن برای دکمهٔ ابزارها و خود Spark
  for (const trigger of ['button[aria-label*="+"]', 'button:has-text("Tools")', 'button[aria-label*="Tools"]']) {
    const btn = await firstVisible(page, [trigger], 2500);
    if (btn) { await btn.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(1500);
  const item = await firstVisible(page, [
    '[role="menuitem"]:has-text("Spark")',
    'li:has-text("Spark")',
    'button:has-text("Spark")',
  ], 3000);
  if (!item) return false;
  await item.click().catch(() => {});
  await page.waitForTimeout(1500);
  return true;
}

async function typePrompt(page, prompt) {
  const box = await firstVisible(page, ["rich-textarea", 'div[role="textbox"]', "textarea", ".ql-editor"], 5000);
  if (!box) throw new Error("جعبهٔ پرامپت پیدا نشد (لاگین؟ DOM عوض شده؟)");
  await box.click();
  await page.keyboard.type(prompt, { delay: 3 });
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
}

/** انتظار برای آرتیفکت اسپارک و استخراج کد از نمای Code/Preview */
async function waitForArtifact(page, timeoutMs = 240_000) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    // ۱) اگر دکمهٔ نمای کد هست، آن را باز کن
    const codeTab = await firstVisible(page, [
      'button:has-text("Code")', 'tab:has-text("Code")',
      '[role="tab"]:has-text("Code")', 'button:has-text("</>")',
    ], 800);
    if (codeTab) await codeTab.click().catch(() => {});
    // ۲) متن کد را بخوان (کدبلوک بزرگ‌تر از ۵۰۰ کاراکتر = آرتیفکت)
    const blocks = page.locator("pre code, pre");
    const n = await blocks.count();
    for (let i = n - 1; i >= 0; i--) {
      const t = (await blocks.nth(i).innerText({ timeout: 3000 }).catch(() => "")).trim();
      if (t.length > 500 && t === last) return t;
      if (t.length > 500) { last = t; break; }
    }
    await page.waitForTimeout(2500);
  }
  return last;
}

switch (cmd) {
  case "open": {
    await withPage(async (page) => {
      await openGemini(page);
      const found = await activateSpark(page);
      await page.screenshot({ path: path.join(OUT_DIR, "open.png") });
      console.log(found
        ? "✅ ابزار Spark فعال شد."
        : `⚠️ Spark در منو پیدا نشد — اسکرینشات را ببین و سلیکتورها را کالیبره کن: ${OUT_DIR}\\open.png`);
      process.exit(0);
    });
    break;
  }
  case "create": {
    const request = rest.join(" ").trim();
    if (!request) { console.error('Usage: node spark.mjs create "درخواست"'); process.exit(1); }
    const code = await withPage(async (page) => {
      await openGemini(page);
      const found = await activateSpark(page);
      if (!found) console.error("⚠️ Spark در منو نبود — پرامپت مستقیم ارسال میشود (ممکن است خود Gemini مسیر Spark را انتخاب کند)");
      await typePrompt(page, request);
      const out = await waitForArtifact(page);
      await page.screenshot({ path: path.join(OUT_DIR, "artifact.png") });
      return out;
    });
    if (code) {
      const dest = path.join(OUT_DIR, `spark-${Date.now()}.html`);
      fs.writeFileSync(dest, code, "utf8");
      console.log(`[saved] ${dest} (${code.length} chars)\n--- preview ---\n${code.slice(0, 1200)}`);
    } else {
      console.error("کدی استخراج نشد — اسکرینشات: spark-outputs/artifact.png (سلیکتورها را کالیبره کن)");
      process.exit(1);
    }
    process.exit(0);
    break;
  }
  case "screenshot": {
    const file = rest[0] ?? path.join(OUT_DIR, "screenshot.png");
    await withPage(async (page) => {
      await openGemini(page);
      await page.screenshot({ path: file, fullPage: true });
    });
    console.log("[saved] " + file);
    process.exit(0);
    break;
  }
  default:
    console.log('Usage: node spark.mjs open | create "request" | screenshot [file]');
    process.exit(0);
}
