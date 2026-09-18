# 🧠 حافظهٔ دائمی (MEMORY) — آخرین بهروزرسانی: ۲۰۲۶-۰۹-۱۷

> این فایل حافظهٔ رسمی ایجنت است. هر سشن جدید باید ابتدا این فایل را بخواند.
> آرشیو خام مکالمات: `C:\Users\home\.cline\data\sessions\`

## 👤 کاربر و ترجیحات
- زبان: **فارسی** (پاسخها فارسی، کد و نامگذاری انگلیسی)
- **خلاقیت برایش اولویت است** — انتظار ایدههای نو، نه فقط اجرای دستور
- علاقه‌مند به: تیم ایجنتها که با هم روی پروژه کار کنند، کنترل مرورگر کروم توسط ایجنت، کار با حساب Gemini Pro بهجای خودش
- حسابهای گوگل: پروفایل اصلی کروم = hoshinkhan1008@gmail.com (Default)؛ **پروفایل JOLFAA9 = jolfaa9@gmail.com (Profile 3)** ← این برای اتوماسیون/جیمینای استفاده میشود؛ gamble profile نیازی نیست

## 🎯 رفرنس دیزاین رسمی
- **motionsites.ai** = استاندارد دیزاین همهٔ کارهای UI/لندینگ. ساختار: Hero درشت تبلیغاتی → گالری کارت با تگ → Animated Backgrounds → Pricing → CTA پایانی. حالت تیره، موشن، hover پیشرفته.
- مستند کامل: `docs/design-reference-motionsites-ai.md` (در اسکیل design-engineering هم ثبت شده)

## 🛠 نصبشده‌ها (مسیرهای دقیق)
- **پونیتیل** (بهینهسازی توکن/کد، ریپو ۱۴۰k⭐): rules در `E:\New folder (2)\.clinerules\ponytail.md` + سراسری `C:\Users\home\.clinerules\ponytail.md` + ۶ اسکیل کامند (ponytail, -audit, -review, -debt, -gain, -help) در `C:\Users\home\.agents\skills\` — کلون مرجع: `C:\Users\home\ponytail`
- **۵ اسکیل حرفهای ساختهشده** در `C:\Users\home\.agents\skills\`: code-engineering, design-engineering, appsec-engineering, ai-engineering, agent-builder (همه PASS اعتبارسنجی، کلمات کلیدی فارسی در description دارند)
- پکیجهای قابلانتقال `.skill` در `E:\New folder (2)\skills\` + راهنمای فارسی
- اعتبارسنجی اسکیلها: `node tools/validate-skills.cjs <dir>`
- تحقیق گیتهاب (با دادهٔ API): `docs/github-research.md` — ریپوهای کلیدی: langchain ۱۴۶k، ponytail ۱۴۰k، three.js ۱۱۵k، gemini-cli ۱۰۷k، playwright ۹۶k، browser-use، LottieFiles/motion-design-skill، chrome-devtools-mcp

## 🤖 تیم ایجنتها (فعال در سشن؛ تعریفها در `agents/`)
| ایجنت | نقش |
|---|---|
| design-lead | دیزاین/موشن با رفرنس motionsites، RTL فارسی |
| frontend-engineer | پیادهسازی با سبک ponytail (کمترین کد) |
| ai-engineer | LLM/RAG/پرامپت/Evals |
| security-analyst | OWASP، درگاه بازبینی نهایی (هیچ خروجی نهایی بدون تأیید او) |
| agent-architect | معماری ایجنت، ابزار، MCP |
| automation-ops | کنترل کروم/جیمینای، تست زنده |
| spark-operator | اپراتور Google Spark: بررسی درخواست → تحویل به اسپارک → آوردن خروجی اینجا |
| aistudio-operator | اپراتور Google AI Studio: مدل/سیستمپرامپت/پارامتر دقیق، مدیریت API key |

پروتکل همکاری: `agents/ORCHESTRATION.md` — هندآف فایلها در `agents/handoffs/`

## 🌐 اتوماسیون مرورگر (browser/)
- فناوری: playwright-core + CDP روی کروم نصبی (بدون دانلود مرورگر)
- پروفایل اتوماسیون: `%LOCALAPPDATA%\AutomationChrome` = **کپی Profile 3 (Jolfaa)**؛ کروم اصلی دست نمیخورد
- `chrome-control.mjs` (ensureChrome/withPage/firstVisible)، `server.mjs` (سرور استاتیک پروژه، پورت 8123)، `test-open.mjs` (تست زنده)
- **درس مهم:** کوکیهای کروم مدرن app-bound هستند — کپی سشن انتقال نمیشود؛ لاگین دستی یکبار در پنجرهٔ اتوماسیون لازم است. اسکریپتها در انتها `process.exit(0)` لازم دارند (اتصال CDP اجازهٔ خروج نمیدهد)
- سقف زمانی run_commands ≈۳۰ ثانیه — کارهای طولانی را با Start-Process پسزمینه + فایل خروجی اجرا کن
- ⚠️ web_search تمام اعتبارش؛ بهجایش از GitHub API با fetch_web_content استفاده کن

## 📊 یافتههای تست واقعی (۲۰۲۶-۰۹-۱۷)
- **امنیت (High):** `script-src 'unsafe-inline'` در CSP فایل vercel.json — اولویت اول اصلاح (nonces/فایل خارجی + object-src 'none')
- **دیزاین Hero (۴ تغییر):** clamp تایپوگرافی H1؛ ورود staggered با prefers-reduced-motion؛ فعالسازی انیمیشن aurora (موجود ولی خاموش!)؛ micro-interaction روی CTA. توکنهای پیشنهادی: `--grad-brand: linear-gradient(90deg,#38bdf8,#a78bfa,#fb923c)`، `--motion-stagger: 120ms`
- **کد (۳ حذف/جایگزینی در script.js ۱۶۷۵ خطی):** `Intl.NumberFormat('fa-IR')` جای تبدیل دستی ارقام فارسی؛ `<details>` یا انیمیشن `grid-template-rows` جای هک آکاردئون؛ `navigator.clipboard` جای `execCommand` منسوخ. ⚠️ مرز ضد-XSS (escapeHTML+innerHTML) دست نخورد
- **تست زنده:** سایت سالم (۱۷ درخواست، صفر خطای JS) — اسکرینشات: `browser/screenshots/home.png`

## ✅ شمارش بازدید روزانه (Supabase) — نصب‌شده ۲۰۲۶-۰۹-۱۷
- **بکاند**: Supabase پروژه `zepoeywugldczcnvnlyn` — جداول `daily_visits` (روز/بازدید یکتا/بازدید صفحه) و `visit_visitors` (dedup per visitor/day)، توابع RPC `track_visit(text, date)` + `track_visit()` + `visit_stats(p_days)`. منطقهٔ زمانی `Asia/Tehran`.
- **فرانت**: `js/script.js → trackDailyVisit()` در DOMContentLoaded صدا زده میشود (XHR → sendBeacon → fetch fallback). visitor_id در localStorage ذخیره میشود.
- **ادمین**: `admin.html` سکشن «آمار بازدید» با ۴ متریک (امروز/دیروز/۷روز/۳۰روز) + نمودار ۱۴ روز اخیر + دکمهٔ بهروزرسانی. `loadVisitStats()` در `initAdminUi` صدا زده میشود.
- **CSP**: `connect-src` به `https://zepoeywugldczcnvnlyn.supabase.co` مجاز شد.
- **سرویسورکر**: v5.4.0 (بیپ شد).
- **اعتبارسنجی end-to-end**: سایت در کروم AutomationChrome باز شد → UUID یکتا ساخته شد → DB آپدیت شد (+1 یکتا، +2 page_views). ✓

## ✅ کارهای انجام‌شده در بررسی پنل ادمین و پایدارسازی داده‌ها (۲۰۲۶-۰۹-۱۸)
- **مرکز تمرکز**: بررسی کامل پروژه و سپس تمرکز روی پنل ادمین، با حذف بحث‌های امنیتی و تمرکز روی خرابی‌های واقعی و عملکردی.
- **نکتهٔ اصلی**: پنل ادمین چند منبع داده را با هم مخلوط می‌کرد: `localStorage`، داده‌های محلی پیش‌فرض، بک‌اند محلی، و Supabase. این امر باعث می‌شد بعضی بخش‌ها بدون پیام روشن، نامشخص یا خالی دیده شوند.
- **رفع ریشه‌ای**:
  - در `admin.html`، اعتبار Supabase فقط در صورت وجود کلید واقعی و غیر-placeholder بررسی می‌شود؛ در صورت نبود، sync و fetchهایی که به Supabase می‌رفتند متوقف می‌شوند.
  - در `admin.html`، دانه‌بندی داده‌های محلی ادمین (seed) اضافه شد تا در نبود storage، پنل به حالت خالی/خراب نیفتد.
  - در `js/blog-admin.js`، بخش بلاگ با normalize امن برای `body` نامعتبر/ناشناخته مقاوم شد؛ رندر و ذخیره‌سازی بلاگ دیگر با `join()` روی دادهٔ نامعتبر نمی‌سوزد.
  - در `js/script.js`، ردیابی بازدید با guard برای کلیدهای نامعتبر و `Authorization` معتبر محافظت شد تا درخواست‌های نامعتبر اجرا نشوند.
- **پیام‌سازی UX**: در بخش آمار بازدید، اگر Supabase فعال نباشد، به‌جای کرش صفحه، پیام «آمار بازدید در دسترس نیست» نمایش داده می‌شود.
- **اعتبارسنجی**: اجرای smoke test پنل ادمین در مرورگر انجام شد و هیچ خطای JS در بارگذاری پنل گزارش نشد.
- **جمع‌بندی فنی**: پروژه در محدودهٔ خرابی‌های واقعی به‌صورت پایدارتری عمل می‌کند، اما برای نسخهٔ نهایی و بلندمدت، انتخاب یک `source of truth` واحد برای داده‌ها توصیه می‌شود.

## ⏳ کارهای باز (backlog)
1. **لاگین دستی کاربر** در پنجرهٔ اتوماسیون (gemini.google.com با jolfaa9) ← بعدش `node check-gemini.mjs`
2. اصلاح CSP `unsafe-inline` (security-analyst آماده)
3. پیادهسازی ۴+۳ بهبود یافتشده (design-lead + frontend-engineer آماده)
4. کالیبراسیون سلیکتورهای `spark.mjs` بعد از اولین اجرای لاگینشده
5. تکمیل ۷ اسکیل ناقص قدیمی در `.agents/skills` (incident-responder و… SKILL.md ندارند)
6. رفرنسهای دیزاین بعدی که کاربر میفرستد → اضافه به رفرنسها

## 🚀 Spark و AI Studio (ساخت اپ/مدل با AI — حساب Pro کاربر)
- **Spark** داخل gemini.google.com است (صفحهٔ مستقل عمومی ندارد) — ابزار: `browser/spark.mjs` (create/open/screenshot)
- **AI Studio** در aistudio.google.com است — ابزار: `browser/aistudio.mjs` (open/ask/screenshot)؛ ورودی معمولاً textarea + دکمهٔ Run یا Ctrl+Enter
- **لاگین گوگل در پروفایل اتوماسیون هر دو را پوشش میدهد** (جیمینای + AI Studio + مموری)
- استخراج مموری جیمینای: `browser/gemini-memory.mjs` → `docs/gemini-memory-extract.md` (نیازمند لاگین)
- سلیکتورهای هر دو v1 و حدسیاند — بعد از اولین اجرای لاگینشده با اسکرینشات کالیبره شوند
