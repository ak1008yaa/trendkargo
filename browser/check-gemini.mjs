/**
 * check-gemini.mjs — بررسی وضعیت لاگین جیمینای در پروفایل اتوماسیون (Jolfaa)
 */
import { withPage, firstVisible } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "gemini-outputs");
fs.mkdirSync(OUT_DIR, { recursive: true });

await withPage(async (page) => {
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(6000); // صبر برای ریدایرکت لاگین و رندر
  const box = await firstVisible(page, ["rich-textarea", 'div[role="textbox"]', "textarea", ".ql-editor"], 5000);
  const signInLink = await page.locator('a[href*="accounts.google.com"]').count();
  const accountEmail = await page.locator('[data-ogsr-up], img[alt*="@"]').first().getAttribute("alt").catch(() => null);
  await page.screenshot({ path: path.join(OUT_DIR, "login-check.png") });
  console.log(JSON.stringify({
    promptBox: !!box,
    signInLinkVisible: signInLink > 0,
    accountHint: accountEmail,
  }, null, 2));
  console.log("screenshot: gemini-outputs/login-check.png");
  process.exit(0); // اتصال CDP اجازهٔ خروج نمیدهد — صریح خارج شو
});
