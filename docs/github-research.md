# GitHub Research — ریپوهای معتبر و ترند برای حوزهٔ کاری

> تاریخ جمعآوری: ۲۰۲۶-۰۹-۱۷ (آمار استارها واقعی و مستقیم از GitHub API)
> حوزهٔ کاری شما: دیزاین و موشن، ساخت ایجنت و اتوماسیون مرورگر، AI/LLM، امنیت، بهینهسازی توکن، وباستاتیک و فارسی/RTL.

## نکات کلیدی یادگرفتهشده از ترندها

1. **حرکت به سمت «Agent Harness»** — سیستمهای یکپارچه که skills + حافظه + امنیت + research را برای موجهای کدنویسی (Cline, Codex, OpenCode, Cursor) مدیریت میکنند (مثل `ECC` و `ponytail`).
2. **Agentهای مرورگر داغترین حوزهاند** — `browser-use` و `Skyvern` نشان میدهند اتوماسیون مرورگر بهجای اسکریپتهای شکننده، به «ایجنتی که از مرورگر استفاده میکند» تبدیل شده است.
3. **MCP استانداردِ اتصال شد** — ابزارهای جدید (n8n, Chrome DevTools MCP) همه از MCP پشتیبانی میکنند.
4. **بهینهسازی توکن یک صنعت شده** — ریپوهایی مثل ponytail (۱۴۰k+ استار) یعنی کمینهسازی کد و هزینهٔ LLM اولویت اول توسعهدهندگان است.
5. **موشن دیزاین بهصورت «اسکیل برای AI» منتشر میشود** — LottieFiles موشن را بهصورت SKILL برای ایجنتها منتشر کرده: timing، easing، choreography.

---

## ۱) ایجنتها و Agent Skills

| ریپو | استار | زبان | چرا مهم است |
|---|---|---|---|
| [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | 146k | Python | پلتفرم مهندسی ایجنت؛ الگوی مرجع برای معماریهای multi-agent و RAG |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 140k | JS | ruleset «تنبلترین ارشد»؛ ۵۴٪ کد کمتر، ۲۲٪ توکن کمتر — نصب شد ✅ |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | — (جدید/ترند) | — | «سیستم بهینهسازی عملکرد harness ایجنت»: skills, instincts, memory, security — الگوی خوب برای ارتقای محیط |
| [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | 107k | TS | ایجنت Gemini در ترمینال؛ سازگار با حساب Gemini شما (API + اتصال MCP) |

## ۲) اتوماسیون مرورگر

| ریپو | استار | زبان | چرا مهم است |
|---|---|---|---|
| [microsoft/playwright](https://github.com/microsoft/playwright) | 96k | TS | استاندارد طلایی تست/اتوماسیون کروم؛ انتخاب اول برای کنترل کروم شما |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | ترند #۱ | Python | ایجنتهایی که «از مرورگر استفاده میکنند»؛ الگوی اتصال AI به کروم |
| [Skyvern-AI/skyvern](https://github.com/Skyvern-AI/skyvern) | ترند | Python | اتوماسیون ورکفلوهای مرورگر با AI (فارغ از DOM) |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | ترند | TS | Chrome DevTools بهصورت MCP برای ایجنتهای کدنویسی — قابلاتصال به Cline |

## ۳) موشن دیزاین و وب ۳بعدی

| ریپو | استار | زبان | چرا مهم است |
|---|---|---|---|
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 115k | JS | مرجع همهٔ افکتهای WebGL/3D (شبیه پشتصفحههای motionsites.ai) |
| [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) | 26k | TS | موتور 3D بلادرنگ؛ جایگزین حرفهای three.js |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | ترند | MD | اصول موشن (timing, easing, Disney principles) بهصورت اسکیل برای ایجنتها — منبع یادگیری برای اسکیل دیزاین |
| [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite) | ترند | Rust | موشنگرافیک و گرافیک دوستاول node-based |

## ۴) MCP و اتوماسیون ورکفلوها

| ریپو | استار | زبان | چرا مهم است |
|---|---|---|---|
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | ترند #۱ MCP | TS | اتوماسیون ورکفلو با قابلیت AI + ۴۰۰+ یکپارچگی؛ گزینهٔ داشبورد اتوماسیون |

---

## درسهایی که باید در کارهای بعدی اعمال شوند

- **برای دیزاین**: الهام از ساختار motionsites.ai (قسمتهای Hero/Sections/Pricing/Footer) + اصول LottieFiles motion-design-skill + three.js برای بکگراند.
- **برای ایجنتها**: معماریهای agent harness (skills + memory + security) و اتصال browser/MCP بهعنوان ابزار.
- **برای Gemini Pro**: دو مسیر — مسیر مرورگر (اتوماسیون gemini.google.com با Playwright) و مسیر API/CLI (gemini-cli)؛ هر دو راهاندازی شده/شدنی.
- **برای امنیت**: هاردنینگ هدرها (CSP) حالا رفرنس واقعی از ChromeDevTools MCP هم دارد.
