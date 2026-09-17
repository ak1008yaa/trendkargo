# تیم ۶ نفرهٔ ایجنت — راهنمای ارکستراسیون

این تیم برای همکاری روی پروژههای شما (Trend Cargo، لندینگپیجهای موشن، ابزارهای AI) ساخته شده است.
هر ایجنت یک متخصص است؛ **Cline (رهبر تیم)** کار را بین آنها توزیع میکند و خروجیها را جمعبندی میکند.

## ترکیب تیم

| ایجنت | تخصص | ابزار/اسکیل |
|---|---|---|
| **design-lead** | دیزاین و موشن، لندینگپیج، RTL/فارسی | `design-engineering` + رفرنس motionsites.ai |
| **frontend-engineer** | مهندسی وب، کد تمیز، بهینهسازی توکن | `code-engineering` + `ponytail` |
| **ai-engineer** | AI/LLM، RAG، پرامپت، ارزیابی | `ai-engineering` |
| **security-analyst** | امنیت، OWASP، هاردنینگ، بازبینی | `appsec-engineering` |
| **agent-architect** | ساخت ایجنت، ابزارها، MCP، حافظه | `agent-builder` |
| **automation-ops** | اتوماسیون کروم/جیمینای، تست، نظارت | `browser/` (gemini.mjs, chrome-control.mjs) |
| **spark-operator** | اپراتور Google Spark: بررسی درخواست → تحویل به اسپارک → آوردن خروجی | `browser/` (spark.mjs, gemini-memory.mjs) |
| **aistudio-operator** | اپراتور Google AI Studio: مدل/پارامتر دقیق، سیستمپرامپت، API key | `browser/` (aistudio.mjs) |

## پروتکل همکاری (کار روی یک پروژه)

1. **تعریف مأموریت** — کاربر هدف را میگوید؛ رهبر تیم (Cline) آن را به زیرکارها میشکند.
2. **تخصیص** — هر زیرکار به ایجنت متخصص مربوطه میرود:
   - طرح و ساختار صفحه → design-lead
   - پیادهسازی → frontend-engineer
   - هوشمندسازی/اتوماسیون → ai-engineer یا agent-architect
   - بازبینی امنیتی → security-analyst (قبل از انتشار اجباری)
   - اتوماسیون مرورگر/تست زنده → automation-ops
3. **هندآف** — خروجی هر ایجنت بهصورت فایل در `agents/handoffs/` ذخیره میشود تا ایجنت بعدی آن را بخواند.
4. **درگاه بازبینی** — هیچ خروجی نهایی بدون تأیید security-analyst و design-lead منتشر نمیشود.
5. **جمعبندی** — رهبر تیم نتیجهٔ نهایی را به کاربر ارائه میدهد.

## قواعد

- خروجی هر ایجنت **کوتاه و اقدامپذیر** است (اسکیل ponytail فعال است).
- زبان مشترک تیم فارسی است؛ کد و نامگذاری انگلیسی.
- قبل از هر تغییر بزرگ، design-lead و security-analyst هماهنگ میشوند.
