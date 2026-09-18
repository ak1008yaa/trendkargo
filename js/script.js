/**
 * ==========================================================================
 *  TREND CARGO — CORE ENGINE v5.0
 *  Rewritten for performance, safety, and premium UX
 *  Static-site friendly — no build step required.
 * ==========================================================================
 */

'use strict';

/* -------------------------------------------------------------------------- */
/*  CONSTANTS & CONFIG                                                        */
/* -------------------------------------------------------------------------- */

const WHATSAPP_NUMBER = '989374443386';
const FALLBACK_IMG = 'assets/img/products/photo-1526738549149-8e07eca6c147-w600.jpg';

// ---- Supabase — شمارش بازدید روزانه (کلید anon عمومی است و امن) ----
const SUPABASE_URL = 'https://zepoeywugldczcnvnlyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcG9leXd1Z2xkY3pjbnZubHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjAyNTYsImV4cCI6MjEwNDk5NjI1Nn0.Y4qNjZQJs7x0Z-4RwfE7YgxX49rDlJ8YbMgiyEFgdIQ';

const STORAGE_KEYS = Object.freeze({
  products:     'trendcargo_custom_products',
  specialOffer: 'trendcargo_special_offer',
  news:         'trendcargo_custom_news',
  rates:        'trendcargo_custom_rates',
  lastRates:    'trendcargo_last_exchange_rates',
  theme:        'trendcargo_theme',
  invoices:     'trendcargo_accounting_invoices',
  lastInvoice:  'trendcargo_last_invoice',
  sheetUrl:     'trendcargo_google_sheet_url',
  testimonials: 'trendcargo_testimonials',
  tgjuCache:    'trendcargo_tgju_cached_rates'
});

const CURRENCY_CONFIG = Object.freeze({
  baseRates: { amd: 170, usd: 188000, try: 5800, eur: 205000 },
  exchangeSpreadMultiplier: 1.06,
  usdShippingRate: 188000,
  minShippingToman: 3500000
});

/* -------------------------------------------------------------------------- */
/*  UTILITIES                                                                 */
/* -------------------------------------------------------------------------- */

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

const FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
function toFaDigits(value) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

function formatFaNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '۰';
  return toFaDigits(n.toLocaleString('en-US'));
}

function safeJSON(raw, fallback = null) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return safeJSON(raw, raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] write failed:', key, e);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* -------------------------------------------------------------------------- */
/*  SUPABASE STORE — منبع حقیقت مشترک بین ادمین و سایت اصلی                    */
/*  فرانت (سایت اصلی): خواندن anon + polling ۱۰ ثانیه                           */
/*  ادمین: نوشتن با service_role که فقط در admin.html لود میشود                */
/* -------------------------------------------------------------------------- */

const SupabaseStore = (() => {
  // ---- کلید نوشتن ادمین (service_role)؛ فقط داخل admin.html بارگذاری میشود ----
  const serviceKey = window.SUPABASE_SERVICE_KEY || '';
  const writeKey = serviceKey || SUPABASE_ANON_KEY;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + writeKey,
    'Content-Type': 'application/json',
  };

  const cache = new Map(); // key -> { value, ts }
  let lastFetchTs = null;
  let listeners = [];

  return {
    get available() { return !!SUPABASE_URL && !!SUPABASE_ANON_KEY; },

    /** خواندن از سرور؛ اگر keys آرایه خالی/تهی باشد همه را میخواند. */
    async pull(keys = null) {
      try {
        const body = keys && keys.length ? JSON.stringify({ p_keys: keys }) : JSON.stringify({});
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_site_data`, {
          method: 'POST', headers, body, cache: 'no-store',
        });
        if (!r.ok) throw new Error('pull http ' + r.status);
        const rows = await r.json();
        const tsByKey = {};
        for (const row of rows) {
          cache.set(row.k, { value: row.v, ts: row.ts });
          tsByKey[row.k] = row.ts;
        }
        lastFetchTs = Date.now();
        return tsByKey;
      } catch (e) {
        return null;
      }
    },

    /** نوشتن — فقط از admin.html فراخوانی میشود (کلید service_role دارد) */
    async write(key, value) {
      if (!serviceKey) return { ok: false, reason: 'no service key' };
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_site_data`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_key: key, p_value: value }),
        });
        return { ok: r.ok };
      } catch (e) {
        return { ok: false, reason: String(e) };
      }
    },

    /** بهروزرسانی‌های سرور → فراخوانی listeners */
    onUpdate(cb) {
      listeners.push(cb);
    },

    /** فراخوانی دورهای توسط polling */
    async tickPolling() {
      const ts = await this.pull();
      if (!ts) return;
      for (const [key, entry] of cache) {
        for (const cb of listeners) cb(key, entry.value, entry.ts);
      }
    },

    cache,
    get lastFetchTs() { return lastFetchTs; },
  };
})();

/* -------------------------------------------------------------------------- */
/*  REMOTE SYNC — اتصال لحظه‌ای به بک‌اند (در صورت اجرا بودن سرور)           */
/*  سایت اصلی هنگام لود از /api/store می‌خواند و با SSE (EventSource)        */
/*  هر ذخیرهٔ ادمین را همان لحظه — بدون رفرش — روی همهٔ دستگاه‌ها می‌گیرد.   */
/*  اگر سرور در دسترس نبود، رفتار فعلی localStorage حفظ می‌شود.              */
/* -------------------------------------------------------------------------- */

const RemoteSync = {
  enabled: false,
  ready: false,
  source: null,
  seenVersion: -1,
  debounceMs: 800,
  _t: null,

  sameOrigin() {
    // سرور Node خودش سایت را سرو می‌کند؛ پس API هم‌مبدا است.
    return ['http:', 'https:'].includes(window.location.protocol);
  },

  async pullAll() {
    // اول از Supabase (اگر در دسترس)، بعداً fallback به backend (legacy)
    if (SupabaseStore.available) {
      const ok = await SupabaseStore.pull();
      if (ok) {
        this.applySupabaseCache();
        return true;
      }
    }
    try {
      const liveStore = await fetch('/api/store', { cache: 'no-store' });
      if (liveStore.ok) {
        const payload = await liveStore.json();
        const data = payload && payload.data;
        if (data) {
          if (Array.isArray(data.products) && data.products.length) Storage.set(STORAGE_KEYS.products, data.products);
          if (data.specialOffer && typeof data.specialOffer === 'object') Storage.set(STORAGE_KEYS.specialOffer, data.specialOffer);
          if (Array.isArray(data.news)) Storage.set(STORAGE_KEYS.news, data.news);
          if (Array.isArray(data.testimonials)) Storage.set(STORAGE_KEYS.testimonials, data.testimonials);
          if (data.rates && typeof data.rates === 'object') Storage.set(STORAGE_KEYS.rates, data.rates);
          if (Array.isArray(data.discounts)) localStorage.setItem('trendcargo_discounts', JSON.stringify(data.discounts));
          this.enabled = true;
          return true;
        }
      }
      const res = await fetch('api/store', { cache: 'no-store' });
      if (!res.ok) return false;
      const payload = await res.json();
      const data = payload && payload.data;
      if (!data) return false;

      if (Array.isArray(data.products) && data.products.length) {
        Storage.set(STORAGE_KEYS.products, data.products);
      }
      if (data.specialOffer && typeof data.specialOffer === 'object' && !Array.isArray(data.specialOffer)) {
        Storage.set(STORAGE_KEYS.specialOffer, data.specialOffer);
      }
      if (Array.isArray(data.news)) {
        Storage.set(STORAGE_KEYS.news, data.news);
      }
      if (Array.isArray(data.testimonials) && data.testimonials.length) {
        Storage.set(STORAGE_KEYS.testimonials, data.testimonials);
      }
      if (data.rates && typeof data.rates === 'object') {
        Storage.set(STORAGE_KEYS.rates, data.rates);
        Storage.set(STORAGE_KEYS.lastRates, data.rates);
      }
      if (Array.isArray(data.discounts)) {
        try { localStorage.setItem('trendcargo_discounts', JSON.stringify(data.discounts)); } catch {}
      }
      if (typeof payload.version === 'number') this.seenVersion = payload.version;
      this.enabled = true;
      return true;
    } catch (e) {
      return false;
    }
  },

  /** خواندن از cache ساپابیس به storage محلی (اگر مقدار هست) */
  applySupabaseCache() {
    if (!SupabaseStore.available) return false;
    const c = SupabaseStore.cache;
    let applied = false;
    const products = c.get('products')?.value;
    if (Array.isArray(products) && products.length) {
      Storage.set(STORAGE_KEYS.products, products); applied = true;
    }
    const so = c.get('special_offer')?.value;
    if (so && typeof so === 'object' && !Array.isArray(so)) {
      Storage.set(STORAGE_KEYS.specialOffer, so); applied = true;
    }
    const news = c.get('news')?.value;
    if (Array.isArray(news)) { Storage.set(STORAGE_KEYS.news, news); applied = true; }
    const test = c.get('testimonials')?.value;
    if (Array.isArray(test) && test.length) {
      Storage.set(STORAGE_KEYS.testimonials, test); applied = true;
    }
    const rates = c.get('rates')?.value;
    if (rates && typeof rates === 'object') {
      Storage.set(STORAGE_KEYS.rates, rates);
      Storage.set(STORAGE_KEYS.lastRates, rates); applied = true;
    }
    const disc = c.get('discounts')?.value;
    if (Array.isArray(disc)) {
      try { localStorage.setItem('trendcargo_discounts', JSON.stringify(disc)); } catch {}
      applied = true;
    }
    return applied;
  },

  /** Polling هر ۱۰ ثانیه از ساپابیس و apply به storage + رندر */
  startPolling() {
    if (this._poll) return;
    if (!SupabaseStore.available) return;
    this._poll = setInterval(async () => {
      try {
        const ok = await SupabaseStore.pull();
        if (!ok) return;
        const changed = this.applySupabaseCache();
        if (changed) this.rerenderAll();
      } catch (e) { /* silent */ }
    }, 10000);
  },

  rerenderAll() {
    try {
      TrendStore.init();
      newsExpanded = false;
      if (typeof renderProducts === 'function') renderProducts();
      if (typeof renderSpecialOffer === 'function') renderSpecialOffer();
      if (typeof renderTechNews === 'function') renderTechNews();
      if (typeof renderTestimonials === 'function') renderTestimonials();
      if (typeof initTestimonialsSlider === 'function') initTestimonialsSlider();
      if (typeof observeReveals === 'function') observeReveals();
    } catch (e) {
      console.warn('[RemoteSync] rerender failed:', e);
    }
  },

  scheduleRerender() {
    clearTimeout(this._t);
    this._t = setTimeout(() => {
      this.pullAll().then(() => this.rerenderAll());
    }, this.debounceMs);
  },

  subscribe() {
    if (!this.enabled || this.source || typeof EventSource === 'undefined') return;
    try {
      const src = new EventSource('api/events');
      src.addEventListener('store-update', (event) => {
        try {
          const msg = JSON.parse(event.data || '{}');
          if (typeof msg.version === 'number' && msg.version <= this.seenVersion) return;
          this.scheduleRerender();
        } catch (e) {
          this.scheduleRerender();
        }
      });
      src.onerror = () => {
        // اتصال مجدد: EventSource خودش تلاش می‌کند؛ اگر قطع شد، سبک نگهش می‌داریم.
        if (src.readyState === EventSource.CLOSED) {
          this.source = null;
        }
      };
      this.source = src;
    } catch (e) {
      console.warn('[RemoteSync] SSE unavailable:', e);
    }
  },

  async boot() {
    if (!this.sameOrigin()) return;
    try {
      const ok = await this.pullAll();
      if (ok) this.rerenderAll();
      if (this.enabled) this.subscribe();
    } catch (e) {
      console.warn('[RemoteSync] boot failed:', e);
    }
  }
};

/* -------------------------------------------------------------------------- */
/*  PRODUCT DATA — copied verbatim from the original file                     */
/* -------------------------------------------------------------------------- */

const top20Products = [
  {
    id: 1, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "مینی پرینتر حرارتی جیبی فوممو بدون جوهر",
    price: "۱,۹۸۰,۰۰۰", rawPrice: 1980000, tag: "پرفروش‌ترین تمو", mainImg: "assets/img/products/photo-1612815154858-60aa4c59eaa6-w600.jpg",
    gallery: [
      "assets/img/products/photo-1612815154858-60aa4c59eaa6-w600.jpg",
      "assets/img/products/photo-1588872657578-7efd1f1555ed-w600.jpg",
      "assets/img/products/photo-1526738549149-8e07eca6c147-w600.jpg"
    ],
    desc: "چاپگر فوری بدون نیاز به تعویض جوهر و ریبون؛ چاپ مستقیم عکس، یادداشت روزانه، استیکر و بارکد از گوشی با بلوتوث.",
    specs: ["فناوری: چاپ حرارتی مستقیم ۲۰۰DPI", "باتری: ۱۰۰۰mAh شارژی با Type-C", "همراه با ۱ رول کاغذ حرارتی برچسب‌دار"]
  },
  {
    id: 2, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "شارژر وایرلس ۳ کاره مگنتی تاشو مسافرتی ۱۵W",
    price: "۲,۲۵۰,۰۰۰", rawPrice: 2250000, tag: "ترند تیک‌تاک", mainImg: "assets/img/placeholder.svg",
    gallery: [
      "assets/img/placeholder.svg",
      "assets/img/products/photo-1586953208448-b95a79798f07-w600.jpg"
    ],
    desc: "شارژ همزمان گوشی آیفون/سامسونگ، ساعت هوشمند و ایرپاد در ابعاد یک کیف جیبی کوچک با چیپست هوشمند محافظت باتری.",
    specs: ["توان شارژ: ۱۵W + ۵W + ۳W مگ‌سیف فست", "بدنه آلومینیومی تاشو با روکش سیلیکونی لطیف", "سازگار با سری آیفون ۱۲ تا ۱۶ و سامسونگ"]
  },
  {
    id: 3, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "پروژکتور فضانورد کهکشانی با چرخش مگنتی ۳۶۰",
    price: "۱,۸۹۰,۰۰۰", rawPrice: 1890000, tag: "وایرال دکوراسیون", mainImg: "assets/img/products/photo-1534447677768-be436bb09401-w600.jpg",
    gallery: [
      "assets/img/products/photo-1534447677768-be436bb09401-w600.jpg"
    ],
    desc: "چراغ خواب پرطرفدار با طرح فضانورد که سقف و دیوارها را به کهکشان پرستاره متحرک با افکت سحابی تبدیل می‌کند.",
    specs: ["سر با چرخش آهنربایی ۳۶۰ درجه آزاد", "۸ افکت نوری سحابی + لیزر سبز ستاره‌ای", "دارای ریموت کنترل بی‌سیم و تایمر خاموشی"]
  },
  {
    id: 4, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "جاروشارژی تفنگی توربو و دمنده ۲ کاره ۶۰۰۰Pa",
    price: "۱,۶۵۰,۰۰۰", rawPrice: 1650000, tag: "فوق کاربردی", mainImg: "assets/img/products/photo-1558317374-067fb5f30001-w600.jpg",
    gallery: [
      "assets/img/products/photo-1558317374-067fb5f30001-w600.jpg"
    ],
    desc: "جارو برقی پرتابل بی‌سیم با مکش قدرتمند و سری دمنده باد برای تمیز کردن شیار صندلی خودرو و کیبورد.",
    specs: ["قدرت مکش: ۶۰۰۰ پاسکال توربو", "فیلتر قابل شستشو چندبار مصرف HEPA", "باتری ۲۰۰۰mAh با پورت شارژ سریع"]
  },
  {
    id: 5, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "چراغ خطی مگنتی سنسوردار هوشمند زیر کابینت",
    price: "۶۸۰,۰۰۰", rawPrice: 680000, tag: "ترند خانه هوشمند", mainImg: "assets/img/products/photo-1507473885765-e6ed057f782c-w600.jpg",
    gallery: [
      "assets/img/products/photo-1507473885765-e6ed057f782c-w600.jpg"
    ],
    desc: "نورپردازی خطی بی‌سیم با سنسور تشخیص حرکت انسان (PIR) و حسگر تاریکی؛ روشن شدن خودکار با نزدیک شدن.",
    specs: ["طول چراغ: ۴۰ سانتی‌متر", "نصب آسان بدون سیم‌کشی با پد مگنتی چسبی", "باتری شارژی با ماندگاری تا ۳۰ روز"]
  },
  {
    id: 6, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "دستگاه بخور سرد اولتراسونیک با شبیه‌ساز شعله آتش",
    price: "۱,۱۸۰,۰۰۰", rawPrice: 1180000, tag: "آرامش‌بخش و معطر", mainImg: "assets/img/products/photo-1608571423902-eed4a5ad8108-w600.jpg",
    gallery: [
      "assets/img/products/photo-1608571423902-eed4a5ad8108-w600.jpg"
    ],
    desc: "رطوبت‌ساز اولتراسونیک که با ترکیب بخار سرد و نورپردازی LED هوشمند، شعله‌های آتشین واقعی خلق می‌کند.",
    specs: ["موتور بی‌صدا کمتر از ۲۸ دسی‌بل", "حالت‌های نوری شعله طلایی و RGB", "خاموشی خودکار با اتمام آب مخزن"]
  },
  {
    id: 7, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "هودی اورسایز وینتیج سنگین ۱۰۰٪ پنبه اسیدواش",
    price: "۲,۳۵۰,۰۰۰", rawPrice: 2350000, tag: "ترند پینترست", mainImg: "assets/img/products/photo-1556905055-8f358a7a47b2-w600.jpg",
    gallery: [
      "assets/img/products/photo-1556905055-8f358a7a47b2-w600.jpg"
    ],
    desc: "هودی کلاهدار با بافت ضخیم ۳ نخ و رنگ‌بندی ترند شسته‌شده پینترست، دوخت دولایه صنعتی و فیت آزاد شیک.",
    specs: ["پارچه: ۱۰۰٪ پنبه سوپر سنگین ۳۸۰ گرمی", "سایزبندی: M تا XXL اورسایز", "تضمین رنگ و عدم پرزدهی در شستشو"]
  },
  {
    id: 8, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "شلوار کارگو بگ استایل ۶ جیب تاکتیکال ضخیم",
    price: "۲,۶۸۰,۰۰۰", rawPrice: 2680000, tag: "استریت ویر", mainImg: "assets/img/products/photo-1517445312882-bc9910d016b7-w600.jpg",
    gallery: [
      "assets/img/products/photo-1517445312882-bc9910d016b7-w600.jpg"
    ],
    desc: "شلوار استریت ویر با جیب‌های حجیم کارگو، بندهای تنظیم دم‌پا سبک تاکتیکال پرطرفدار در فشن ژاپن.",
    specs: ["جنس: کتان پنبه‌ای گرماژ بالا و سنگ‌شور شده", "سایزبندی: ۳۰ تا ۳۸", "دوخت سه‌سوزنه مقاوم"]
  },
  {
    id: 9, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "پاوربانک مگ‌سیف شفاف سایبرپانک ۱۰۰۰۰mAh",
    price: "۲,۴۵۰,۰۰۰", rawPrice: 2450000, tag: "طراحی سایبرپانک", mainImg: "assets/img/placeholder.svg",
    gallery: [
      "assets/img/placeholder.svg"
    ],
    desc: "پاوربانک شفاف با نمایشگر دیجیتال درصد شارژ و برد الکترونیکی نمایان با قابلیت شارژ بیسیم مغناطیسی.",
    specs: ["ظرفیت باتری: ۱۰۰۰۰ میلی‌آمپر لیتیوم پلیمری", "خروجی باسیم: ۲۲.۵W فست PD", "خروجی مگ‌سیف: ۱۵W"]
  },
  {
    id: 10, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "تراول ماگ ضد نشت استنلس استیل ۴۰ اونسی دسته‌دار",
    price: "۱,۱۵۰,۰۰۰", rawPrice: 1150000, tag: "وایرال استنلی استایل", mainImg: "assets/img/products/photo-1517256064527-09c73fc73e38-w600.jpg",
    gallery: [
      "assets/img/products/photo-1517256064527-09c73fc73e38-w600.jpg"
    ],
    desc: "ماگ دوجداره استیل ۱.۲ لیتری با دسته ارگونومیک، درب عایق ضد نشت و حفظ دمای یخ تا ۳۰ ساعت.",
    specs: ["گنجایش: ۴۰ اونس (۱۱۸۰ میلی‌لیتر)", "متریال: استیل ضد زنگ دوجداره ۳۰۴ غذایی", "پایه باریک مناسب جا لیوانی خودرو"]
  },
  {
    id: 11, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "هدست گیمینگ بی‌سیم نویزکنسلینگ اورایر",
    price: "۲,۹۸۰,۰۰۰", rawPrice: 2980000, tag: "ترند گیمینگ", mainImg: "assets/img/products/photo-1505740420928-5e560c06d30e-w600.jpg",
    gallery: [
      "assets/img/products/photo-1505740420928-5e560c06d30e-w600.jpg",
      "assets/img/products/photo-1583394838336-acd977736f90-w600.jpg"
    ],
    desc: "هدفون اورایر با نویزکنسلینگ اکتیو، صدای فرکانس‌بالا و میکروفون حذف نویز محیط مناسب گیم و کال‌های طولانی.",
    specs: ["اتصال: بلوتوث ۵.۳ با تاخیر زیر ۶۰ میلی‌ثانیه", "باتری: ۴۰ ساعت پخش مداوم با شارژ سریع Type-C", "پد گوش طبی با فوم حافظه‌دار برای استفاده طولانی"]
  },
  {
    id: 12, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "ساعت هوشمند آمولد با پایش ضربان و اکسیژن خون",
    price: "۲,۱۵۰,۰۰۰", rawPrice: 2150000, tag: "پرفروش هدیه", mainImg: "assets/img/products/photo-1546868871-7041f2a55e12-w600.jpg",
    gallery: [
      "assets/img/products/photo-1546868871-7041f2a55e12-w600.jpg",
      "assets/img/products/photo-1523275335684-37898b6baf30-w600.jpg"
    ],
    desc: "اسمارت واچ نمایشگر آمولد گرد با بیش از ۱۰۰ حالت ورزشی، پایش خواب و اعلان‌های هوشمند فارسی.",
    specs: ["نمایشگر: آمولد ۱.۴ اینچی همیشه‌روشن", "سنسورها: ضربان قلب، SpO2 و پایش خواب", "مقاومت: ضدآب IP68 با باتری ۷ روزه"]
  },
  {
    id: 13, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "کیبورد مکانیکال RGB هات‌سواپ قابل شستشو",
    price: "۲,۷۵۰,۰۰۰", rawPrice: 2750000, tag: "ست‌آپ حرفه‌ای", mainImg: "assets/img/products/photo-1587829741301-dc798b83add3-w600.jpg",
    gallery: [
      "assets/img/products/photo-1587829741301-dc798b83add3-w600.jpg",
      "assets/img/products/photo-1527814050087-3793815479db-w600.jpg"
    ],
    desc: "کیبورد ۷۵٪ مکانیکال با سوییچ هات‌سواپ، نورپردازی RGB پریمیوشن و بدنه فلزی برای استیم و تایپ حرفه‌ای.",
    specs: ["سوییچ: قرمز خطی هات‌سواپ قابل تعویض", "اتصال: سه‌حالته بلوتوث، ۲.۴G و سیمی Type-C", "بدنه آلومینیومی با فوم عایق صدای تایپ"]
  },
  {
    id: 14, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "کتانی رانینگ مش نخی بالشتکی سبک تک‌رنگ",
    price: "۲,۲۹۰,۰۰۰", rawPrice: 2290000, tag: "استایل اسپرت", mainImg: "assets/img/products/photo-1542291026-7eec264c27ff-w600.jpg",
    gallery: [
      "assets/img/products/photo-1542291026-7eec264c27ff-w600.jpg",
      "assets/img/products/photo-1560343090-f0409e92791a-w600.jpg",
      "assets/img/products/photo-1600185365483-26d7a4cc7519-w600.jpg"
    ],
    desc: "کتانی رانینگ روزمره با رویه مش تنفسی و کفی فوم مموری؛ سبک، راحت و مناسب پیاده‌روی طولانی و استایل اسپرت.",
    specs: ["کفی: فوم مموری قابل تعویض ضدبو", "وزن: حدود ۲۸۰ گرم برای هر لنگه", "سایزبندی: ۳۹ تا ۴۴ استاندارد"]
  },
  {
    id: 15, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "کت بامبر پایلینگ ضدآب و باد اورسایز",
    price: "۲,۵۵۰,۰۰۰", rawPrice: 2550000, tag: "ضد آب و باد", mainImg: "assets/img/products/photo-1591047139829-d91aecb6caea-w600.jpg",
    gallery: [
      "assets/img/products/photo-1591047139829-d91aecb6caea-w600.jpg",
      "assets/img/products/photo-1556905055-8f358a7a47b2-w600.jpg"
    ],
    desc: "بامبر جکت پاییزه با روکش ضدآب، آستر توری و بندهای تنظیم کمر؛ مناسب استایل استریت و سفر.",
    specs: ["روکش: پلی‌استر ضدآب با پوشش پوسته‌ای", "آستر: توری تنفسی با جیب داخلی زیپ‌دار", "سایزبندی: M تا XXL فیت آزاد"]
  },
  {
    id: 16, stock: "iran", category: "accessory", catName: "اکسسوری و کیف", title: "بک‌پک ضدآب لپ‌تاپی با پورت شارژ USB",
    price: "۱,۳۵۰,۰۰۰", rawPrice: 1350000, tag: "محبوب دانشجویی", mainImg: "assets/img/products/photo-1553062407-98eeb64c6a62-w600.jpg",
    gallery: [
      "assets/img/products/photo-1553062407-98eeb64c6a62-w600.jpg",
      "assets/img/products/photo-1517445312882-bc9910d016b7-w600.jpg"
    ],
    desc: "کوله اداری و دانشجویی با محفظه ضربه‌گیر لپ‌تاپ ۱۵.۶ اینچ، جنس ضدآب و پورت شارژ USB بیرونی.",
    specs: ["گنجایش: ۲۵ لیتر با ۱۲ جیب داخلی و خارجی", "محفظه لپ‌تاپ: ضربه‌گیر تا سایز ۱۵.۶ اینچ", "کمربند سینه + پشت پنل ضدتعریق"]
  },
  {
    id: 17, stock: "iran", category: "accessory", catName: "اکسسوری و کیف", title: "عینک آفتابی پلاریزه یووی ۴۰۰ فریم فلزی",
    price: "۹۸۰,۰۰۰", rawPrice: 980000, tag: "یووی ۴۰۰ اصل", mainImg: "assets/img/products/photo-1511499767150-a48a237f0083-w600.jpg",
    gallery: [
      "assets/img/products/photo-1511499767150-a48a237f0083-w600.jpg",
      "assets/img/products/photo-1572635196237-14b3f281503f-w600.jpg"
    ],
    desc: "عینک آفتابی با لنز پلاریزه حذف انعکاس و محافظت کامل UV400؛ همراه با کیف سخت و دستمال مخصوص.",
    specs: ["لنز: پلاریزه با پوشش ضدخش و UV400", "فریم: فلزی سبک با پد بینی سیلیکونی", "همراه: کیف سخت، دستمال و کارت تست اصل"]
  },
  {
    id: 18, stock: "iran", category: "accessory", catName: "اکسسوری و کیف", title: "کیف دستی مینیمال زنانه با بند شانه جداشدنی",
    price: "۱,۶۸۰,۰۰۰", rawPrice: 1680000, tag: "ترند مینیمال", mainImg: "assets/img/products/photo-1548036328-c9fa89d128fa-w600.jpg",
    gallery: [
      "assets/img/products/photo-1548036328-c9fa89d128fa-w600.jpg",
      "assets/img/products/photo-1590874103328-eac38a683ce7-w600.jpg"
    ],
    desc: "کیف دستی بافت مینیمال با آستر پارچه‌ای، سه محفظه و بند شانه قابل جدا شدن؛ مناسب استایل روزمره و مجلسی.",
    specs: ["جنس: چرم مصنوعی درجه یک ضدخط‌وخش", "ابعاد: ۲۶×۱۸×۹ سانتی‌متر", "بند شانه: قابل تنظیم و جداشدنی"]
  },
  {
    id: 19, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "بطری آب استیل ترمو ۱ لیتری دوجداره بدنه چسبی",
    price: "۸۵۰,۰۰۰", rawPrice: 850000, tag: "همراه سفر", mainImg: "assets/img/products/photo-1602143407151-7111542de6e8-w600.jpg",
    gallery: [
      "assets/img/products/photo-1602143407151-7111542de6e8-w600.jpg",
      "assets/img/products/photo-1517256064527-09c73fc73e38-w600.jpg"
    ],
    desc: "بطری استیل ضدزنگ دوجداره با ماندگاری سردی ۲۴ ساعت و گرمی ۱۲ ساعت؛ درب ضدنشت و بدنه روکش پودری.",
    specs: ["ظرفیت: ۱ لیتر با درب بسته‌بندی ضدنشت", "متریال: استیل ۳۰۴ غذایی دوجداره خلأ", "بدنه: روکش پودری ضدلغزش و ضدعرق"]
  },
  {
    id: 20, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "رینگ لایت حلقه‌ای خودی با پایه و ریموت تیک‌تاک",
    price: "۱,۴۵۰,۰۰۰", rawPrice: 1450000, tag: "وایرال تیک‌تاک", mainImg: "assets/img/products/photo-1608043152269-423dbba4e7e1-w600.jpg",
    gallery: [
      "assets/img/products/photo-1608043152269-423dbba4e7e1-w600.jpg",
      "assets/img/products/photo-1534447677768-be436bb09401-w600.jpg"
    ],
    desc: "رینگ لایت ۱۲ اینچی با ۳ حالت رنگ و ۱۰ سطح شدت نور، پایه تلسکوپی تا ۲ متر و ریموت شاتر بلوتوثی.",
    specs: ["نور: ۳ حالت سفید، گرم و مخلوط با دیمر ۱۰ مرحله", "پایه: تلسکوپی تا ۲ متر با سر چرخان ۳۶۰", "ریموت: بلوتوث شاتر سازگار با iOS و اندروید"]
  },
  {
    id: 21, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "اسپیکر بلوتوثی قابل حمل با نورپردازی RGB",
    price: "۱,۳۹۰,۰۰۰", rawPrice: 1390000, tag: "موجود در ایران", mainImg: "assets/img/products/photo-1608043152269-423dbba4e7e1-w600.jpg",
    gallery: ["assets/img/products/photo-1608043152269-423dbba4e7e1-w600.jpg"],
    desc: "اسپیکر جمع‌وجور با صدای شفاف، نورپردازی هماهنگ با موسیقی و باتری مناسب استفاده روزمره.",
    specs: ["اتصال: بلوتوث ۵.۳", "باتری: تا ۱۲ ساعت پخش", "مقاومت: IPX5 در برابر پاشش آب"]
  },
  {
    id: 22, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "پایه نگهدارنده تاشو موبایل و تبلت آلومینیومی",
    price: "۵۹۰,۰۰۰", rawPrice: 590000, tag: "ارسال فوری", mainImg: "assets/img/products/photo-1526738549149-8e07eca6c147-w600.jpg",
    gallery: ["assets/img/products/photo-1526738549149-8e07eca6c147-w600.jpg"],
    desc: "پایه رومیزی مقاوم برای تماس تصویری، مطالعه و تماشای فیلم با زاویه قابل تنظیم.",
    specs: ["بدنه: آلومینیوم ضدلغزش", "سازگار با موبایل و تبلت تا ۱۲.۹ اینچ", "قابلیت جمع شدن برای حمل آسان"]
  },
  {
    id: 23, stock: "iran", category: "accessory", catName: "اکسسوری و کیف", title: "کیف کمری ضدآب شهری با محفظه مخفی",
    price: "۷۸۰,۰۰۰", rawPrice: 780000, tag: "پرفروش روزمره", mainImg: "assets/img/products/photo-1553062407-98eeb64c6a62-w600.jpg",
    gallery: ["assets/img/products/photo-1553062407-98eeb64c6a62-w600.jpg"],
    desc: "کیف سبک و کاربردی برای موبایل، کارت و وسایل ضروری با بند قابل تنظیم.",
    specs: ["جنس: پارچه ضدآب", "دارای ۳ محفظه زیپ‌دار", "بند قابل تنظیم تا ۱۲۰ سانتی‌متر"]
  },
  {
    id: 24, stock: "iran", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "ترازو دیجیتال هوشمند شیشه‌ای",
    price: "۹۹۰,۰۰۰", rawPrice: 990000, tag: "سلامت و خانه", mainImg: "assets/img/products/photo-1546868871-7041f2a55e12-w600.jpg",
    gallery: ["assets/img/products/photo-1546868871-7041f2a55e12-w600.jpg"],
    desc: "ترازوی دقیق با نمایشگر خوانا و اتصال به اپلیکیشن برای ثبت روند وزن.",
    specs: ["تحمل وزن: تا ۱۸۰ کیلوگرم", "اتصال: بلوتوث", "سطح: شیشه حرارت‌دیده ضدلغزش"]
  },
  {
    id: 25, stock: "iran", category: "gadget", catName: "گجت و دیجیتال", title: "لامپ مطالعه LED گیره‌ای با سه دمای نور",
    price: "۶۴۰,۰۰۰", rawPrice: 640000, tag: "موجود در ایران", mainImg: "assets/img/products/photo-1507473885765-e6ed057f782c-w600.jpg",
    gallery: ["assets/img/products/photo-1507473885765-e6ed057f782c-w600.jpg"],
    desc: "چراغ مطالعه کم‌مصرف با گیره محکم و تنظیم شدت نور برای میز کار و مطالعه.",
    specs: ["۳ دمای رنگ نور", "تنظیم شدت نور لمسی", "بازوی انعطاف‌پذیر با گیره رومیزی"]
  },
  {
    id: 26, stock: "iran", category: "accessory", catName: "اکسسوری و کیف", title: "کیف نظم‌دهنده کابل و لوازم دیجیتال",
    price: "۴۸۰,۰۰۰", rawPrice: 480000, tag: "ارسال فوری", mainImg: "assets/img/products/photo-1590874103328-eac38a683ce7-w600.jpg",
    gallery: ["assets/img/products/photo-1590874103328-eac38a683ce7-w600.jpg"],
    desc: "کیف کوچک و مرتب برای شارژر، کابل، فلش و لوازم ضروری سفر.",
    specs: ["دارای کش و جیب‌های چندگانه", "جنس مقاوم در برابر خط‌وخش", "ابعاد مناسب کیف و کوله روزمره"]
  },
  {
    id: 27, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "ست تی‌شرت و شلوارک نخی تابستانی",
    price: "۱,۴۸۰,۰۰۰", rawPrice: 1480000, tag: "پیشنهاد خرید", mainImg: "assets/img/products/photo-1556905055-8f358a7a47b2-w600.jpg",
    gallery: ["assets/img/products/photo-1556905055-8f358a7a47b2-w600.jpg"],
    desc: "ست راحتی سبک با پارچه نخی و فرم آزاد برای استفاده روزمره و سفر.",
    specs: ["جنس: نخ و پنبه نرم", "سایزبندی: M تا XXL", "قابل شستشو با ماشین لباسشویی"]
  },
  {
    id: 28, stock: "order", category: "fashion", catName: "استایل و پوشاک", title: "کتانی روزمره سبک با کفی طبی",
    price: "۲,۱۰۰,۰۰۰", rawPrice: 2100000, tag: "پیشنهاد خرید", mainImg: "assets/img/products/photo-1542291026-7eec264c27ff-w600.jpg",
    gallery: ["assets/img/products/photo-1542291026-7eec264c27ff-w600.jpg"],
    desc: "کتانی سبک با رویه تنفسی و کفی نرم برای پیاده‌روی و استفاده روزانه.",
    specs: ["رویه: مش تنفسی", "کفی: مموری فوم", "سایزبندی: ۳۹ تا ۴۴"]
  },
  {
    id: 29, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "ست ارگانایزر کشویی برای میز و آشپزخانه",
    price: "۱,۰۵۰,۰۰۰", rawPrice: 1050000, tag: "خانه مرتب", mainImg: "assets/img/products/photo-1602143407151-7111542de6e8-w600.jpg",
    gallery: ["assets/img/products/photo-1602143407151-7111542de6e8-w600.jpg"],
    desc: "محفظه‌های چندتکه برای مرتب‌سازی لوازم آرایش، میز کار و کشوهای آشپزخانه.",
    specs: ["جنس: پلاستیک مقاوم", "قابل شستشو", "دارای چند محفظه قابل جابه‌جایی"]
  },
  {
    id: 30, stock: "order", category: "gadget", catName: "گجت و دیجیتال", title: "دوربین وب‌کم Full HD با میکروفون دوگانه",
    price: "۱,۷۹۰,۰۰۰", rawPrice: 1790000, tag: "پیشنهاد خرید", mainImg: "assets/img/products/photo-1587829741301-dc798b83add3-w600.jpg",
    gallery: ["assets/img/products/photo-1587829741301-dc798b83add3-w600.jpg"],
    desc: "وب‌کم مناسب کلاس آنلاین و تماس کاری با تصویر شفاف و نصب آسان روی مانیتور.",
    specs: ["وضوح تصویر: Full HD 1080p", "میکروفون دوگانه حذف نویز", "اتصال USB بدون نیاز به درایور"]
  },
  {
    id: 31, stock: "order", category: "accessory", catName: "اکسسوری و کیف", title: "ساعت کلاسیک مینیمال با بند چرمی",
    price: "۱,۳۲۰,۰۰۰", rawPrice: 1320000, tag: "استایل مینیمال", mainImg: "assets/img/products/photo-1523275335684-37898b6baf30-w600.jpg",
    gallery: ["assets/img/products/photo-1523275335684-37898b6baf30-w600.jpg"],
    desc: "ساعت سبک با صفحه ساده و بند چرمی؛ مناسب استایل روزانه و هدیه.",
    specs: ["موتور: کوارتز دقیق", "بند: چرم مصنوعی نرم", "مقاومت: پاشش آب روزمره"]
  },
  {
    id: 32, stock: "order", category: "lifestyle", catName: "خانه و لایف‌استایل", title: "ماساژور گردن بی‌سیم با گرمای ملایم",
    price: "۱,۸۹۰,۰۰۰", rawPrice: 1890000, tag: "پیشنهاد خرید", mainImg: "assets/img/products/photo-1608571423902-eed4a5ad8108-w600.jpg",
    gallery: ["assets/img/products/photo-1608571423902-eed4a5ad8108-w600.jpg"],
    desc: "ماساژور قابل حمل برای رفع خستگی گردن و شانه با چند حالت لرزش.",
    specs: ["۴ حالت ماساژ", "گرمای ملایم قابل تنظیم", "باتری شارژی با Type-C"]
  }
];

const specialOfferProduct = {
  id: 101, category: "special", catName: "تخفیف ویژه", title: "ایرباد بلوتوث ۵.۳ پرو با نویزکنسلینگ فعال",
  price: "۸۹۰,۰۰۰", rawPrice: 890000, oldPrice: "۱,۷۸۰,۰۰۰", discountPercent: 50,
  tag: "تخفیف ویژه ۵۰٪", mainImg: "assets/img/products/photo-1590658268037-6bf12165a8df-w600.jpg",
  gallery: [
    "assets/img/products/photo-1590658268037-6bf12165a8df-w600.jpg",
    "assets/img/products/photo-1600294037681-c80b4cb5b434-w600.jpg",
    "assets/img/products/photo-1572569511254-d8f925fe2cbb-w600.jpg"
  ],
  desc: "ایرباد وایرلس با نویزکنسلینگ فعال (ANC)، صدای بیس عمیق، دکمه لمسی و جعبه شارژ نمایش‌دار؛ پیشنهاد حراج هفته ترندز کارگو.",
  specs: ["نویزکنسلینگ فعال ANC تا ۳۵ دسی‌بل", "باتری: ۶ ساعت پخش + ۲۴ ساعت با کیس شارژ", "مقاومت: ضدتعریق IPX5 با حالت گیم کم‌تاخیر"]
};

/* -------------------------------------------------------------------------- */
/*  TECH NEWS — copied verbatim from the original file                        */
/* -------------------------------------------------------------------------- */

const techNewsList = [
  {
    id: 1,
    category: "گجت‌های پوشیدنی بیومتریک & AI",
    title: "رونمایی از نسل جدید حلقه‌های هوشمند سلامت با هوش مصنوعی و باتری ۱۰ روزه",
    date: "۲۵ آگوست ۲۰۲۶",
    readTime: "زمان مطالعه: ۳ دقیقه",
    img: "assets/img/products/photo-1605100804763-247f67b3557e-w800.jpg",
    badge: "تکنولوژی برتر ۲۰۲۶",
    shortDesc: "پایش پیوسته علائم حیاتی، پایش غیرتهاجمی نوسانات قند خون و سنجش دقیق کیفیت خواب با سنسورهای مینیاتوری تیتانیومی.",
    fullBody: `در سال ۲۰۲۶ حلقه‌های هوشمند به بلوغ کامل رسیده‌اند. سنسورهای نوری جدید قادرند بدون نیاز به سوزن و تنها با تحلیل بازتاب طیف نوری از مویرگ‌های انگشت، داده‌های بیومتریک بدن را به هوش مصنوعی منتقل کنند. فریم تیتانیومی سبک، ضدآب تا عمق ۱۰۰ متری و باتری ۱۰ روزه این گجت را بی‌رقیب ساخته است.`,
    specs: ["جنس بدنه: تیتانیوم گرید ۵ با پوشش DLC", "طول عمر باتری: ۱۰ روز کامل", "سنسورها: PPG پیشرفته و دمای اپیدرمال"]
  },
  {
    id: 2,
    category: "واقعیت افزوده و هوش مصنوعی",
    title: "عینک‌های واقعیت افزوده سبک با نمایشگر MicroLED و ترجمه همزمان ۴۰ زبان",
    date: "۲۰ آگوست ۲۰۲۶",
    readTime: "زمان مطالعه: ۴ دقیقه",
    img: "assets/img/products/photo-1593508512255-86ab42a8e620-w800.jpg",
    badge: "ترند جهانی ۲۰۲۶",
    shortDesc: "ترجمه صوتی و متنی در لحظه روی شیشه شفاف عینک همراه با دستیار هوشمند بصری در وزن ۴۳ گرم.",
    fullBody: `عینک‌های هوشمند ۲۰۲۶ با ترکیب پروژکتورهای میکرولد فوق‌العاده درخشان و تراشه‌های هوش مصنوعی، متن مکالمات زبان‌های خارجی را به صورت زیرنویس زنده روبه‌روی چشمان شما نمایش می‌دهند.`,
    specs: ["نمایشگر: دوگانه Waveguide MicroLED با روشنایی ۲۰۰۰ نیت", "وزن: ۴۳ گرم فوق‌سبک"]
  },
  {
    id: 3,
    category: "تراشه‌های هوش مصنوعی و ابررایانه‌های جیبی",
    title: "پردازنده‌های NPU نسل ۲۰۲۶ با توان پردازش هوش مصنوعی روی خود دستگاه",
    date: "۱۴ آگوست ۲۰۲۶",
    readTime: "زمان مطالعه: ۵ دقیقه",
    img: "assets/img/products/photo-1518770660439-4636190af475-w800.jpg",
    badge: "انفجار هوش مصنوعی",
    shortDesc: "اجرای مدل‌های زبانی روی گوشی و لپ‌تاپ بدون اینترنت، با معماری ۲ نانومتری و مصرف انرژی تا ۴۰٪ کمتر.",
    fullBody: `بزرگ‌ترین تغییر سال ۲۰۲۶ جابه‌جایی پردازش هوش مصنوعی از سرور به جیب شماست. تراشه‌های جدید با واحد پردازش عصبی اختصاصی، مدل‌های زبانی و تصویری را کامل روی دستگاه اجرا می‌کنند؛ یعنی دستیار صوتی، ترجمه، ویرایش تصویر و خلاصه‌سازی متن بدون ارسال داده به ابر انجام می‌شود. نتیجه‌اش دو مزیت انکارناپذیر است: حریم خصوصی کامل و سرعت پاسخ در حد میلی‌ثانیه. معماری ۲ نانومتری همراه با حافظه روی تراشه، مصرف باتری را هم تا ۴۰ درصد نسبت به نسل قبل کاهش داده است.`,
    specs: ["واحد پردازش عصبی: تا ۹۰ ترا عملیات بر ثانیه (TOPS)", "معماری: ۲ نانومتری با حافظه یکپارچه", "حریم خصوصی: پردازش کامل روی دستگاه بدون نیاز به اینترنت"]
  },
  {
    id: 4,
    category: "رباتیک و دستیارهای فیزیکی هوشمند",
    title: "ربات‌های خانگی ۲۰۲۶ با درک بصری کامل و دست‌های پنجه‌ای دقیق",
    date: "۸ آگوست ۲۰۲۶",
    readTime: "زمان مطالعه: ۴ دقیقه",
    img: "assets/img/products/photo-1485827404703-89b55fcc595e-w800.jpg",
    badge: "آینده نزدیک",
    shortDesc: "چیدن میز، جمع‌آوری وسایل و مراقبت از سالمندان با ربات‌های سبک‌وزن مجهز به مدل‌های بصری-زبانی.",
    fullBody: `پس از سال‌ها وعده، ربات‌های خانگی در ۲۰۲۶ به محصول قابل خرید تبدیل شده‌اند. ترکیب مدل‌های بصری-زبانی با دست‌های پنجه‌ای دقیق باعث شده این ربات‌ها فقط دستور ساده را اجرا نکنند، بلکه محیط را بفهمند: ظرف‌ها را داخل ماشین ظرفشویی بچینند، لباس‌ها را تفکیک کنند و داروی سالمندان را در ساعت مشخص تحویل دهند. قیمت‌ها هم به محدوده‌ی محصولات لوکس خانگی رسیده و همین موضوع بازار ۲۰۲۶ را متفاوت کرده است.`,
    specs: ["سنسورها: دوربین عمق‌سنج سه‌بعدی و لیدار ۳۶۰ درجه", "دست‌ها: پنجه چند مفصله با کنترل نیروی میلی‌نیوتونی", "باتری: ۸ ساعت کارکرد پیوسته و شارژ خودکار"]
  }
];

/** Admin-created news (localStorage) is normalized into the same shape as the built-ins. */
function normalizeNewsItem(item, index) {
  const desc = String(item.desc || item.shortDesc || '');
  const fullBody = String(item.fullBody || desc);
  const category = item.category || item.tag || 'اخبار ترندز کارگو';
  const badge = item.badge || item.tag || 'خبر تازه';
  const img = item.img || item.image || item.mainImg || FALLBACK_IMG;
  const specs = Array.isArray(item.specs)
    ? item.specs
    : (item.specs ? [String(item.specs)] : []);
  return {
    id: item.id != null ? item.id : `custom-${index}`,
    category,
    title: item.title || 'خبر بدون عنوان',
    date: item.date || new Date().toLocaleDateString('fa-IR'),
    readTime: item.readTime || 'زمان مطالعه: ۳ دقیقه',
    img,
    badge,
    shortDesc: desc,
    fullBody,
    specs
  };
}

/**
 * Built-in tech reports plus any news added from the admin panel.
 * Keeps the existing `trendcargo_custom_news` key and payload shape intact.
 */
function getTechNews() {
  const stored = Storage.get(STORAGE_KEYS.news, null);
  if (!Array.isArray(stored) || !stored.length) return techNewsList;

  const seen = new Set(techNewsList.map((n) => String(n.id)));
  const extra = stored
    .filter((item) => item && !seen.has(String(item.id)))
    .map(normalizeNewsItem);

  return extra.length ? [...techNewsList, ...extra] : techNewsList;
}

/* -------------------------------------------------------------------------- */
/*  SHARE — WhatsApp / Telegram / Instagram                                   */
/* -------------------------------------------------------------------------- */

const SITE_FALLBACK_URL = 'https://trendkargo.ir/';

/** Canonical, shareable link for a product or a news report. */
function shareLinkFor(kind, id) {
  const base = /^https?:$/.test(location.protocol)
    ? `${location.origin}${location.pathname}`
    : SITE_FALLBACK_URL;
  return `${base}#${kind}-${encodeURIComponent(id)}`;
}

function buildSharePayload(title, url, subtitle) {
  const text = subtitle ? `${title}\n${subtitle}` : title;
  return {
    url,
    text,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    instagram: 'https://instagram.com/trendkargo_style'
  };
}

async function copyShareLink(url) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch { /* fall back to the legacy path below */ }

  try {
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch { return false; }
}

/** Small transient note so sharing always gives visible feedback. */
function floatingNote(message) {
  let note = document.getElementById('share-note');
  if (!note) {
    note = document.createElement('div');
    note.id = 'share-note';
    note.className = 'share-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    document.body.appendChild(note);
  }
  note.textContent = message;
  note.classList.add('active');
  clearTimeout(floatingNote._timer);
  floatingNote._timer = setTimeout(() => note.classList.remove('active'), 2800);
}

function onShareButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const button = event.currentTarget;
  const network = button.dataset.share;
  const payload = buildSharePayload(
    button.dataset.shareTitle || document.title,
    button.dataset.shareUrl || location.href,
    button.dataset.shareExtra || ''
  );

  if (network === 'instagram') {
    copyShareLink(payload.url).then((copied) => {
      window.open(payload.instagram, '_blank', 'noopener');
      floatingNote(copied
        ? 'لینک کپی شد؛ در استوری یا دایرکت اینستاگرام پیست کنید ✅'
        : `اینستاگرام: ${payload.url}`);
    });
    return;
  }

  const isTelegram = network === 'telegram';
  floatingNote(isTelegram ? 'در حال باز کردن تلگرام…' : 'در حال باز کردن واتساپ…');
  window.open(isTelegram ? payload.telegram : payload.whatsapp, '_blank', 'noopener');
}

/** Attaches share behaviour inside a freshly rendered container. */
function wireShareButtons(root) {
  (root || document).querySelectorAll('.share-btn[data-share]').forEach((button) => {
    button.addEventListener('click', onShareButtonClick);
  });
}

/** Pushes the current item's title/link into a modal's share buttons. */
function setShareTargets(container, title, url, subtitle) {
  if (!container) return;
  container.querySelectorAll('.share-btn[data-share]').forEach((button) => {
    button.dataset.shareTitle = title;
    button.dataset.shareUrl = url;
    button.dataset.shareExtra = subtitle || '';
  });
}

/* -------------------------------------------------------------------------- */
/*  REACTIVE STORE                                                            */
/* -------------------------------------------------------------------------- */

const TrendStore = {
  products: [],
  specialOffer: null,
  rates: { ...CURRENCY_CONFIG },

  init() {
    const savedProducts = Storage.get(STORAGE_KEYS.products, null);
    const defaults = (typeof structuredClone === 'function'
      ? structuredClone(top20Products)
      : JSON.parse(JSON.stringify(top20Products)));
    if (Array.isArray(savedProducts) && savedProducts.length) {
      const savedIds = new Set(savedProducts.map((p) => String(p.id)));
      const missingNewDefaults = defaults.filter((p) => p.id >= 21 && !savedIds.has(String(p.id)));
      this.products = savedProducts.map((p) => {
          if (p && typeof p.stock === 'undefined') {
            const d = defaults.find((x) => String(x.id) === String(p.id));
            if (d) return { ...p, stock: d.stock };
          }
          return p;
        }).concat(missingNewDefaults);
    } else {
      this.products = defaults;
    }

    const savedOffer = Storage.get(STORAGE_KEYS.specialOffer, null);
    this.specialOffer = (savedOffer && !Array.isArray(savedOffer))
      ? savedOffer
      : (typeof structuredClone === 'function'
          ? structuredClone(specialOfferProduct)
          : JSON.parse(JSON.stringify(specialOfferProduct)));

    const savedRates = Storage.get(STORAGE_KEYS.rates, CURRENCY_CONFIG);
    this.rates = { ...CURRENCY_CONFIG, ...savedRates };
  },

  saveProducts(list) {
    if (Array.isArray(list)) this.products = list;
    Storage.set(STORAGE_KEYS.products, this.products);
    if (typeof SupabaseStore !== 'undefined' && SupabaseStore.available) {
      SupabaseStore.write('products', this.products);
    }
  },

  saveSpecialOffer(offer) {
    if (offer && typeof offer === 'object') this.specialOffer = offer;
    Storage.set(STORAGE_KEYS.specialOffer, this.specialOffer);
    if (typeof SupabaseStore !== 'undefined' && SupabaseStore.available) {
      SupabaseStore.write('special_offer', this.specialOffer);
    }
  },

  saveRates(next) {
    this.rates = { ...this.rates, ...(next || {}) };
    Storage.set(STORAGE_KEYS.rates, this.rates);
    Storage.set(STORAGE_KEYS.lastRates, this.rates);
    if (typeof SupabaseStore !== 'undefined' && SupabaseStore.available) {
      SupabaseStore.write('rates', this.rates);
    }
  },

  getRate(code) {
    const key = String(code || '').toLowerCase();
    return Number(this.rates.baseRates?.[key] ?? this.rates.baseRates?.usd ?? 188000);
  }
};

/* -------------------------------------------------------------------------- */
/*  THEME                                                                     */
/* -------------------------------------------------------------------------- */

function getPreferredTheme() {
  const saved = Storage.get(STORAGE_KEYS.theme, null);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#07090e' : '#f8fafc');
}

function toggleAppTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  Storage.set(STORAGE_KEYS.theme, next);
}

/* -------------------------------------------------------------------------- */
/*  HEADER CLOCK                                                              */
/* -------------------------------------------------------------------------- */

function updateHeaderClock() {
  const now = new Date();
  const s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();

  const set = (id, deg) => {
    const el = document.getElementById(id);
    if (el) el.style.transform = `rotate(${deg}deg)`;
  };
  set('sec-hand', (s / 60) * 360);
  set('min-hand', ((m + s / 60) / 60) * 360);
  set('hour-hand', (((h % 12) + m / 60) / 12) * 360);

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateEl = document.getElementById('live-gregorian-date');
  if (dateEl) dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const timeEl = document.getElementById('live-digital-time');
  if (timeEl) {
    const pad = (n) => String(n).padStart(2, '0');
    timeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
}

/* -------------------------------------------------------------------------- */
/*  SCROLL REVEAL                                                             */
/* -------------------------------------------------------------------------- */

let revealObserver = null;

function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  }
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));
}

/* -------------------------------------------------------------------------- */
/*  PRODUCT RENDERING                                                         */
/* -------------------------------------------------------------------------- */

function getProductStockGroup(p) {
  return (p && p.stock === 'order') ? 'order' : 'iran';
}

function renderProductGrid(containerId, list) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = Array.isArray(list) ? list : [];
  if (!items.length) {
    container.innerHTML = `
      <div class="products-empty-state">
        <div class="products-empty-icon">🔎</div>
        <h3>محصولی با این مشخصات پیدا نشد</h3>
        <p>عبارت جستجو را پاک کنید یا دسته دیگری را انتخاب کنید.</p>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'product-card reveal';
    card.dataset.productId = p.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.setProperty('--reveal-delay', `${Math.min(i * 40, 400)}ms`);

    const img = (p.gallery && p.gallery[0]) || p.mainImg || FALLBACK_IMG;
    const safeTitle = escapeHTML(p.title);
    const safeDesc = escapeHTML((p.desc || '').slice(0, 78));

    card.innerHTML = `
      <span class="product-tag">${escapeHTML(p.tag || '')}</span>
      <div class="product-img-box">
        <img src="${escapeHTML(img)}" alt="${safeTitle}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
      </div>
      <span class="product-category">${escapeHTML(p.catName || '')}</span>
      <h3 class="product-title">${safeTitle}</h3>
      <p class="product-desc">${safeDesc}…</p>
      <div class="product-footer">
        <div class="product-price">
          ${p.oldPrice ? `<del>${escapeHTML(p.oldPrice)}</del>` : ''}
          ${escapeHTML(p.price)} <span>تومان</span>
        </div>
        <button class="btn-quick-view" type="button" aria-label="مشاهده ${safeTitle}">
          مشاهده
        </button>
      </div>
      <div class="share-row share-row-compact" role="group" aria-label="اشتراک‌گذاری این محصول">
        <span class="share-label">اشتراک‌گذاری</span>
        <button type="button" class="share-btn share-wa" data-share="whatsapp"
                data-share-title="محصول «${safeTitle}» در ترندز کارگو"
                data-share-url="${escapeHTML(shareLinkFor('product', p.id))}"
                data-share-extra="${escapeHTML(p.price)} تومان" aria-label="اشتراک‌گذاری در واتساپ" title="واتساپ">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.1-.3 0-.4.1-.6.1-.1.4-.5.6-.7.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .2.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.5c-1.6 0-3.2-.4-4.6-1.2l-3.2.8.9-3.1A9.4 9.4 0 0 1 2.5 12C2.5 6.8 6.8 2.5 12 2.5S21.5 6.8 21.5 12 17.2 21.5 12 21.5zm0-20.5C5.9 1 1 5.9 1 12c0 1.9.5 3.8 1.5 5.4L1 23l5.7-1.5c1.6.9 3.4 1.3 5.3 1.3 6.1 0 11-4.9 11-11S18.1 1 12 1z"/></svg>
        </button>
        <button type="button" class="share-btn share-tg" data-share="telegram"
                data-share-title="محصول «${safeTitle}» در ترندز کارگو"
                data-share-url="${escapeHTML(shareLinkFor('product', p.id))}"
                data-share-extra="${escapeHTML(p.price)} تومان" aria-label="اشتراک‌گذاری در تلگرام" title="تلگرام">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.4 12.9 3 11.5c-1-.3-1-1 .2-1.4l17.3-6.7c.8-.3 1.5.2 1.4.9z"/></svg>
        </button>
        <button type="button" class="share-btn share-ig" data-share="instagram"
                data-share-title="محصول «${safeTitle}» در ترندز کارگو"
                data-share-url="${escapeHTML(shareLinkFor('product', p.id))}"
                data-share-extra="${escapeHTML(p.price)} تومان" aria-label="اشتراک‌گذاری در اینستاگرام" title="اینستاگرام">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM18.4 6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
        </button>
      </div>
    `;

    const open = () => openProductModal(p.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    wireShareButtons(card);

    frag.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(frag);
}

function renderProducts() {
  renderProductGrid('products-container-iran', TrendStore.products.filter((p) => getProductStockGroup(p) === 'iran'));
  renderProductGrid('products-container-order', TrendStore.products.filter((p) => getProductStockGroup(p) === 'order'));
  observeReveals();
}

function filterProductsByClientSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return renderProducts();
  const filtered = TrendStore.products.filter((p) =>
    (p.title && p.title.toLowerCase().includes(q)) ||
    (p.catName && p.catName.toLowerCase().includes(q)) ||
    (p.tag && p.tag.toLowerCase().includes(q))
  );
  renderProductGrid('products-container-iran', filtered.filter((p) => getProductStockGroup(p) === 'iran'));
  renderProductGrid('products-container-order', filtered.filter((p) => getProductStockGroup(p) === 'order'));
  observeReveals();
}

/*  PRODUCT MODAL                                                             */
/* -------------------------------------------------------------------------- */

let modalBackdrop = null;

function openProductModal(productId) {
  const product = TrendStore.products.find((p) => p.id === productId) ||
                  (TrendStore.specialOffer && TrendStore.specialOffer.id === productId
                    ? TrendStore.specialOffer : null);
  if (!product) return;

  modalBackdrop = modalBackdrop || document.getElementById('product-modal-backdrop');
  if (!modalBackdrop) return;

  const images = ((product.gallery && product.gallery.length ? product.gallery : [product.mainImg]) || []).filter(Boolean);
  if (!images.length) images.push(FALLBACK_IMG);

  const mainImg = document.getElementById('modal-main-image');
  mainImg.src = images[0];
  mainImg.alt = product.title || '';
  mainImg.onerror = () => { mainImg.onerror = null; mainImg.src = FALLBACK_IMG; };

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText('modal-badge-tag', product.tag || '');
  setText('modal-cat-name', product.catName || '');
  setText('modal-title', product.title || '');
  setText('modal-desc', product.desc || '');

  const priceEl = document.getElementById('modal-price');
  if (priceEl) {
    priceEl.innerHTML = `
      ${product.oldPrice ? `<del>${escapeHTML(product.oldPrice)}</del> ` : ''}
      ${escapeHTML(product.price)} <span>تومان</span>`;
  }

  const thumbs = document.getElementById('modal-thumbnails-container');
  if (thumbs) {
    thumbs.innerHTML = images.map((src, i) => `
      <button class="modal-thumb ${i === 0 ? 'active' : ''}" type="button"
              data-src="${escapeHTML(src)}" aria-label="تصویر ${i + 1}">
        <img src="${escapeHTML(src)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
      </button>`).join('');

    thumbs.querySelectorAll('.modal-thumb').forEach((btn) => {
      btn.addEventListener('click', () => {
        mainImg.src = btn.dataset.src;
        thumbs.querySelectorAll('.modal-thumb').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  const specsList = document.getElementById('modal-specs-list');
  if (specsList) {
    specsList.innerHTML = (product.specs || []).map((s) => `<li>${escapeHTML(s)}</li>`).join('');
  }

  const waBtn = document.getElementById('modal-wa-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(
      `سلام ترندز کارگو 👋\nدرخواست ثبت سفارش «${product.title}» (کد ${product.id}) به مبلغ ${product.price} تومان را دارم.`
    );
  }

  const shareEl = document.getElementById('product-modal-share');
  setShareTargets(
    shareEl,
    `محصول «${product.title}» در ترندز کارگو`,
    shareLinkFor('product', product.id),
    `${product.price} تومان — ${product.catName || ''}`
  );
  wireShareButtons(shareEl);

  modalBackdrop.classList.add('active');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeProductModal(event) {
  if (event && event.target !== modalBackdrop &&
      !event.target.closest('.modal-close-btn')) return;
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

/* -------------------------------------------------------------------------- */
/*  SPECIAL OFFER                                                             */
/* -------------------------------------------------------------------------- */

function renderSpecialOffer() {
  const container = document.getElementById('special-offer-container');
  const offer = TrendStore.specialOffer;
  if (!container || !offer) return;

  const img = (offer.gallery && offer.gallery[0]) || offer.mainImg || FALLBACK_IMG;
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(
    `سلام ترندز کارگو 👋\nدرخواست ثبت سفارش تخفیف ویژه «${offer.title}» به مبلغ ${offer.price} تومان را دارم.`
  );

  container.innerHTML = `
    <div class="special-offer-card reveal">
      <div class="special-offer-media" data-product-id="${Number(offer.id)}">
        <img src="${escapeHTML(img)}" alt="${escapeHTML(offer.title)}" loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        ${offer.discountPercent ? `<span class="discount-ring">${toFaDigits(offer.discountPercent)}٪</span>` : ''}
      </div>
      <div class="special-offer-body">
        <span class="special-offer-badge">🔥 ${escapeHTML(offer.tag || 'تخفیف ویژه')}</span>
        <h3 class="special-offer-title" data-product-id="${Number(offer.id)}">${escapeHTML(offer.title || '')}</h3>
        <p class="special-offer-desc">${escapeHTML(offer.desc || '')}</p>
        <div class="special-price-row">
          ${offer.oldPrice ? `<del>${escapeHTML(offer.oldPrice)}</del>` : ''}
          <span class="special-price">${escapeHTML(offer.price)} <small>تومان</small></span>
        </div>
        <a href="${wa}" target="_blank" rel="noopener noreferrer" class="btn-primary special-offer-cta">
          <span>سفارش با تخفیف</span>
        </a>
      </div>
    </div>`;

  container.querySelectorAll('[data-product-id]').forEach((el) => {
    el.addEventListener('click', () => openProductModal(Number(el.dataset.productId)));
  });
  observeReveals();
}

/* -------------------------------------------------------------------------- */
/*  TECH NEWS                                                                 */
/* -------------------------------------------------------------------------- */

/** تعداد پیش‌فرض خبرهای نمایشی؛ بقیه با دکمه «نمایش اخبار بیشتر» باز می‌شوند. */
const NEWS_DEFAULT_LIMIT = 3;
let newsExpanded = false;

function renderTechNews() {
  const container = document.getElementById('tech-news-container');
  if (!container) return;

  const all = getTechNews();
  const visible = (!newsExpanded && NEWS_DEFAULT_LIMIT > 0 && all.length > NEWS_DEFAULT_LIMIT)
    ? all.slice(0, NEWS_DEFAULT_LIMIT)
    : all;

  container.innerHTML = visible.map((n) => {
    const shareUrl = shareLinkFor('news', n.id);
    const shareTitle = n.title;
    return `
    <article class="tech-card reveal" data-news-id="${escapeHTML(String(n.id))}" tabindex="0" role="button">
      <div class="tech-card-img">
        <img src="${escapeHTML(n.img)}" alt="${escapeHTML(n.title)}" loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        <span class="tech-badge">${escapeHTML(n.badge)}</span>
      </div>
      <div class="tech-card-body">
        <span class="tech-cat">${escapeHTML(n.category)}</span>
        <h3 class="tech-title">${escapeHTML(n.title)}</h3>
        <p class="tech-desc">${escapeHTML(n.shortDesc)}</p>
        <span class="btn-view-news">مشاهده گزارش کامل</span>
        <div class="share-row share-row-sm" role="group" aria-label="اشتراک‌گذاری این خبر">
          <button type="button" class="share-btn share-wa" data-share="whatsapp"
            data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
            data-share-extra="${escapeHTML(n.shortDesc)}" aria-label="اشتراک‌گذاری در واتساپ" title="واتساپ">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.1-.3 0-.4.1-.6.1-.1.4-.5.6-.7.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .2.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.5c-1.6 0-3.2-.4-4.6-1.2l-3.2.8.9-3.1A9.4 9.4 0 0 1 2.5 12C2.5 6.8 6.8 2.5 12 2.5S21.5 6.8 21.5 12 17.2 21.5 12 21.5zm0-20.5C5.9 1 1 5.9 1 12c0 1.9.5 3.8 1.5 5.4L1 23l5.7-1.5c1.6.9 3.4 1.3 5.3 1.3 6.1 0 11-4.9 11-11S18.1 1 12 1z"/></svg>
          </button>
          <button type="button" class="share-btn share-tg" data-share="telegram"
            data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
            data-share-extra="${escapeHTML(n.shortDesc)}" aria-label="اشتراک‌گذاری در تلگرام" title="تلگرام">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.4 12.9 3 11.5c-1-.3-1-1 .2-1.4l17.3-6.7c.8-.3 1.5.2 1.4.9z"/></svg>
          </button>
          <button type="button" class="share-btn share-ig" data-share="instagram"
            data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
            data-share-extra="${escapeHTML(n.shortDesc)}" aria-label="اشتراک‌گذاری در اینستاگرام" title="اینستاگرام">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM18.4 6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
          </button>
        </div>
      </div>
    </article>`;
  }).join('');

  container.querySelectorAll('[data-news-id]').forEach((card) => {
    const open = () => openNewsModal(card.dataset.newsId);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.share-btn')) return;
      open();
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  wireShareButtons(container);
  observeReveals();
  updateNewsMoreButton(all.length, visible.length);
}

function updateNewsMoreButton(total, shown) {
  const wrap = document.getElementById('news-more-wrap');
  const btn = document.getElementById('news-show-more');
  if (!wrap || !btn) return;

  if (newsExpanded || total <= shown || total <= NEWS_DEFAULT_LIMIT) {
    wrap.hidden = true;
    return;
  }
  const rest = total - shown;
  btn.innerHTML = `<span>نمایش اخبار بیشتر (${toFaDigits(String(rest))} خبر دیگر)</span>`;
  btn.onclick = () => {
    newsExpanded = true;
    renderTechNews();
  };
  wrap.hidden = false;
}

function openNewsModal(newsId) {
  const news = getTechNews().find((n) => String(n.id) === String(newsId));
  const modal = document.getElementById('news-modal-backdrop');
  if (!news || !modal) return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const imgEl = document.getElementById('news-modal-img');
  if (imgEl) imgEl.src = news.img;
  setText('news-modal-cat', news.category);
  setText('news-modal-date', news.date);
  setText('news-modal-readtime', news.readTime);
  setText('news-modal-title', news.title);
  setText('news-modal-body', news.fullBody);

  const specsEl = document.getElementById('news-modal-specs');
  if (specsEl) {
    specsEl.innerHTML = `
      <h4>ویژگیهای کلیدی:</h4>
      <ul>${(news.specs || []).map((s) => `<li>${escapeHTML(s)}</li>`).join('')}</ul>`;
  }

  const shareEl = document.getElementById('news-modal-share');
  setShareTargets(shareEl, news.title, shareLinkFor('news', news.id), news.shortDesc);
  wireShareButtons(shareEl);

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeNewsModal(event) {
  const modal = document.getElementById('news-modal-backdrop');
  if (!modal) return;
  if (event && event.target !== modal && !event.target.closest('.modal-close-btn')) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

/* -------------------------------------------------------------------------- */
/*  COUNTDOWN                                                                 */
/* -------------------------------------------------------------------------- */

function startFlashCountdown() {
  const h = document.getElementById('hours');
  const m = document.getElementById('minutes');
  const s = document.getElementById('seconds');
  if (!h || !m || !s) return;

  const tick = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    let diff = Math.max(0, Math.floor((end - now) / 1000));
    const hh = Math.floor(diff / 3600); diff %= 3600;
    const mm = Math.floor(diff / 60);
    const ss = diff % 60;
    h.textContent = toFaDigits(String(hh).padStart(2, '0'));
    m.textContent = toFaDigits(String(mm).padStart(2, '0'));
    s.textContent = toFaDigits(String(ss).padStart(2, '0'));
  };
  tick();
  setInterval(tick, 1000);
}

/* -------------------------------------------------------------------------- */
/*  LIVE TOASTS                                                               */
/* -------------------------------------------------------------------------- */

function startLiveToasts() {
  const toast = document.getElementById('live-toast');
  if (!toast) return;

  const messages = [
    { user: 'پشتیبانی ترندز کارگو', action: 'آنلاین هستیم — همه‌روزه ۹ الی ۲۳' },
    { user: 'ارسال اکسپرس تیپاکس',  action: 'از هاب تبریز با بارکد پیامکی' },
    { user: 'بازرسی در ایروان',     action: 'تست سلامت کالا قبل از ورود به ایران' },
    { user: 'تخفیف ویژه امروز',     action: 'پیشنهاد حراج را ببینید' }
  ];

  const uEl = document.getElementById('toast-user');
  const aEl = document.getElementById('toast-action');
  let i = 0;

  const show = () => {
    const msg = messages[i];
    if (uEl) uEl.textContent = msg.user;
    if (aEl) aEl.textContent = msg.action;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 6000);
    i = (i + 1) % messages.length;
  };

  setTimeout(show, 4000);
  setInterval(show, 15000);
}

/* -------------------------------------------------------------------------- */
/*  TESTIMONIALS                                                              */
/* -------------------------------------------------------------------------- */

const defaultTestimonials = [
  { id: 1, name: 'سارا محمدی', city: 'تبریز', rating: 5, text: 'هودی دقیقاً مطابق عکس بود و بسته‌بندی تمیزی داشت.', date: '۱۴۰۴/۰۵/۱۲', verified: true, approved: true },
  { id: 2, name: 'علی رضایی', city: 'تهران', rating: 5, text: 'گجت سالم به دستم رسید؛ تست ایروان خیال آدم را راحت می‌کند.', date: '۱۴۰۴/۰۴/۲۸', verified: true, approved: true },
  { id: 3, name: 'مریم اکبری', city: 'اصفهان', rating: 5, text: 'قیمت نهایی شفاف بود و پاسخگویی واتساپ سریع انجام شد.', date: '۱۴۰۴/۰۴/۱۵', verified: true, approved: true },
  { id: 4, name: 'حسین نوری', city: 'مشهد', rating: 4, text: 'سفارش کمی دیر رسید، اما پشتیبانی مرتب پیگیری کرد.', date: '۱۴۰۴/۰۳/۲۲', verified: true, approved: true },
  { id: 5, name: 'نگار کریمی', city: 'شیراز', rating: 5, text: 'کتونی هم زیبا بود هم اندازه‌اش درست درآمد. راضی‌ام.', date: '۱۴۰۴/۰۳/۱۰', verified: true, approved: true },
  { id: 6, name: 'امیر تهرانی', city: 'کرج', rating: 5, text: 'دومین سفارشم بود و مثل دفعه قبل بدون دردسر تحویل شد.', date: '۱۴۰۴/۰۲/۲۶', verified: true, approved: true },
  { id: 7, name: 'الهام کریمی', city: 'رشت', rating: 5, text: 'سایز لباس درست بود و زمان تحویل هم طبق اعلام سایت بود.', date: '۱۴۰۴/۰۲/۱۸', verified: true, approved: true },
  { id: 8, name: 'رضا احمدی', city: 'قم', rating: 4, text: 'برای خرید اول تجربه خوبی بود؛ مراحل سفارش واضح بود.', date: '۱۴۰۴/۰۲/۰۹', verified: true, approved: true },
  { id: 9, name: 'نسترن حیدری', city: 'کرمان', rating: 5, text: 'کیفیت محصول بهتر از چیزی بود که انتظار داشتم.', date: '۱۴۰۴/۰۱/۲۷', verified: true, approved: true },
  { id: 10, name: 'محمد مرادی', city: 'اهواز', rating: 5, text: 'بسته سالم و مرتب رسید؛ دوباره از همین مسیر خرید می‌کنم.', date: '۱۴۰۴/۰۱/۱۸', verified: true, approved: true }
];

function getTestimonials() {
  const stored = Storage.get(STORAGE_KEYS.testimonials, null);
  if (Array.isArray(stored) && stored.length >= defaultTestimonials.length) return stored;
  if (Array.isArray(stored) && stored.length) {
    const existingIds = new Set(stored.map((testimonial) => testimonial.id));
    const missing = defaultTestimonials.filter((testimonial) => !existingIds.has(testimonial.id));
    const merged = stored.concat(missing).slice(0, defaultTestimonials.length);
    Storage.set(STORAGE_KEYS.testimonials, merged);
    return merged;
  }
  Storage.set(STORAGE_KEYS.testimonials, defaultTestimonials);
  return defaultTestimonials;
}

function saveTestimonials(list) {
  Storage.set(STORAGE_KEYS.testimonials, list);
  if (typeof SupabaseStore !== 'undefined' && SupabaseStore.available && window.SUPABASE_SERVICE_KEY) {
    SupabaseStore.write('testimonials', list);
  }
}

function renderTestimonials() {
  const track = document.getElementById('testimonials-track');
  const dots = document.getElementById('testimonial-dots');
  if (!track) return;

  const approved = getTestimonials().filter((t) => t.approved !== false);

  track.innerHTML = approved.map((t, i) => {
    const initials = String(t.name || 'ک').trim().charAt(0);
    const rating = Math.min(5, Math.max(0, t.rating || 5));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const shareUrl = shareLinkFor('testimonial', t.id != null ? t.id : i);
    const shareTitle = `تجربه خرید «${t.name || 'مشتری'}» از ترندز کارگو`;
    const shareExtra = String(t.text || '').slice(0, 120);
    return `
      <article class="testimonial-card reveal" style="--reveal-delay:${i * 60}ms">
        <div class="testimonial-header">
          <div class="testimonial-avatar">${escapeHTML(initials)}</div>
          <div class="testimonial-info">
            <div class="testimonial-name">${escapeHTML(t.name || 'کاربر')}</div>
            <div class="testimonial-city">📍 ${escapeHTML(t.city || '')}</div>
          </div>
          <div class="testimonial-stars" aria-label="امتیاز ${rating} از ۵">${stars}</div>
        </div>
        <p class="testimonial-text">${escapeHTML(t.text || '')}</p>
        ${t.verified ? '<span class="testimonial-verified">✓ خرید تأیید شده</span>' : ''}
        <div class="testimonial-foot">
          <div class="testimonial-date">${escapeHTML(t.date || '')}</div>
          <div class="share-row share-row-sm" role="group" aria-label="اشتراک‌گذاری این نظر">
            <button type="button" class="share-btn share-wa" data-share="whatsapp"
              data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
              data-share-extra="${escapeHTML(shareExtra)}" aria-label="اشتراک‌گذاری در واتساپ" title="واتساپ">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.1-.3 0-.4.1-.6.1-.1.4-.5.6-.7.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .2.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.5c-1.6 0-3.2-.4-4.6-1.2l-3.2.8.9-3.1A9.4 9.4 0 0 1 2.5 12C2.5 6.8 6.8 2.5 12 2.5S21.5 6.8 21.5 12 17.2 21.5 12 21.5zm0-20.5C5.9 1 1 5.9 1 12c0 1.9.5 3.8 1.5 5.4L1 23l5.7-1.5c1.6.9 3.4 1.3 5.3 1.3 6.1 0 11-4.9 11-11S18.1 1 12 1z"/></svg>
            </button>
            <button type="button" class="share-btn share-tg" data-share="telegram"
              data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
              data-share-extra="${escapeHTML(shareExtra)}" aria-label="اشتراک‌گذاری در تلگرام" title="تلگرام">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.4 12.9 3 11.5c-1-.3-1-1 .2-1.4l17.3-6.7c.8-.3 1.5.2 1.4.9z"/></svg>
            </button>
            <button type="button" class="share-btn share-ig" data-share="instagram"
              data-share-title="${escapeHTML(shareTitle)}" data-share-url="${escapeHTML(shareUrl)}"
              data-share-extra="${escapeHTML(shareExtra)}" aria-label="اشتراک‌گذاری در اینستاگرام" title="اینستاگرام">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM18.4 6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  if (dots) {
    dots.innerHTML = approved.map((_, i) =>
      `<button class="testimonial-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="نظر ${toFaDigits(i + 1)}"></button>`
    ).join('');
    dots.querySelectorAll('.testimonial-dot').forEach((dot) => {
      dot.addEventListener('click', () => goToTestimonial(Number(dot.dataset.index)));
    });
  }

  wireShareButtons(track);
  observeReveals();
}

/* -------------------------------------------------------------------------- */
/*  TESTIMONIAL SLIDER — RTL-safe, data-driven navigation                     */
/* -------------------------------------------------------------------------- */

const testimonialSlider = { index: 0 };

function playHaptic() {
  if (navigator.vibrate) navigator.vibrate(8);
}

/** Disables an arrow once the slider reaches that end of the list. */
function updateTestimonialArrows() {
  const track = document.getElementById('testimonials-track');
  const prev = document.getElementById('testimonial-prev');
  const next = document.getElementById('testimonial-next');
  if (!track) return;

  const total = track.querySelectorAll('.testimonial-card').length;
  if (prev) { prev.disabled = total < 2; prev.setAttribute('aria-disabled', String(total < 2)); }
  if (next) { next.disabled = total < 2; next.setAttribute('aria-disabled', String(total < 2)); }
}

/**
 * Centres a slide in the viewport without assuming a writing direction.
 * Browsers disagree on how `scrollLeft` behaves in RTL (Chrome/Safari count
 * negative, older engines reverse the sign), so computing an absolute
 * `scrollLeft` is unreliable — it makes the arrows appear dead in RTL because
 * a positive target gets clamped back to 0. Instead we measure the visual
 * distance between the card and the track centre and let `scrollBy` apply it,
 * which is correct in both LTR and RTL and never scrolls the page vertically.
 */
function scrollTestimonialIntoView(track, index, smooth = true) {
  const card = track.querySelectorAll('.testimonial-card')[index];
  if (!card) return;

  const trackRect = track.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const delta = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);

  if (Math.abs(delta) < 1) return;

  // `scroll-snap-type: x mandatory` also applies to programmatic scrolling, and
  // in RTL engines the mandatory snap re-resolves against the *previous* snap
  // point as soon as the smooth scroll starts — the track is yanked straight
  // back to where it began, which is exactly why the arrows looked broken.
  // Snap is switched off for the duration of the animation and restored once the
  // scroll has settled, then the slider state is re-synced from the real
  // position so the dots and arrow states can never drift out of step.
  track.classList.add('is-programmatic-scroll');
  track.scrollBy({ left: delta, behavior: smooth ? 'smooth' : 'auto' });

  clearTimeout(scrollTestimonialIntoView._timer);
  scrollTestimonialIntoView._timer = setTimeout(() => {
    track.classList.remove('is-programmatic-scroll');
    if (smooth) syncTestimonialState(track);
  }, smooth ? 560 : 90);
}

/** Re-derives the active slide from the real scroll position. */
function syncTestimonialState(track) {
  const target = track || document.getElementById('testimonials-track');
  if (!target) return;

  testimonialSlider.index = currentTestimonialIndex(target);
  document.querySelectorAll('.testimonial-dot').forEach((dot, i) =>
    dot.classList.toggle('active', i === testimonialSlider.index));
  updateTestimonialArrows();
}

/**
 * Index of the slide closest to the viewport centre, measured with
 * `getBoundingClientRect` so it is correct in both LTR and RTL.
 */
function currentTestimonialIndex(track) {
  const cards = track.querySelectorAll('.testimonial-card');
  if (!cards.length) return 0;

  const trackRect = track.getBoundingClientRect();
  const centre = trackRect.left + trackRect.width / 2;

  let bestIndex = 0;
  let bestDistance = Infinity;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - centre);
    if (distance < bestDistance) { bestDistance = distance; bestIndex = i; }
  });
  return bestIndex;
}

function goToTestimonial(index) {
  const track = document.getElementById('testimonials-track');
  if (!track) return;
  const cards = track.querySelectorAll('.testimonial-card');
  if (!cards.length) return;

  const target = Math.min(Math.max(0, index), cards.length - 1);
  testimonialSlider.index = target;

  scrollTestimonialIntoView(track, target);
  playHaptic();

  document.querySelectorAll('.testimonial-dot').forEach((dot, i) =>
    dot.classList.toggle('active', i === target));
  updateTestimonialArrows();
}

/** `step` is +1 for the next review and -1 for the previous one (RTL reading order). */
function moveTestimonial(step) {
  const total = document.querySelectorAll('#testimonials-track .testimonial-card').length;
  if (total < 2) return;
  goToTestimonial((testimonialSlider.index + step + total) % total);
}

function initTestimonialsSlider() {
  const track = document.getElementById('testimonials-track');
  const prev = document.getElementById('testimonial-prev');
  const next = document.getElementById('testimonial-next');
  if (!track) return;

  testimonialSlider.index = 0;
  if (track.dataset.sliderReady === 'true') {
    updateTestimonialArrows();
    return;
  }
  track.dataset.sliderReady = 'true';

  // Touch/mouse dragging is handled natively by overflow scrolling; this keeps
  // the dots and arrow states in sync with the user's own swipes. Updates are
  // skipped mid-animation so a programmatic scroll cannot have its target index
  // overwritten by an intermediate frame.
  track.addEventListener('scroll', debounce(() => {
    if (track.classList.contains('is-programmatic-scroll')) return;
    syncTestimonialState(track);
  }, 80), { passive: true });

  if (prev) prev.addEventListener('click', () => moveTestimonial(-1));
  if (next) next.addEventListener('click', () => moveTestimonial(1));

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveTestimonial(1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveTestimonial(-1); }
  });

  window.addEventListener('resize', debounce(() => {
    scrollTestimonialIntoView(track, testimonialSlider.index, false);
  }, 150));

  updateTestimonialArrows();
}

function initTestimonialForm() {
  const modal = document.getElementById('testimonial-modal');
  const form = document.getElementById('testimonial-form');
  const openBtn = document.getElementById('btn-open-testimonial-form');
  const closeBtn = document.getElementById('btn-close-testimonial-modal');
  const stars = document.querySelectorAll('.star-btn');
  const ratingInput = document.getElementById('testimonial-rating');
  if (!modal || !form) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  stars.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = Number(btn.dataset.value);
      if (ratingInput) ratingInput.value = v;
      stars.forEach((b) => b.classList.toggle('active', Number(b.dataset.value) <= v));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('testimonial-name')?.value || '').trim();
    const city = (document.getElementById('testimonial-city')?.value || '').trim();
    const text = (document.getElementById('testimonial-text')?.value || '').trim();
    const rating = Number(ratingInput?.value) || 5;

    if (text.length < 20) {
      alert('متن نظر باید حداقل ۲۰ کاراکتر باشد.');
      return;
    }

    const list = getTestimonials();
    list.unshift({
      id: Date.now(),
      name, city, text, rating,
      date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      verified: false,
      approved: false
    });
    saveTestimonials(list);

    form.reset();
    stars.forEach((b) => b.classList.toggle('active', Number(b.dataset.value) <= 5));
    if (ratingInput) ratingInput.value = 5;
    closeModal();

    const toast = document.getElementById('live-toast');
    if (toast) {
      const uEl = document.getElementById('toast-user');
      const aEl = document.getElementById('toast-action');
      if (uEl) uEl.textContent = 'نظر شما ثبت شد';
      if (aEl) aEl.textContent = 'پس از تأیید تیم پشتیبانی نمایش داده می‌شود';
      toast.classList.add('active');
      setTimeout(() => toast.classList.remove('active'), 6000);
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  CUSTOM ORDER FORM                                                         */
/* -------------------------------------------------------------------------- */

function submitCustomLink() {
  const input = document.getElementById('user-product-link');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    alert('لطفاً ابتدا لینک محصول را وارد کنید.');
    input.focus();
    return;
  }
  const userName = document.getElementById('user-name')?.value.trim() || '';
  const userPhone = document.getElementById('user-phone')?.value.trim() || '';

  // ثبت استعلام در بک‌اند (در صورت در دسترس بودن) — جریان واتساپ متوقف نمی‌شود
  try {
    fetch('api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: val, name: userName, phone: userPhone })
    }).catch(() => {});
  } catch (e) { /* بدون سرور هم ادامه می‌دهیم */ }

  const msg = encodeURIComponent(
    `سلام ترندز کارگو 👋\nلطفاً قیمت تمام‌شده و زمان تحویل این لینک را استعلام بگیرید:\n${val}` +
    (userPhone ? `\nشماره تماس من: ${userPhone}` : '') +
    `\n\n(فرمول شفاف قیمت سایت را دیدم — لطفاً فاکتور بر اساس همان فرمول صادر شود)`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
}

/* -------------------------------------------------------------------------- */
/*  PWA & NOTIFICATIONS                                                       */
/* -------------------------------------------------------------------------- */

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const bar = document.getElementById('pwa-top-bar');
  if (bar) bar.classList.remove('hidden');
});

function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
      deferredPrompt = null;
      closePWABar();
    });
    return;
  }
  const modal = document.getElementById('universal-install-modal');
  if (modal) modal.classList.add('active');
}

function closeInstallModal() {
  const m = document.getElementById('universal-install-modal');
  if (m) { m.classList.remove('active'); m.setAttribute('aria-hidden', 'true'); }
}

function closePWABar() {
  const bar = document.getElementById('pwa-top-bar');
  if (bar) bar.classList.add('hidden');
}

async function enablePushNotifications() {
  if (!('Notification' in window)) {
    alert('مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند.');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    alert('🔔 اعلان‌ها فعال شد! از تخفیف‌های ویژه باخبر می‌شوید.');
    try {
      new Notification('ترندز کارگو', {
        body: 'اعلان‌ها با موفقیت فعال شدند.',
        icon: 'assets/logo.png'
      });
    } catch (err) {
      console.warn('Notification display failed:', err);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  SERVICE WORKER                                                            */
/* -------------------------------------------------------------------------- */

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' &&
      !['localhost', '127.0.0.1'].includes(location.hostname)) return;
  if (!/\/(index\.html)?$/.test(location.pathname)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) =>
      console.warn('[SW] registration failed:', err));
  });
}

/* -------------------------------------------------------------------------- */
/*  ACCORDION                                                                 */
/* -------------------------------------------------------------------------- */

function initAccordion() {
  document.querySelectorAll('.accordion-header').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      if (!item) return;
      const content = item.querySelector('.accordion-content');
      const isOpen = item.classList.toggle('active');
      if (content) content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : '';
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  NAVBAR                                                                    */
/* -------------------------------------------------------------------------- */

function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* -------------------------------------------------------------------------- */
/*  FILTER TABS                                                               */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  VISIT TRACKING (Supabase — بازدید روزانه)                                 */
/* -------------------------------------------------------------------------- */

/**
 * ثبت بازدید روزانهٔ سایت در Supabase.
 * بازدید یکتا با شناسهٔ مرورگر (localStorage) و page_views با هر بارگذاری.
 * fire-and-forget: خطای ردیابی هرگز تجربهٔ کاربر را خراب نمیکند.
 */
function trackDailyVisit() {
  try {
    const visitorId = (() => {
      let id = localStorage.getItem('trendcargo_visitor_id');
      if (!id) {
        id = (crypto.randomUUID)
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('trendcargo_visitor_id', id);
      }
      return id;
    })();

    const url = `${SUPABASE_URL}/rest/v1/rpc/track_visit`;
    const body = JSON.stringify({ p_visitor: visitorId });
    // prefer synchronous XHR (تضمین میکنه تا RPC اجرا بشه و timeoutش به DB برسد)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body);
      return;
    } catch { /* پایین به fallback */ }
    // fallback: sendBeacon
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      } catch { /* ignore */ }
    }
    fetch(url, { method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* ردیابی هرگز نباید سایت را بشکند */ }
}

/* -------------------------------------------------------------------------- */
/*  BOOTSTRAP                                                                 */
/* -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getPreferredTheme());
  TrendStore.init();

  renderProducts();
  renderSpecialOffer();
  renderTechNews();
  renderTestimonials();

  initTestimonialsSlider();
  initTestimonialForm();
  initAccordion();
  initNavbar();

  updateHeaderClock();
  startFlashCountdown();
  startLiveToasts();
  registerServiceWorker();
  RemoteSync.boot();
  // ابتدا بکش از سرور، سپس polling شروع شود
  RemoteSync.pullAll().then(() => { try { RemoteSync.startPolling(); } catch {} });
  trackDailyVisit();



  const preloader = document.getElementById('preloader');
  if (preloader) setTimeout(() => preloader.classList.add('fade-out'), 900);

});

/* -------------------------------------------------------------------------- */
/*  PUBLIC API (for inline HTML handlers)                                     */
/* -------------------------------------------------------------------------- */

window.toggleAppTheme = toggleAppTheme;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.submitCustomLink = submitCustomLink;
window.triggerPWAInstall = triggerPWAInstall;
window.closeInstallModal = closeInstallModal;
window.closePWABar = closePWABar;
window.enablePushNotifications = enablePushNotifications;
window.filterProductsByClientSearch = filterProductsByClientSearch;
