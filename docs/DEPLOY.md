# راهنمای استقرار آنلاین — ترندز کارگو (Node + SSE)

این راهنما برای این است که تغییرهای ادمین **روی نسخهٔ آنلاین سایت** هم لحظه‌ای اعمال شود.
ایده: کل سایت + ادمین + API روی **یک سرویس Node** اجرا می‌شود (`backend/server.js` خودش فایل‌های استاتیک را سرو می‌کند).

## گزینهٔ پیشنهادی: Render (رایگان)

1. در [render.com](https://render.com) حساب بسازید و New → **Web Service** را بزنید.
2. مخزن `trendkargo` را وصل کنید و این مقادیر را بدهید:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (یا `node server.js`)
   - **Environment:** `Node`
3. در بخش **Environment Variables** این‌ها را اضافه کنید:
   - `NODE_ENV=production`
   - `ADMIN_USER=admin` (یا نام دلخواه)
   - `ADMIN_PASSWORD_SHA256=` هش SHA-256 رمزتان (روش ساخت در `backend/.env.example`)
4. Deploy کنید. آدرسی مثل `https://trendkargo.onrender.com` می‌گیرید.
5. حالا از همان آدرس باز کنید:
   - سایت: `https://trendkargo.onrender.com/`
   - ادمین: `https://trendkargo.onrender.com/admin.html`
6. وارد ادمین شوید، چیزی ذخیره کنید → همهٔ بازدیدکنندگان **بدون رفرش** تغییر را می‌بینند.

> نکته پلن رایگان Render: بعد از ~۱۵ دقیقه بی‌کاری، سرویس خواب می‌رود و اولین بازدید ~۳۰–۶۰ ثانیه طول می‌کشد تا بیدار شود. برای فروشگاه واقعی پلن پولی یا VPS بهتر است.

## گزینهٔ جایگزین: Railway / VPS

- **Railway:** مثل Render؛ Root روی `backend`، متغیرها را در Variables بگذارید.
- **VPS (مثلاً Ubuntu):**
  ```bash
  cd backend && npm install
  ADMIN_USER=admin ADMIN_PASSWORD_SHA256=<hash> NODE_ENV=production PORT=3000 node server.js
  ```
  برای ماندگاری، از `pm2` یا `systemd` استفاده کنید و جلوی آن Nginx با HTTPS بگذارید.

## ساخت هش رمز (PowerShell ویندوز)

```powershell
[BitConverter]::ToString(
  [Security.Cryptography.SHA256]::Create().ComputeHash(
    [Text.Encoding]::UTF8.GetBytes("رمز-جدید-شما")
  )
).Replace("-","").ToLower()
```

خروجی را در `ADMIN_PASSWORD_SHA256` بگذارید. رمز خام را هیچ‌وقت کامیت نکنید.

## ماندگاری داده (Render Disk)

روی پلن رایگان/معمولی، فایل‌های `backend/data/*.json` با هر redeploy ریست می‌شوند. راه‌حل:

1. در Render: سرویس → **Disks** → Add Disk:
   - **Mount Path:** `/var/data/trendkargo`
   - **Size:** ۱ گیگ کافی است
2. در **Environment Variables** سرویس اضافه کنید:
   - `DATA_DIR=/var/data/trendkargo`
3. با اولین اجرا، فایل‌ها از نسخهٔ مخزن (seed) روی دیسک کپی می‌شوند؛ بعد از آن فقط همان دیسک خوانده/نوشته می‌شود و با redeploy **پاک نمی‌شود**.

## اتصال دامنهٔ شخصی (مثلاً trendkargo.ir)

1. در Render: سرویس → **Settings → Custom Domains** → Add → `trendkargo.ir` (و اگر خواستید `www.trendkargo.ir`).
2. Render دو رکورد DNS می‌دهد؛ در پنل دامنه‌تان ( nic.ir یا هر registrar ) این‌ها را بگذارید:
   - `A` برای `@` به IP داده‌شده، یا `CNAME` برای `www` به آدرس `xxx.onrender.com`
3. چند دقیقه تا چند ساعت صبر کنید؛ HTTPS خودکار (Let's Encrypt) صادر می‌شود.
4. بعد از اتصال: ادمین و سایت هر دو روی دامنهٔ خودتان‌اند و نیازی به تغییر کد نیست (API هم‌مبدا است).
5. سئو: چون دامنه همان دامنهٔ قبلی است، `sitemap.xml` و `robots.txt` معتبر می‌مانند.

## نکات مهم

- **دامنهٔ شخصی:** در Render/Railway می‌توانید دامنهٔ خودتان (مثلاً `trendkargo.ir`) را وصل کنید؛ HTTPS خودکار است.
- **داده‌ها:** روی پلن رایگان، فایل‌های `backend/data/*.json` با هر redeploy ریست می‌شوند. برای ماندگاری واقعی، بعداً باید به Disk دائمی (Render Disk) یا دیتابیس (Supabase) منتقل شود — بگویید تا انجام دهم.
- **Vercel:** نسخهٔ استاتیک Vercel دیگر منبع حقیقت نیست؛ بعد از استقرار Node، دامنه را به سرویس جدید وصل کنید.
- **تست محلی قبل از استقرار:** `cd backend && npm install && npm start` سپس `http://localhost:3000/admin.html`.