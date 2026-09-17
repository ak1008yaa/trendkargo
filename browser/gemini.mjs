#!/usr/bin/env node
/**
 * gemini.mjs — کار با حساب Gemini Pro شما از طریق Chrome شخصی خودتان.
 *
 * Usage:
 *   node gemini.mjs open              ← باز کردن gemini.google.com (بار اول: لاگین کنید)
 *   node gemini.mjs ask "پرامپت..."   ← ارسال پرامپت و ذخیرهٔ پاسخ در gemini-outputs/
 *   node gemini.mjs screenshot out.png
 */
import { withPage, firstVisible } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "gemini-outputs");
const GEMINI_URL = "https://gemini.google.com/app";

fs.mkdirSync(OUT_DIR, { recursive: true });

const [cmd, ...rest] = process.argv.slice(2);

async function openGemini(page) {
  await page.goto(GEMINI_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function findPromptBox(page) {
  return firstVisible(page, [
    "rich-textarea",
    'div[role="textbox"]',
    "textarea",
    ".ql-editor",
  ], 3000);
}

async function askPrompt(page, prompt) {
  const box = await findPromptBox(page);
  if (!box) {
    const shot = path.join(OUT_DIR, "not-logged-in.png");
    await page.screenshot({ path: shot });
    throw new Error(
      "جعبهٔ پرامپت جیمینای پیدا نشد. احتمالاً لاگین نیستی.\n" +
      `پنجرهٔ AutomationChrome را باز کن و یکبار با حساب Gemini Pro لاگین کن. اسکرینشات: ${shot}`
    );
  }
  await box.click();
  await page.keyboard.type(prompt, { delay: 3 });
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
}

/** منتظر میماند تا پاسخ کامل شود (متن ۲.۵ ثانیه ثابت بماند). */
async function readAnswer(page, timeoutMs = 180_000) {
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
  for (const sel of [".model-response-text", "model-response", ".conversation-container"]) {
    try {
      const loc = page.locator(sel).last();
      if (await loc.count()) {
        const t = (await loc.innerText({ timeout: 4000 }).catch(() => "")).trim();
        if (t) return t;
      }
    } catch { /* next selector */ }
  }
  return null;
}

switch (cmd) {
  case "open": {
    await withPage(async (page) => {
      await openGemini(page);
      await page.screenshot({ path: path.join(OUT_DIR, "open.png") });
      const box = await findPromptBox(page);
      console.log(box ? "✅ Gemini باز است و آمادهٔ پرامپت." :
        `⚠️ جعبهٔ پرامپت پیدا نشد — احتمالاً باید لاگین کنی. اسکرینشات: ${OUT_DIR}\\open.png`);
    });
    break;
  }
  case "ask": {
    const prompt = rest.join(" ").trim();
    if (!prompt) { console.error('Usage: node gemini.mjs ask "متن پرامپت"'); process.exit(1); }
    const answer = await withPage(async (page) => {
      await openGemini(page);
      await askPrompt(page, prompt);
      const text = await readAnswer(page);
      await page.screenshot({ path: path.join(OUT_DIR, "last.png") });
      return text;
    });
    if (!answer) { console.error("پاسخی خوانده نشد — اسکرینشات: gemini-outputs/last.png"); process.exit(1); }
    fs.writeFileSync(path.join(OUT_DIR, "last-response.md"), answer, "utf8");
    console.log(answer.slice(0, 3000));
    console.log("\n[saved] gemini-outputs/last-response.md");
    break;
  }
  case "screenshot": {
    const file = rest[0] ?? path.join(OUT_DIR, "screenshot.png");
    await withPage(async (page) => {
      await openGemini(page);
      await page.screenshot({ path: file, fullPage: true });
    });
    console.log("[saved] " + file);
    break;
  }
  default:
    console.log('Usage: node gemini.mjs open | ask "prompt" | screenshot [file]');
}

// اتصال CDP اجازهٔ خروج طبیعی نمیدهد — صریح خارج شو
process.exit(0);
