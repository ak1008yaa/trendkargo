
/**
 * ==========================================================================
 * TREND CARGO — PRODUCTION CONTROLLER ENGINE (ES6+ MODULAR)
 * ==========================================================================
 */

const WHATSAPP_NUMBER = "989374443386";
const STORAGE_KEYS = {
  products: 'trendcargo_custom_products',
  news: 'trendcargo_custom_news',
  rates: 'trendcargo_custom_rates',
  theme: 'trendcargo_theme',
  invoices: 'trendcargo_accounting_invoices',
  lastInvoice: 'trendcargo_last_invoice',
  sheetUrl: 'trendcargo_google_sheet_url'
};

// نرخ‌های پایه صرافی و ضریب حاشیه امن
const CURRENCY_CONFIG = {
  baseRates: {
    amd: 170,     // درام ارمنستان
    usd: 188000,  // دلار آمریکا
    try: 5800     // لیر ترکیه
  },
  exchangeSpreadMultiplier: 1.06,
  usdShippingRate: 188000
};

// پایگاه داده ۲۰ محصول وایرال و پرفروش تمو
const top20Products = [
  {
    id: 1, category: "gadget", catName: "گجت و دیجیتال", title: "مینی پرینتر حرارتی جیبی فوممو بدون جوهر",
    price: "۱,۹۸۰,۰۰۰", rawPrice: 1980000, tag: "پرفروش‌ترین تمو", mainImg: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "چاپگر فوری بدون نیاز به تعویض جوهر و ریبون؛ چاپ مستقیم عکس، یادداشت روزانه، استیکر و بارکد از گوشی با بلوتوث.",
    specs: ["فناوری: چاپ حرارتی مستقیم ۲۰۰DPI", "باتری: ۱۰۰۰mAh شارژی با Type-C", "همراه با ۱ رول کاغذ حرارتی برچسب‌دار"]
  },
  {
    id: 2, category: "gadget", catName: "گجت و دیجیتال", title: "شارژر وایرلس ۳ کاره مگنتی تاشو مسافرتی ۱۵W",
    price: "۲,۲۵۰,۰۰۰", rawPrice: 2250000, tag: "ترند تیک‌تاک", mainImg: "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "شارژ همزمان گوشی آیفون/سامسونگ، ساعت هوشمند و ایرپاد در ابعاد یک کیف جیبی کوچک با چیپست هوشمند محافظت باتری.",
    specs: ["توان شارژ: ۱۵W + ۵W + ۳W مگ‌سیف فست", "بدنه آلومینیومی تاشو با روکش سیلیکونی لطیف", "سازگار با سری آیفون ۱۲ تا ۱۶ و سامسونگ"]
  },
  {
    id: 3, category: "gadget", catName: "گجت و دیجیتال", title: "پروژکتور فضانورد کهکشانی با چرخش مگنتی ۳۶۰",
    price: "۱,۸۹۰,۰۰۰", rawPrice: 1890000, tag: "وایرال دکوراسیون", mainImg: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "چراغ خواب پرطرفدار با طرح فضانورد که سقف و دیوارها را به کهکشان پرستاره متحرک با افکت سحابی تبدیل می‌کند.",
    specs: ["سر با چرخش آهنربایی ۳۶۰ درجه آزاد", "۸ افکت نوری سحابی + لیزر سبز ستاره‌ای", "دارای ریموت کنترل بی‌سیم و تایمر خاموشی"]
  },
  {
    id: 4, category: "gadget", catName: "گجت و دیجیتال", title: "جاروشارژی تفنگی توربو و دمنده ۲ کاره ۶۰۰۰Pa",
    price: "۱,۶۵۰,۰۰۰", rawPrice: 1650000, tag: "فوق کاربردی", mainImg: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "جارو برقی پرتابل بی‌سیم با مکش قدرتمند و سری دمنده باد برای تمیز کردن شیار صندلی خودرو و کیبورد.",
    specs: ["قدرت مکش: ۶۰۰۰ پاسکال توربو", "فیلتر قابل شستشو چندبار مصرف HEPA", "باتری ۲۰۰۰mAh با پورت شارژ سریع"]
  },
  {
    id: 5, category: "gadget", catName: "گجت و دیجیتال", title: "چراغ خطی مگنتی سنسوردار هوشمند زیر کابینت",
    price: "۶۸۰,۰۰۰", rawPrice: 680000, tag: "ترند خانه هوشمند", mainImg: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "نورپردازی خطی بی‌سیم با سنسور تشخیص حرکت انسان (PIR) و حسگر تاریکی؛ روشن شدن خودکار با نزدیک شدن.",
    specs: ["طول چراغ: ۴۰ سانتی‌متر", "نصب آسان بدون سیم‌کشی با پد مگنتی چسبی", "باتری شارژی با ماندگاری تا ۳۰ روز"]
  },
  {
    id: 6, category: "lifestyle", catName: "خانه و لایف‌استایل", title: "دستگاه بخور سرد اولتراسونیک با شبیه‌ساز شعله آتش",
    price: "۱,۱۸۰,۰۰۰", rawPrice: 1180000, tag: "آرامش‌بخش و معطر", mainImg: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "رطوبت‌ساز اولتراسونیک که با ترکیب بخار سرد و نورپردازی LED هوشمند، شعله‌های آتشین واقعی خلق می‌کند.",
    specs: ["موتور بی‌صدا کمتر از ۲۸ دسی‌بل", "حالت‌های نوری شعله طلایی و RGB", "خاموشی خودکار با اتمام آب مخزن"]
  },
  {
    id: 7, category: "fashion", catName: "استایل و پوشاک", title: "هودی اورسایز وینتیج سنگین ۱۰۰٪ پنبه اسیدواش",
    price: "۲,۳۵۰,۰۰۰", rawPrice: 2350000, tag: "ترند پینترست", mainImg: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "هودی کلاهدار با بافت ضخیم ۳ نخ و رنگ‌بندی ترند شسته‌شده پینترست، دوخت دولایه صنعتی و فیت آزاد شیک.",
    specs: ["پارچه: ۱۰۰٪ پنبه سوپر سنگین ۳۸۰ گرمی", "سایزبندی: M تا XXL اورسایز", "تضمین رنگ و عدم پرزدهی در شستشو"]
  },
  {
    id: 8, category: "fashion", catName: "استایل و پوشاک", title: "شلوار کارگو بگ استایل ۶ جیب تاکتیکال ضخیم",
    price: "۲,۶۸۰,۰۰۰", rawPrice: 2680000, tag: "استریت ویر", mainImg: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "شلوار استریت ویر با جیب‌های حجیم کارگو، بندهای تنظیم دم‌پا سبک تاکتیکال پرطرفدار در فشن ژاپن.",
    specs: ["جنس: کتان پنبه‌ای گرماژ بالا و سنگ‌شور شده", "سایزبندی: ۳۰ تا ۳۸", "دوخت سه‌سوزنه مقاوم"]
  },
  {
    id: 9, category: "gadget", catName: "گجت و دیجیتال", title: "پاوربانک مگ‌سیف شفاف سایبرپانک ۱۰۰۰۰mAh",
    price: "۲,۴۵۰,۰۰۰", rawPrice: 2450000, tag: "طراحی سایبرپانک", mainImg: "https://images.unsplash.com/photo-1609592426508-cc0272464a7a?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1609592426508-cc0272464a7a?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "پاوربانک شفاف با نمایشگر دیجیتال درصد شارژ و برد الکترونیکی نمایان با قابلیت شارژ بیسیم مغناطیسی.",
    specs: ["ظرفیت باتری: ۱۰۰۰۰ میلی‌آمپر لیتیوم پلیمری", "خروجی باسیم: ۲۲.۵W فست PD", "خروجی مگ‌سیف: ۱۵W"]
  },
  {
    id: 10, category: "lifestyle", catName: "خانه و لایف‌استایل", title: "تراول ماگ ضد نشت استنلس استیل ۴۰ اونسی دسته‌دار",
    price: "۱,۱۵۰,۰۰۰", rawPrice: 1150000, tag: "وایرال استنلی استایل", mainImg: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "ماگ دوجداره استیل ۱.۲ لیتری با دسته ارگونومیک، درب عایق ضد نشت و حفظ دمای یخ تا ۳۰ ساعت.",
    specs: ["گنجایش: ۴۰ اونس (۱۱۸۰ میلی‌لیتر)", "متریال: استیل ضد زنگ دوجداره ۳۰۴ غذایی", "پایه باریک مناسب جا لیوانی خودرو"]
  }
];

// اخبار تکنولوژی ۲۰۲۶
const techNewsList = [
  {
    id: 1,
    category: "گجت‌های پوشیدنی بیومتریک & AI",
    title: "رونمایی از نسل جدید حلقه‌های هوشمند سلامت با هوش مصنوعی و باتری ۱۰ روزه",
    date: "۲۵ آگوست ۲۰۲۶",
    readTime: "زمان مطالعه: ۳ دقیقه",
    img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
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
    img: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80",
    badge: "ترند جهانی ۲۰۲۶",
    shortDesc: "ترجمه صوتی و متنی در لحظه روی شیشه شفاف عینک همراه با دستیار هوشمند بصری در وزن ۴۳ گرم.",
    fullBody: `عینک‌های هوشمند ۲۰۲۶ با ترکیب پروژکتورهای میکرولد فوق‌العاده درخشان و تراشه‌های هوش مصنوعی، متن مکالمات زبان‌های خارجی را به صورت زیرنویس زنده روبه‌روی چشمان شما نمایش می‌دهند.`,
    specs: ["نمایشگر: دوگانه Waveguide MicroLED با روشنایی ۲۰۰۰ نیت", "وزن: ۴۳ گرم فوق‌سبک"]
  }
];

// ==========================================================================
// موتور ذخیره‌سازی داده‌های واکنشی (Reactive Store)
// ==========================================================================
const TrendStore = {
  products: [],
  rates: { ...CURRENCY_CONFIG },

  init() {
    this.products = this.loadStorage(STORAGE_KEYS.products, top20Products);
    this.rates = this.loadStorage(STORAGE_KEYS.rates, CURRENCY_CONFIG);
    const savedRates = this.loadStorage('trendcargo_last_exchange_rates', null);
    if (savedRates && typeof savedRates === 'object') {
      this.rates = { ...this.rates, ...savedRates };
    }
  },

  loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  },

  saveProducts(newProducts) {
    this.products = Array.isArray(newProducts) ? newProducts : this.products;
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(this.products));
    } catch (error) {
      console.warn('Unable to persist product list:', error);
    }
  },

  saveRates(newRates) {
    this.rates = { ...this.rates, ...(newRates || {}) };
    try {
      localStorage.setItem(STORAGE_KEYS.rates, JSON.stringify(this.rates));
      localStorage.setItem('trendcargo_last_exchange_rates', JSON.stringify(this.rates));
    } catch (error) {
      console.warn('Unable to persist exchange rates:', error);
    }
  },

  getRate(code) {
    const key = String(code || '').toLowerCase();
    if (key === 'amd') return Number(this.rates.baseRates?.amd || 170);
    if (key === 'usd') return Number(this.rates.baseRates?.usd || 188000);
    if (key === 'try') return Number(this.rates.baseRates?.try || 5800);
    return Number(this.rates.baseRates?.usd || 188000);
  }
};

TrendStore.init();

async function fetchTgjuLiveRates() {
  const cacheKey = 'trendcargo_tgju_cached_rates';
  const maxAgeMs = 60 * 60 * 1000;
  const now = Date.now();

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.fetchedAt && now - parsed.fetchedAt < maxAgeMs) {
        TrendStore.saveRates(parsed.rates);
        return parsed.rates;
      }
    }
  } catch (error) {
    console.warn('Cached TGJU rates unavailable:', error);
  }

  const endpoints = [
    'https://alanchand.com/media/api',
    'https://alanchand.com/media/api?format=json',
    'https://alanchand.com/currencies-price',
    'https://alanchand.com/media/api?type=currency'
  ];

  try {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) continue;
        const rawText = await response.text();

        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }

        const jsonRate = parsed && typeof parsed === 'object' ? parsed : null;
        const normalize = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || null;

        const extractFromObject = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          for (const key of ['usd', 'dollar', 'dol', 'price_usd', 'usdPrice', 'sell', 'buy', 'price']) {
            if (obj[key] !== undefined && obj[key] !== null && Number(obj[key])) return Number(obj[key]);
          }
          for (const value of Object.values(obj)) {
            if (typeof value === 'number' && value > 5000) return value;
          }
          return null;
        };

        const usdRate = normalize(
          jsonRate?.usd ?? jsonRate?.dollar ?? jsonRate?.price_usd ?? jsonRate?.price ?? jsonRate?.USD ?? extractFromObject(jsonRate)
        ) || 188000;

        const eurRate = normalize(jsonRate?.eur ?? jsonRate?.euro ?? jsonRate?.EUR) || usdRate * 1.04;
        const tryRate = normalize(jsonRate?.try ?? jsonRate?.tl ?? jsonRate?.TRY) || 5800;
        const amdRate = normalize(jsonRate?.amd ?? jsonRate?.dram ?? jsonRate?.AMD) || 170;

        const nextRates = {
          baseRates: {
            usd: usdRate,
            eur: eurRate,
            try: tryRate,
            amd: amdRate
          },
          exchangeSpreadMultiplier: TrendStore.rates.exchangeSpreadMultiplier || 1.06,
          usdShippingRate: TrendStore.rates.usdShippingRate || 188000
        };

        TrendStore.saveRates(nextRates);
        localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: now, rates: nextRates }));
        return nextRates;
      } catch (innerError) {
        console.warn('Attempt to fetch ALANCHAND failed:', endpoint, innerError);
      }
    }

    return TrendStore.rates;
  } catch (error) {
    console.warn('Unable to fetch live rates:', error);
    return TrendStore.rates;
  }
}

function getAccountingTemplates() {
  return [
    { id: 'invoice', title: 'فاکتور', icon: '🧾' },
    { id: 'ledger', title: 'دفتر حساب', icon: '📒' },
    { id: 'summary', title: 'گزارش', icon: '📊' }
  ];
}

function saveAccountingInvoice(entry) {
  const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices) || '[]');
  const payload = {
    id: entry.id || `INV-${Date.now()}`,
    customer: entry.customer || 'مشتری',
    phone: entry.phone || '-',
    product: entry.product || 'محصول',
    amount: Number(entry.amount || 0),
    currency: String(entry.currency || 'usd').toUpperCase(),
    rate: Number(entry.rate || 0),
    shipping: Number(entry.shipping || 0),
    total: Number(entry.total || 0),
    status: entry.status || 'pending',
    createdAt: new Date().toISOString()
  };

  invoices.unshift(payload);
  localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices.slice(0, 50)));
  localStorage.setItem(STORAGE_KEYS.lastInvoice, JSON.stringify(payload));

  const sheetUrl = localStorage.getItem(STORAGE_KEYS.sheetUrl);
  if (sheetUrl) {
    fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appendInvoice', data: payload })
    }).catch(() => {});
  }

  return payload;
}

function loadAccountingInvoices() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices) || '[]');
  } catch {
    return [];
  }
}

// ==========================================================================
// کنترلر تم روز و شب (Day & Night Mode)
// ==========================================================================
function getPreferredTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch (error) {
    console.warn('Theme preference is unavailable:', error);
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

function initAppTheme() {
  const theme = getPreferredTheme();
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleAppTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  try {
    localStorage.setItem(STORAGE_KEYS.theme, newTheme);
  } catch (error) {
    console.warn('Unable to save theme preference:', error);
  }
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

// ==========================================================================
// ساعت آنالوگ و دیجیتال زنده هدر
// ==========================================================================
function updateHeaderClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  const secDeg = (seconds / 60) * 360;
  const minDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  const secHand = document.getElementById('sec-hand');
  const minHand = document.getElementById('min-hand');
  const hourHand = document.getElementById('hour-hand');

  if (secHand) secHand.style.transform = `rotate(${secDeg}deg)`;
  if (minHand) minHand.style.transform = `rotate(${minDeg}deg)`;
  if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dateElem = document.getElementById('live-gregorian-date');
  if (dateElem) {
    dateElem.innerText = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }

  const timeElem = document.getElementById('live-digital-time');
  if (timeElem) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    timeElem.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}

// ==========================================================================
// رندر محصولات و سیستم جستجو
// ==========================================================================
function renderProducts(items) {
  const container = document.getElementById('products-container');
  if (!container) return;
  container.innerHTML = '';

  const list = Array.isArray(items) ? items : TrendStore.products;

  if (!list.length) {
    container.innerHTML = `
      <div class="products-empty-state">
        <div class="products-empty-icon">🔎</div>
        <h3>هیچ محصولی با این جستجو پیدا نشد</h3>
        <p>برای دیدن دوباره همه محصولات، عبارت جستجو را پاک کنید یا یکی از تب‌های دسته‌بندی را انتخاب کنید.</p>
      </div>
    `;
    return;
  }

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openProductModal(p.id);
    
    const displayImg = p.gallery && p.gallery.length > 0 ? p.gallery[0] : p.mainImg;

    card.innerHTML = `
      <div class="product-tag">${escapeHTML(p.tag)}</div>
      <div class="product-img-box">
        <img src="${displayImg}" alt="${escapeHTML(p.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&auto=format&fit=crop&q=80'">
      </div>
      <div class="product-category">${escapeHTML(p.catName)}</div>
      <h3 class="product-title">${escapeHTML(p.title)}</h3>
      <p class="product-desc">${escapeHTML(p.desc.slice(0, 75))}...</p>
      <div class="product-footer">
        <div class="product-price">${p.price} <span>تومان</span></div>
        <button class="btn-quick-view">
          <span>مشاهده و سفارش</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterProductsByClientSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const filtered = TrendStore.products.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.catName.toLowerCase().includes(q) || 
    p.tag.toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// ==========================================================================
// پاپ‌آپ محصول با گالری ۳ تصویری
// ==========================================================================
const modalBackdrop = document.getElementById('product-modal-backdrop');

function openProductModal(productId) {
  const product = TrendStore.products.find(p => p.id === productId);
  if (!product || !modalBackdrop) return;

  const images = product.gallery && product.gallery.length > 0 ? product.gallery : [product.mainImg];
  const mainImgElem = document.getElementById('modal-main-image');
  mainImgElem.src = images[0];
  mainImgElem.onerror = () => { mainImgElem.src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80'; };

  document.getElementById('modal-badge-tag').innerText = product.tag;
  document.getElementById('modal-cat-name').innerText = product.catName;
  document.getElementById('modal-title').innerText = product.title;
  document.getElementById('modal-price').innerHTML = `${product.price} <span>تومان</span>`;
  document.getElementById('modal-desc').innerText = product.desc;

  const thumbContainer = document.getElementById('modal-thumbnails-container');
  thumbContainer.innerHTML = '';

  images.forEach((imgUrl, index) => {
    const thumb = document.createElement('div');
    thumb.className = `modal-thumb ${index === 0 ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${imgUrl}" alt="${product.title}" onerror="this.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=100&auto=format&fit=crop&q=80'">`;
    thumb.onclick = (e) => {
      e.stopPropagation();
      mainImgElem.src = imgUrl;
      document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    };
    thumbContainer.appendChild(thumb);
  });

  const specsList = document.getElementById('modal-specs-list');
  specsList.innerHTML = '';
  (product.specs || []).forEach(spec => {
    const li = document.createElement('li');
    li.innerText = spec;
    specsList.appendChild(li);
  });

  const waMsg = encodeURIComponent(`سلام تیم ترندز کارگو، درخواست ثبت سفارش «${product.title}» (کد ${product.id}) به مبلغ ${product.price} تومان با خط ارمنستان-تبریز را دارم.`);
  document.getElementById('modal-wa-btn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  modalBackdrop.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeProductModal(event) {
  if (event && event.target !== modalBackdrop && !event.target.classList.contains('modal-close-btn')) return;
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// ==========================================================================
// ماشین‌حساب آنلاین قیمت تمام‌شده
// ==========================================================================
function calculateCargoPrice() {
  const currElem = document.getElementById('calc-currency');
  const priceElem = document.getElementById('calc-price');
  const pkgElem = document.getElementById('calc-package-type');

  if (!currElem || !priceElem || !pkgElem) return;

  const curr = currElem.value;
  const price = parseFloat(priceElem.value) || 0;
  const pkg = pkgElem.value;

  const baseRate = TrendStore.rates.baseRates[curr] || 170;
  const effectiveRate = baseRate * (TrendStore.rates.exchangeSpreadMultiplier || 1.06);
  const baseToman = price * effectiveRate;
  const serviceProfit = baseToman * 0.60;

  let shippingUsd = 12;
  if (pkg === 'single_heavy') shippingUsd = 15;
  if (pkg === 'bulk_multi') shippingUsd = 5;

  const shippingToman = shippingUsd * (TrendStore.rates.usdShippingRate || 188000);
  const total = Math.round((baseToman + serviceProfit + shippingToman) / 10000) * 10000;

  const resElem = document.getElementById('calc-total-result');
  if (resElem) {
    resElem.innerHTML = `${total.toLocaleString('fa-IR')} <span>تومان</span>`;
  }

  return { total, curr, price };
}

function sendCalculatedQuoteToWhatsApp() {
  const calc = calculateCargoPrice();
  if (!calc) return;
  const msg = encodeURIComponent(`سلام ترندز کارگو، طبق فرمول سایت برای محصولی با قیمت ${calc.price} (${calc.curr.toUpperCase()}) قیمت تمام‌شده تخمینی ${calc.total.toLocaleString('fa-IR')} تومان محاسبه شد. لطفاً فاکتور نهایی صادر کنید.`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

function submitCustomLink() {
  const linkInput = document.getElementById('user-product-link');
  if (!linkInput) return;
  const val = linkInput.value.trim();
  if (!val) {
    alert('لطفاً ابتدا لینک محصول خارجی را وارد کنید.');
    return;
  }
  const msg = encodeURIComponent(`سلام ترندز کارگو، لطفاً قیمت تمام‌شده و زمان تحویل این لینک را استعلام بگیرید:\n${val}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

// ==========================================================================
// اخبار تکنولوژی و پاپ‌آپ آن
// ==========================================================================
function renderTechNews() {
  const newsContainer = document.getElementById('tech-news-container');
  if (!newsContainer) return;
  newsContainer.innerHTML = '';

  techNewsList.forEach(news => {
    const card = document.createElement('article');
    card.className = 'tech-card';
    card.onclick = () => openNewsModal(news.id);

    card.innerHTML = `
      <div class="tech-card-img">
        <img src="${news.img}" alt="${news.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80'">
        <span class="tech-badge">${news.badge}</span>
      </div>
      <div class="tech-card-body">
        <span class="tech-cat">${news.category}</span>
        <h3 class="tech-title">${news.title}</h3>
        <p class="tech-desc">${news.shortDesc}</p>
        <button class="btn-view-news">مشاهده گزارش کامل</button>
      </div>
    `;
    newsContainer.appendChild(card);
  });
}

function openNewsModal(newsId) {
  const news = techNewsList.find(n => n.id === newsId);
  const modal = document.getElementById('news-modal-backdrop');
  if (!news || !modal) return;

  document.getElementById('news-modal-img').src = news.img;
  document.getElementById('news-modal-cat').innerText = news.category;
  document.getElementById('news-modal-date').innerText = news.date;
  document.getElementById('news-modal-readtime').innerText = news.readTime;
  document.getElementById('news-modal-title').innerText = news.title;
  document.getElementById('news-modal-body').innerText = news.fullBody;

  const specsContainer = document.getElementById('news-modal-specs');
  specsContainer.innerHTML = '<h4>ویژگی‌ها و مشخصات نوآوری:</h4><ul></ul>';
  const ul = specsContainer.querySelector('ul');
  (news.specs || []).forEach(spec => {
    const li = document.createElement('li');
    li.innerText = spec;
    ul.appendChild(li);
  });

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeNewsModal(event) {
  const modal = document.getElementById('news-modal-backdrop');
  if (event && event.target !== modal && !event.target.classList.contains('modal-close-btn')) return;
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// ==========================================================================
// مدیریت PWA و نوتیفیکیشن
// ==========================================================================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const pwaBar = document.getElementById('pwa-top-bar');
  if (pwaBar) pwaBar.classList.remove('hidden');
});

function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      closePWABar();
    });
    return;
  }
  const modal = document.getElementById('universal-install-modal');
  if (modal) modal.classList.add('active');
}

function closeInstallModal() {
  const modal = document.getElementById('universal-install-modal');
  if (modal) modal.classList.remove('active');
}

function closePWABar() {
  const bar = document.getElementById('pwa-top-bar');
  if (bar) bar.classList.add('hidden');
}

function enablePushNotifications() {
  if (!('Notification' in window)) {
    alert('مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند.');
    return;
  }
  Notification.requestPermission().then((perm) => {
    if (perm === 'granted') {
      alert('🔔 با موفقیت فعال شد! تخفیف‌های ۹۰٪ آف برای شما پیامک/اعلان خواهد شد.');
    }
  });
}

// ==========================================================================
// لود اولیه و اتصالات رویدادها
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initAppTheme();
  renderProducts();
  renderTechNews();
  calculateCargoPrice();
  updateHeaderClock();
fetchTgjuLiveRates().catch(() => {});
setInterval(() => fetchTgjuLiveRates().catch(() => {}), 60 * 60 * 1000);
setInterval(updateHeaderClock, 1000);

  // حذف پرلودر
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => preloader.classList.add('fade-out'), 1200);
  }

  // فیلتر تب‌ها
  document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      if (filter === 'all') renderProducts();
      else renderProducts(TrendStore.products.filter(p => p.category === filter));
    });
  });

  // آکاردئون
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('active');
      const content = item.querySelector('.accordion-content');
      if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = null;
      }
    });
  });

  // نوبار اسکرول
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  });
});
