#!/usr/bin/env node
/**
 * aistudio.mjs — کار با Google AI Studio (aistudio.google.com)
 * مدلها، سیستمپرامپت، API key و پارامترهای پیشرفته — با همان پروفایل Jolfaa
 *
 * Usage:
 *   node aistudio.mjs open                 ← باز کردن چت جدید
 *   node aistudio.mjs ask "پرامپت..."      ← ارسال پرامپت + ذخیرهٔ پاسخ
 *   node aistudio.mjs screenshot [file]
 *
 * ⚠️ ponytail: سلیکتورهای v1 با fallbackهای متنمحور — بعد از اولین اجرای
 * لاگینشده با اسکرینشات کالیبره شوند (الگوی gemini.mjs).
 */
import { withPage, firstVisible } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "aistudio-outputs");
const NEW_CHAT = "https://aistudio.google.com/prompts/new_chat";
fs.mkdirSync(OUT_DIR, { recursive: true });

const [cmd, ...rest] = process.argv.slice(2);

async function openStudio(page) {
  await page.goto(NEW_CHAT, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
}

async function findInput(page) {
  return firstVisible(page, [
    "textarea",
    'div[contenteditable="true"]',
    '[aria-label*="Type"]',
    '[placeholder*="Type"]',
  ], 5000);
}

async function sendPrompt(page, prompt) {
  // backdrop مودال ممکن است تازه باز شده باشد — اول پاکسازی
  await dismissSetupModals(page);
  const box = await findInput(page);
  if (!box) {
    await page.screenshot({ path: path.join(OUT_DIR, "blocked.png") });
    throw new Error("ورودی AI Studio پیدا نشد — احتمالاً باید لاگین کنی. اسکرینشات: aistudio-outputs/blocked.png");
  }
  await box.click({ timeout: 8000 }).catch(async () => {
    // کلیک توسط backdrop رهگیری شد — دوباره مودال را ببند و دوباره امتحان کن
    await dismissSetupModals(page);
    await box.click({ timeout: 8000 });
  });
  await box.fill(""); // textarea واقعی است؛ تایپ با کیبورد:
  await page.keyboard.type(prompt, { delay: 3 });
  await page.waitForTimeout(300);
  // ارسال: دکمهٔ Run اگر بود، وگرنه Ctrl+Enter
  const run = await firstVisible(page, ['button:has-text("Run")'], 1500);
  if (run) await run.click().catch(() => {});
  else await page.keyboard.press("Control+Enter");
}

/** رد کردن/طی کردن مودالهای راهاندازی — ویزارد Link an API key: انتخاب کلید موجود */
async function dismissSetupModals(page) {
  for (let i = 0; i < 3; i++) {
    // ویزارد API key: کلید از قبل انتخاب شده (Gemini API Key / Default Gemini Project)
    const selectKey = await firstVisible(page, ['button:has-text("Select key")'], 1500);
    if (selectKey) {
      // ذخیرهٔ کلید برای جلسات بعدی همین دستگاه — تا ویزارد تکرار نشود
      const saveToggle = await firstVisible(page, ['button[role="switch"]', 'mat-slide-toggle button'], 1200);
      if (saveToggle) await saveToggle.click().catch(() => {});
      await selectKey.click().catch(() => {});
      await page.waitForTimeout(2500);
      continue;
    }
    const skip = await firstVisible(page, ['button:has-text("Skip")', 'button:has-text("Dismiss")'], 1200);
    if (!skip) return;
    await skip.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
}

/** انتظار تا پاسخ ثابت شود (متن ۲.۵ ثانیه بدون تغییر) */
async function readAnswer(page, timeoutMs = 180_000) {
  // اگر مودال API-key وسط راه باز شد، آن را ببند تا پاسخ دیده شود
  await dismissSetupModals(page);
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    const txt = await readLatest(page);
    if (txt && txt === last) {
      await page.waitForTimeout(2500);
      const again = await readLatest(page);
      if (again === txt) return txt;
    }
    last = txt || last;
    await page.waitForTimeout(2000);
  }
  return last;
}

async function readLatest(page) {
  // AI Studio: ms-chat-turn / ms-markdown-block — fallback: بزرگترین بلوک متنی جدید
  for (const sel of ["ms-chat-turn", "ms-markdown-block", ".model-response-text", "model-response"]) {
    try {
      const loc = page.locator(sel).last();
      if (await loc.count()) {
        const t = (await loc.innerText({ timeout: 4000 }).catch(() => "")).trim();
        if (t) return t;
      }
    } catch { /* next */ }
  }
  return null;
}

switch (cmd) {
  case "open": {
    await withPage(async (page) => {
      await openStudio(page);
      const box = await findInput(page);
      await page.screenshot({ path: path.join(OUT_DIR, "open.png") });
      console.log(box ? "✅ AI Studio باز است و آمادهٔ پرامپت."
        : `⚠️ ورودی پیدا نشد — احتمالاً لاگین لازم است. اسکرینشات: ${OUT_DIR}\\open.png`);
      process.exit(0);
    });
    break;
  }
  case "ask": {
    const prompt = rest.join(" ").trim();
    if (!prompt) { console.error('Usage: node aistudio.mjs ask "پرامپت"'); process.exit(1); }
    const answer = await withPage(async (page) => {
      await openStudio(page);
      await dismissSetupModals(page);   // مودالهای راهاندازی اول session
      await sendPrompt(page, prompt);
      await dismissSetupModals(page);   // مودال Link an API key بعد از Run
      const text = await readAnswer(page);
      await page.screenshot({ path: path.join(OUT_DIR, "last.png") });
      return text;
    });
    if (!answer) { console.error("پاسخی خوانده نشد — اسکرینشات: aistudio-outputs/last.png"); process.exit(1); }
    const dest = path.join(OUT_DIR, `answer-${Date.now()}.md`);
    fs.writeFileSync(dest, answer, "utf8");
    console.log(answer.slice(0, 3000));
    console.log(`\n[saved] ${dest}`);
    process.exit(0);
    break;
  }
  case "screenshot": {
    const file = rest[0] ?? path.join(OUT_DIR, "screenshot.png");
    await withPage(async (page) => {
      await openStudio(page);
      await page.screenshot({ path: file, fullPage: true });
    });
    console.log("[saved] " + file);
    process.exit(0);
    break;
  }
  case "debugdom": {
    // کالیبراسیون: dump بدنه برای اصلاح سلیکتورهای readLatest
    await withPage(async (page) => {
      await openStudio(page);
      await dismissSetupModals(page);
      const html = await page.evaluate(() => document.body.innerHTML.slice(0, 300_000));
      const dest = path.join(OUT_DIR, "dom.html");
      fs.writeFileSync(dest, html, "utf8");
      console.log(`[saved] ${dest} — با جستجوی ms- و chat و turn سلیکتور واقعی را پیدا کن`);
    });
    process.exit(0);
    break;
  }
  default:
    console.log('Usage: node aistudio.mjs open | ask "prompt" | screenshot [file]');
    process.exit(0);
}
