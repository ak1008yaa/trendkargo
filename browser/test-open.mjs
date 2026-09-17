import { withPage } from "./chrome-control.mjs";
import { mkdirSync } from "node:fs";

const errors = [];

await withPage(async (page) => {
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  let requestCount = 0;
  page.on("response", () => requestCount++);

  await page.goto("http://127.0.0.1:8123/", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(3000); // service worker / PWA

  const title = await page.title();

  mkdirSync("E:\\New folder (2)\\browser\\screenshots", { recursive: true });
  await page.screenshot({ path: "E:\\New folder (2)\\browser\\screenshots\\home.png", fullPage: true });

  console.log(JSON.stringify({ title, errors, requestCount }, null, 2));
});
