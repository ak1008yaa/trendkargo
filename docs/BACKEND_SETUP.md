# راه‌اندازی بکند واقعی — Trend Cargo

بکند این پروژه با **Vercel Serverless Functions + Supabase (Postgres)** پیاده‌سازی شده و **هیچ وابستگی npm** ندارد.

## معماری

```
[مرورگر/موبایل کاربر]  →  /api/store  (Vercel Function)  →  Supabase Postgres (جدول site_data)
```

* **خواندن داده‌ها (عمومی):** کاربران سایت موقع باز شدن صفحه، داده‌ها را از `/api/store` می‌گیرند. اگر بکند در دسترس نباشد، سایت به‌صورت خودکار با `localStorage` ادامه می‌دهد (هیچ چیزی نمی‌شکند).
* **ذخیره‌سازی (ادمین):** بعد از لاگین ادمین، هر ذخیره‌سازی در پنل (محصولات، فاکتورها، هیرو، سوشال، اخبار، حراجی‌ها، تخفیف‌ها، قوانین و...) به‌صورت خودکار و debounce شده به بکند push می‌شود.
* کلیدهای داده دقیقاً همان کلیدهای localStorage پروژه‌اند: `products`, `rates`, `hero`, `socials`, `news`, `invoices`, `flashDeals`, `discounts`, `terms`, `sheetUrl`

## مراحل راه‌اندازی (۱۰ دقیقه)

### ۱) ساخت پروژه Supabase
1. به [supabase.com](https://supabase.com) بروید و یک پروژه جدید بسازید.
2. از منوی **SQL Editor** محتوای فایل `supabase/schema.sql` را اجرا کنید (جدول `site_data` ساخته می‌شود).

### ۲) دریافت کلیدها
از **Project Settings → API**:
* `Project URL` → این همان `SUPABASE_URL` است
* `service_role` key (منوی secret) → این همان `SUPABASE_SERVICE_ROLE_KEY` است

> ⚠️ کلید service_role هرگز نباید در فرانت‌اند یا git قرار بگیرد. فقط در Environment Variables ورکل.

### ۳) تنظیم Environment Variables در Vercel
در **Vercel → پروژه → Settings → Environment Variables** سه متغیر بسازید:

| نام | مقدار |
|---|---|
| `SUPABASE_URL` | آدرس پروژه Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | کلید service_role |
| `ADMIN_TOKEN` | رمز ورود پنل ادمین (همان پسوردی که در صفحه لاگین ادمین وارد می‌کنید — فعلاً: `Azz][po';l=-0123`) |

### ۴) دیپلوی
بعد از push، ورکل خودکار تابع `api/store.js` را دیپلوی می‌کند. برای اعمال متغیرهای محیطی یک redeploy انجام دهید.

### ۵) تست
* `https://your-domain.vercel.app/api/store` باید `{"ok":true,"data":{...}}` برگرداند.
* در پنل ادمین لاگین کنید و یک محصول ذخیره کنید؛ سپس در دموی دیگر (یا حالت ناشناس) صفحه را باز کنید — محصول از سرور می‌آید.

## امنیت

* جدول Supabase دارای **RLS فعال بدون پالیسی عمومی** است؛ فقط `service_role` (سرور) دسترسی دارد.
* نوشتن در API نیازمند هدر `x-admin-token` است که با `ADMIN_TOKEN` سمت سرور به‌صورت timing-safe مقایسه می‌شود.
* GET عمومی است (داده فروشگاه باید عمومی باشد)؛ اگر خواستید کلید خاصی خصوصی شود، در فرانت push نکنید.

## فایل‌های مرتبط

* `api/store.js` — تابع Serverless (GET / PUT / DELETE)
* `supabase/schema.sql` — اسکیمای دیتابیس
* `js/script.js` — آبجکت `TrendBackend` (لایه همگام‌سازی)
* `admin.html` — ارسال توکن ادمین به بکند بعد از لاگین
