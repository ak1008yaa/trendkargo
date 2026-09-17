/**
 * gemini-memory.mjs — استخراج مموری (Saved info) حساب Gemini از طریق مرورگر
 * نیازمند لاگین در پروفایل اتوماسیون (Jolfaa)
 */
import { withPage, firstVisible } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "gemini-outputs");
const DEST = path.join(__dirname, "..", "docs", "gemini-memory-extract.md");
fs.mkdirSync(OUT_DIR, { recursive: true });

// صفحات احتمالی مموری جیمینای — اولین که کار کرد ملاک است
const CANDIDATE_URLS = [
  "https://gemini.google.com/settings/saved-info",
  "https://gemini.google.com/settings/memory",
  "https://myactivity.google.com/product/gemini?hl=en",
];

await withPage(async (page) => {
  for (const url of CANDIDATE_URLS) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(4000);
      const body = (await page.locator("body").innerText({ timeout: 8000 }).catch(() => "")).trim();
      if (body.length > 200) {
        const header = `# مموری جیمینای (استخراجشده ${new Date().toISOString()})\n> منبع: ${url}\n\n---\n\n`;
        fs.writeFileSync(DEST, header + body.slice(0, 20000), "utf8");
        await page.screenshot({ path: path.join(OUT_DIR, "memory-page.png"), fullPage: false });
        console.log(`[saved] ${DEST}\n[source] ${url}\nchars: ${body.length}`);
        process.exit(0);
      }
    } catch { /* try next URL */ }
  }
  await page.screenshot({ path: path.join(OUT_DIR, "memory-fail.png") });
  console.error("صفحهٔ مموری پیدا نشد — احتمالاً لاگین نیستی یا URLها عوض شده. اسکرینشات: gemini-outputs/memory-fail.png");
  process.exit(1);
});
