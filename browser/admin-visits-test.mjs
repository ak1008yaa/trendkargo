/**
 * admin-visits-test.mjs — باز کردن ادمین پنل (لاگین تست)، رفتن به سکشن بازدید، اسکرینشات
 */
import { withPage } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
fs.mkdirSync(OUT, { recursive: true });

await withPage(async (page) => {
  await page.goto("http://127.0.0.1:8123/admin.html", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2500);

  // login bypass — فرم لاگین را ببند، پنل app را نمایش بده
  await page.evaluate(() => {
    sessionStorage.setItem("tc_auth", "true");
    const hide = document.getElementById("admin-login");
    const show = document.getElementById("admin-app");
    if (hide) hide.classList.add("hidden");
    if (show) show.classList.remove("hidden");
    if (typeof initAdminUi === "function") initAdminUi();
    if (typeof loadVisitStats === "function") loadVisitStats();
    // force-activate سکشن visits
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById("section-visits");
    if (target) target.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === "visits"));
  });
  // صبر اضافه برای fetch و رندر نمودار
  await page.waitForTimeout(8000);
  // در صورت نیاز یک بار دیگر loadVisitStats
  await page.evaluate(() => { if (typeof loadVisitStats === "function") loadVisitStats(); });
  await page.waitForTimeout(5000);

  // کلیک روی سکشن visits در منوی کناری
  const visitsBtn = page.locator('button[data-section="visits"]').first();
  await visitsBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(OUT, "admin-visits.png"), fullPage: true });

  // خواندن با textContent خام (با convert فارسی اختیاری)
  const readNum = async (sel) => {
    const v = await page.locator(sel).first().textContent().catch(() => "?");
    return v?.trim() ?? "?";
  };
  const today = await readNum("#visits-today");
  const week = await readNum("#visits-week");
  const month = await readNum("#visits-month");
  const total = await readNum("#visits-total");
  const chart = await page.locator("#visits-chart .v-col").count();

  console.log(JSON.stringify({ today, week, month, total, barsRendered: chart }, null, 2));
  process.exit(0);
});

