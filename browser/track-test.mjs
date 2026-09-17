/**
 * track-test.mjs — تست زندهٔ ردیابی بازدید: باز کردن سایت واقعی در کروم
 * بعد از لود، trackDailyVisit در script.js باید به Supabase بزند.
 */
import { withPage } from "./chrome-control.mjs";

await withPage(async (page) => {
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => { if (r.url().includes("supabase")) requests.push(r.url()); });
  await page.goto("http://127.0.0.1:8123/", { waitUntil: "load", timeout: 30000 });
  // صبر اضافه برای بستهشدن tab توسط process.exit — fetch باید قبلش برسد
  await page.waitForTimeout(8000);
  const visitorId = await page.evaluate(() => localStorage.getItem("trendcargo_visitor_id"));
  console.log(JSON.stringify({ loaded: true, visitorId, jsErrors: errors, supabaseHits: requests }));
  process.exit(0);
});

