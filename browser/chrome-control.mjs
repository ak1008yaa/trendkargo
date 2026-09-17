/**
 * chrome-control.mjs
 * کنترل Chrome شخصی کاربر از طریق CDP (Chrome DevTools Protocol).
 * بدون نیاز به دانلود مرورگر — از Chrome نصبشده روی سیستم استفاده میکند.
 */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

export const CDP_HOST = "http://127.0.0.1:9222";

// مسیر Chrome ویندوز — اگر نبود مسیرهای جایگزین را امتحان کن
const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
];

// پروفایل مجزا برای اتوماسیون: کپی پروفایل Jolfaa (jolfaa9@gmail.com) با لاگینهای حفظشده
export const AUTOMATION_PROFILE = path.join(os.homedir(), "AppData", "Local", "AutomationChrome");
export const PROFILE_DIRECTORY = "Profile 3"; // = پروفایل JOLFAA9 (Jolfaa)

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try { if (require("node:fs").existsSync(p)) return p; } catch {}
  }
  return CHROME_CANDIDATES[0];
}

export async function chromeRunning() {
  try {
    const r = await fetch(CDP_HOST + "/json/version", { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

/** Chrome را (در صورت عدم اجرا با پورت دیباگ) بالا میآورد و متصل میشود. */
export async function ensureChrome() {
  if (await chromeRunning()) return chromium.connectOverCDP(CDP_HOST);

  const { existsSync } = await import("node:fs");
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p)) ?? CHROME_CANDIDATES[0];
  const child = spawn(chrome, [
    "--remote-debugging-port=9222",
    `--user-data-dir=${AUTOMATION_PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,900",
    "--lang=fa-IR",
    "about:blank",
  ], { detached: true, stdio: "ignore" });
  child.unref();

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await chromeRunning()) return chromium.connectOverCDP(CDP_HOST);
  }
  throw new Error("Chrome با پورت دیباگ 9222 بالا نیامد.");
}

/** یک تب جدید باز میکند، تابع را اجرا میکند، تب را میبندد. */
export async function withPage(fn) {
  const browser = await ensureChrome();
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  try { return await fn(page); } finally { await page.close(); }
}

/** اولین سلیکتورِ قابل مشاهده را برمیگرداند. */
export async function firstVisible(page, selectors, timeoutEach = 3000) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: "visible", timeout: timeoutEach });
      return loc;
    } catch { /* try next */ }
  }
  return null;
}
