/**
 * e2e-supabase.mjs — تست کامل: سایت اصلی از Supabase می‌خواند
 */
import { withPage } from "./chrome-control.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await withPage(async (page) => {
  const errors = [];
  const logs = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() !== "debug") logs.push(m.type() + ": " + m.text()); });
  await page.goto("http://127.0.0.1:8123/", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(7000);

  // مستقیماً در صفحه pull کن
  const supabaseResult = await page.evaluate(async () => {
    try {
      const r = await fetch("https://zepoeywugldczcnvnlyn.supabase.co/rest/v1/rpc/get_site_data", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_keys: ["products"] }),
      });
      const t = await r.text();
      return { status: r.status, body: t.slice(0, 400) };
    } catch (e) {
      return { error: String(e) };
    }
  });

  console.log(JSON.stringify({
    supabaseDirect: supabaseResult,
    productsInLocalStorage: await page.evaluate(() => {
      const raw = localStorage.getItem("trendcargo_custom_products");
      return raw ? JSON.parse(raw).length : 0;
    }),
    jsErrors: errors,
    consoleLogs: logs.filter(l => l.includes("supabase") || l.includes("Sync") || l.includes("error")).slice(0, 5),
  }, null, 2));
  process.exit(0);
});

