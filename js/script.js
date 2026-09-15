
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
  sheetUrl: 'trendcargo_google_sheet_url',
  flashDeals: 'trendcargo_flash_deals',
  termsText: 'trendcargo_terms_text',
  hero: 'trendcargo_hero_config',
  socials: 'trendcargo_socials_config'
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

// محتوای پیش‌فرض هیرو و سوشال
const defaultHeroConfig = {
  badge: "🇦🇲 خط مستقیم واردات: هاب ایروان ➔ هاب توزیع تبریز ➔ سراسر ایران",
  title: 'خرید مستقیم از <span class="highlight-cyan">تمو، شین و آمازون</span><br>با تضمین اصالت و <span class="highlight-coral">قیمت کاملاً رقابتی</span>',
  desc: "دسترسی بدون واسطه به محصولات اورجینال و ترند روز جهانی؛ کنترل فیزیکی و تست سلامت در ارمنستان، و ارسال پلمپ با تیپاکس از تبریز بدون درگیری با گمرک و پروسه‌های فرسایشی مرجوعی به چین.",
  chips: ["TEMU (تمو)", "SHEIN (شین)", "AMAZON (آمازون)", "WILDBERRIES (وایلدبریز)"],
  primaryBtn: { text: "مشاهده حراجی‌های لحظه‌ای ۹۰٪", href: "#flash-sale" },
  secondaryBtn: { text: "استعلام قیمت لینک دلخواه", href: "#custom-order" },
  keyPoints: [
    { icon: "🛡️", title: "مرجوعی در ایروان", desc: "تست و تعویض در ارمنستان قبل از ورود به ایران" },
    { icon: "💎", title: "سود کاملاً منصفانه", desc: "محاسبه با کمترین کارمزد و کرایه اقتصادی" },
    { icon: "📸", title: "شفافیت و رهگیری لحظه‌ای", desc: "اسکرین‌شات خرید مستقیم پنل خارجی" }
  ]
};
const defaultSocialsConfig = {
  whatsapp: WHATSAPP_NUMBER,
  instagramStyle: {
    badge: "👕 مد، فشن و استایل",
    title: "Trend Cargo Style",
    handle: "@trendcargo.style",
    url: "https://instagram.com/trendkargo_style",
    followersNote: "🔥 هودی‌های وینتیج، کارگو و فشن شین",
    bio: "مرجع خرید هودی‌های سنگین اسیدواش، شلوارهای بگ کارگو، کفش‌های چانکی و استایل‌های ترند پینترست از Shein و Temu.",
    tags: ["#استریت_ویر", "#شین_ایران", "#هودی_اورسایز", "#کارگو_بگ"],
    btnText: "مشاهده و فالو پیج استایل",
    avatar: "assets/logo.png"
  },
  instagramGadget: {
    badge: "⚡ گجت و دنیای تکنولوژی",
    title: "Trend Cargo Gadget",
    handle: "@trendcargo.gadget",
    url: "https://instagram.com/trendkargo_gajet",
    followersNote: "🚀 گجت‌های هوشمند و وایرال تیک‌تاک",
    bio: "معرفی و تست آنباکس پرینترهای حرارتی جیبی، پایه‌های هوش مصنوعی تعقیب سوژه، شارژرهای وایرلس و گجت‌های دسکتاپ.",
    tags: ["#گجت_هوشمند", "#تمو_ایران", "#ست_آپ_دسکتاپ", "#گجت_تیک_تاک"],
    btnText: "مشاهده و فالو پیج گجت",
    avatar: "assets/logo.png"
  },
  footerLinks: {
    sites: [
      { label: "خرید مستقیم از Temu (تمو)", href: "https://www.temu.com/" },
      { label: "خرید مستقیم از Shein (شین)", href: "https://m.shein.com/" },
      { label: "خرید از Amazon", href: "https://www.amazon.com/" },
      { label: "خرید از Wildberries", href: "https://www.wildberries.ru/" }
    ]
  }
};
// اخبار تکنولوژی ۲۰۲۶ - پیش‌فرض
const defaultTechNewsList = [
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
let techNewsList = [...defaultTechNewsList];

// ==========================================================================
 // موتور ذخیره‌سازی داده‌های واکنشی (Reactive Store)
 // ==========================================================================
const TrendStore = {
  products: [],
  rates: { ...CURRENCY_CONFIG },
  hero: { ...defaultHeroConfig },
  socials: JSON.parse(JSON.stringify(defaultSocialsConfig)),

  init() {
    this.products = this.loadStorage(STORAGE_KEYS.products, top20Products);
    this.rates = this.loadStorage(STORAGE_KEYS.rates, CURRENCY_CONFIG);
    const savedRates = this.loadStorage('trendcargo_last_exchange_rates', null);
    if (savedRates && typeof savedRates === 'object') this.rates = { ...this.rates, ...savedRates };
    this.hero = this.loadStorage(STORAGE_KEYS.hero, defaultHeroConfig);
    // deep merge for socials / chips fallback
    const savedSocials = this.loadStorage(STORAGE_KEYS.socials, null);
    if (savedSocials && typeof savedSocials === 'object') this.socials = { ...JSON.parse(JSON.stringify(defaultSocialsConfig)), ...savedSocials, instagramStyle: { ...defaultSocialsConfig.instagramStyle, ...(savedSocials.instagramStyle||{}) }, instagramGadget: { ...defaultSocialsConfig.instagramGadget, ...(savedSocials.instagramGadget||{}) }, footerLinks: savedSocials.footerLinks || defaultSocialsConfig.footerLinks };
    techNewsList = this.loadStorage(STORAGE_KEYS.news, defaultTechNewsList);
    if (!Array.isArray(techNewsList) || !techNewsList.length) techNewsList = [...defaultTechNewsList];
  },

  loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch { return fallback; }
  },

  saveProducts(newProducts) {
    this.products = Array.isArray(newProducts) ? newProducts : this.products;
    try { localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(this.products)); } catch (error) { console.warn('Unable to persist product list:', error); }
    TrendBackend.push('products', this.products);
  },

  saveRates(newRates) {
    this.rates = { ...this.rates, ...(newRates || {}) };
    try {
      localStorage.setItem(STORAGE_KEYS.rates, JSON.stringify(this.rates));
      localStorage.setItem('trendcargo_last_exchange_rates', JSON.stringify(this.rates));
    } catch (error) { console.warn('Unable to persist exchange rates:', error); }
    TrendBackend.push('rates', this.rates);
  },

  saveHero(nextHero){
    this.hero = { ...this.hero, ...(nextHero||{}) };
    try{ localStorage.setItem(STORAGE_KEYS.hero, JSON.stringify(this.hero)); }catch(e){ console.warn(e); }
    TrendBackend.push('hero', this.hero);
  },
  saveSocials(nextSocials){
    this.socials = { ...this.socials, ...(nextSocials||{}) };
    try{ localStorage.setItem(STORAGE_KEYS.socials, JSON.stringify(this.socials)); }catch(e){ console.warn(e); }
    TrendBackend.push('socials', this.socials);
  },
  saveNews(list){
    const arr = Array.isArray(list)? list : techNewsList;
    techNewsList = arr;
    try{ localStorage.setItem(STORAGE_KEYS.news, JSON.stringify(arr)); }catch(e){ console.warn(e); }
    TrendBackend.push('news', arr);
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

// ==========================================================================
// بکند واقعی (Vercel Serverless + Supabase) — همگام‌سازی با localStorage
// خواندن داده‌ها از سرور در لود اول؛ در نبودِ بکند، fallback به localStorage.
// ذخیره‌سازی ادمین به صورت خودکار به سرور push می‌شود (نیازمند توکن ادمین).
// ==========================================================================
const API_STORE_URL = '/api/store';

const TrendBackend = {
  online: null,          // null = نامشخص، true = متصل، false = قطع
  echoGuard: false,      // جلوگیری از echo هنگام اعمال داده سرور
  _timers: {},

  getAdminToken() {
    try { return sessionStorage.getItem('trendcargo_admin_token') || ''; }
    catch (error) { return ''; }
  },

  async pull() {
    try {
      const response = await fetch(API_STORE_URL, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || payload.ok === false || !payload.data) {
        throw new Error(payload && payload.error ? payload.error : `HTTP ${response.status}`);
      }
      this.online = true;
      console.info('✅ بکند متصل شد — داده‌ها از سرور بارگذاری می‌شوند.');
      return payload.data;
    } catch (error) {
      this.online = false;
      console.warn('بکند در دسترس نیست — ادامه با localStorage:', error.message);
      return null;
    }
  },

  push(key, value) {
    if (this.echoGuard) return;
    const token = this.getAdminToken();
    if (!token || this.online === false) return;
    clearTimeout(this._timers[key]);
    this._timers[key] = setTimeout(async () => {
      try {
        const response = await fetch(API_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ key, value })
        });
        if (!response.ok) {
          console.warn(`Backend push failed for "${key}": HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`Backend push failed for "${key}":`, error.message);
      }
    }, 500);
  },

  applyServerData(data) {
    if (!data || typeof data !== 'object') return;
    this.echoGuard = true;
    try {
      if (Array.isArray(data.products) && data.products.length) {
        TrendStore.products = data.products;
        this._saveLocal(STORAGE_KEYS.products, data.products);
        if (typeof renderProducts === 'function') renderProducts();
      }
      if (data.hero && typeof data.hero === 'object') {
        TrendStore.saveHero(data.hero);
        if (typeof renderHeroSection === 'function') renderHeroSection();
      }
      if (data.socials && typeof data.socials === 'object') {
        TrendStore.saveSocials(data.socials);
        if (typeof renderSocialsSection === 'function') renderSocialsSection();
      }
      if (Array.isArray(data.news) && data.news.length) {
        TrendStore.saveNews(data.news);
        if (typeof renderTechNews === 'function') renderTechNews();
      }
      if (data.rates && typeof data.rates === 'object' && data.rates.baseRates) {
        TrendStore.saveRates(data.rates);
      }
      if (Array.isArray(data.invoices) && data.invoices.length) {
        this._saveLocal(STORAGE_KEYS.invoices, data.invoices.slice(0, 50));
        if (data.invoices[0]) this._saveLocal(STORAGE_KEYS.lastInvoice, data.invoices[0]);
        if (typeof renderOrdersTable === 'function') renderOrdersTable();
        if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
      }
      if (Array.isArray(data.flashDeals) && data.flashDeals.length) {
        this._saveLocal(STORAGE_KEYS.flashDeals, data.flashDeals);
        if (typeof renderFlashDeals === 'function') renderFlashDeals();
      }
      if (Array.isArray(data.discounts) && data.discounts.length) {
        this._saveLocal('trendcargo_discounts', data.discounts);
        if (typeof renderDiscounts === 'function') renderDiscounts();
      }
      if (Array.isArray(data.orders)) {
        this._saveLocal('trendcargo_orders', data.orders);
        if (typeof renderCustomOrders === 'function') renderCustomOrders();
      }
      if (typeof data.terms === 'string' && data.terms.trim()) {
        this._saveLocal(STORAGE_KEYS.termsText, data.terms);
        if (typeof loadTermsEditor === 'function') loadTermsEditor();
      }
      if (typeof data.sheetUrl === 'string' && data.sheetUrl.trim()) {
        this._saveLocal(STORAGE_KEYS.sheetUrl, data.sheetUrl);
        if (typeof hydrateSheetUrl === 'function') hydrateSheetUrl();
        if (typeof syncSheetInputs === 'function') syncSheetInputs();
      }
      if (typeof renderCMS === 'function') renderCMS();
      if (typeof hydrateHeroAdmin === 'function') hydrateHeroAdmin();
      if (typeof hydrateSocialsAdmin === 'function') hydrateSocialsAdmin();
      if (typeof renderFooterSitesEditor === 'function') renderFooterSitesEditor();
      if (typeof renderNewsAdmin === 'function') renderNewsAdmin();
    } finally {
      this.echoGuard = false;
    }
  },

  _saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.warn(`Unable to cache "${key}" locally:`, error); }
  }
};

TrendBackend.pull().then((data) => {
  if (!data) return;
  if (document.readyState === 'complete') {
    TrendBackend.applyServerData(data);
  } else {
    window.addEventListener('load', () => TrendBackend.applyServerData(data), { once: true });
  }
});

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
  TrendBackend.push('invoices', invoices.slice(0, 50));

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

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => toast.classList.remove('show'), 2600);
}

function getStoredFlashDeals() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.flashDeals) || '[]');
    if (Array.isArray(list) && list.length) return list;
  } catch (error) {
    console.warn('Unable to read flash deals:', error);
  }

  return [
    { id: 'FLASH-1', title: 'حراجی سنسور هوشمند', percent: 70, active: true, endAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() },
    { id: 'FLASH-2', title: 'تخفیف گجت منزل', percent: 60, active: true, endAt: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString() }
  ];
}

function saveFlashDeals(list) {
  const safeList = Array.isArray(list) ? list : [];
  localStorage.setItem(STORAGE_KEYS.flashDeals, JSON.stringify(safeList));
  TrendBackend.push('flashDeals', safeList);
}

function addFlashDeal() {
  const list = getStoredFlashDeals();
  list.unshift({
    id: `FLASH-${Date.now().toString().slice(-4)}`,
    title: 'حراجی جدید',
    percent: 50,
    active: true,
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString()
  });
  saveFlashDeals(list);
  renderFlashDeals();
  showToast('حراجی جدید اضافه شد');
}

function renderFlashDeals() {
  const host = document.getElementById('flash-deals-list');
  if (!host) return;
  const deals = getStoredFlashDeals();

  host.innerHTML = deals.map((deal, index) => `
    <div class="discount-item">
      <div class="discount-meta">
        <strong>${escapeHTML(deal.id)}</strong>
        <small>${deal.active ? 'فعال' : 'غیرفعال'} · ${Number(deal.percent || 0)}%</small>
      </div>
      <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
        <input type="text" class="form-control" style="width:180px;" value="${escapeHTML(deal.title)}" data-flash-index="${index}" data-flash-field="title" />
        <input type="number" class="form-control" style="width:90px;" value="${Number(deal.percent || 0)}" data-flash-index="${index}" data-flash-field="percent" />
        <input type="datetime-local" class="form-control" style="width:200px;" value="${deal.endAt ? new Date(deal.endAt).toISOString().slice(0, 16) : ''}" data-flash-index="${index}" data-flash-field="endAt" />
        <button class="toggle-switch ${deal.active ? 'active' : ''}" data-flash-index="${index}" data-flash-field="active" title="فعال/غیرفعال"></button>
      </div>
    </div>
  `).join('');

  host.querySelectorAll('[data-flash-field="title"]').forEach(input => {
    input.addEventListener('change', (event) => {
      const idx = Number(event.target.dataset.flashIndex);
      const list = getStoredFlashDeals();
      list[idx].title = event.target.value || 'حراجی جدید';
      saveFlashDeals(list);
      renderFlashDeals();
    });
  });

  host.querySelectorAll('[data-flash-field="percent"]').forEach(input => {
    input.addEventListener('change', (event) => {
      const idx = Number(event.target.dataset.flashIndex);
      const list = getStoredFlashDeals();
      list[idx].percent = Number(event.target.value || 0);
      saveFlashDeals(list);
      renderFlashDeals();
    });
  });

  host.querySelectorAll('[data-flash-field="endAt"]').forEach(input => {
    input.addEventListener('change', (event) => {
      const idx = Number(event.target.dataset.flashIndex);
      const list = getStoredFlashDeals();
      list[idx].endAt = new Date(event.target.value).toISOString();
      saveFlashDeals(list);
      renderFlashDeals();
    });
  });

  host.querySelectorAll('[data-flash-field="active"]').forEach(button => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.flashIndex);
      const list = getStoredFlashDeals();
      list[idx].active = !list[idx].active;
      saveFlashDeals(list);
      renderFlashDeals();
    });
  });
}

function loadTermsEditor() {
  const editor = document.getElementById('terms-editor');
  if (!editor) return;
  const saved = localStorage.getItem(STORAGE_KEYS.termsText);
  if (saved && saved.trim()) {
    editor.value = saved;
  }
}

function saveTermsText() {
  const editor = document.getElementById('terms-editor');
  if (!editor) return;
  const value = editor.value.trim();
  if (!value) return;
  localStorage.setItem(STORAGE_KEYS.termsText, value);
  TrendBackend.push('terms', value);
  showToast('متن قوانین و ضمانت‌ها ذخیره شد');
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
 // ماشین‌حساب آنلاین قیمت تمام‌شده (فقط دلار)
 // ==========================================================================
function calculateCargoPrice() {
  const priceElem = document.getElementById('calc-price');
  const pkgElem = document.getElementById('calc-package-type');
  const resElem = document.getElementById('calc-total-result');
  if (!priceElem || !pkgElem) return null;
  const price = parseFloat(priceElem.value) || 0;
  const pkg = pkgElem.value;
  const curr = 'usd';
  const usdRate = Number(TrendStore.rates.baseRates?.usd || 188000);
  const productCostToman = price * usdRate;
  const profitMargin = productCostToman * 0.25;
  const serviceAndCheckCost = productCostToman * 0.12 + 2500000;
  let weightKg = 0.5;
  if (pkg === 'single_heavy') weightKg = 2;
  if (pkg === 'bulk_multi') weightKg = 3.5;
  const firstKgShipping = 3500000;
  const extraKgShipping = Math.max(0, weightKg - 1) * 2800000;
  const total = Math.round((productCostToman + profitMargin + serviceAndCheckCost + firstKgShipping + extraKgShipping) / 10000) * 10000;
  if (resElem) resElem.innerHTML = `${total.toLocaleString('fa-IR')} <span>تومان</span>`;
  return { total, curr, price, weightKg };
}

function sendCalculatedQuoteToWhatsApp() {
  const calc = calculateCargoPrice();
  if (!calc) return;
  const msg = encodeURIComponent(`سلام ترندز کارگو، قیمت کالا ${calc.price} دلار و وزن تقریبی ${calc.weightKg} کیلو با فرمول هزینه محصول + 25% سود و انجام کار و خرید و بررسی محصول برای مشتری محاسبه شد. قیمت تقریبی نهایی: ${calc.total.toLocaleString('fa-IR')} تومان. لطفاً فاکتور نهایی و زمان تحویل را برایم ارسال کنید.`);
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

  // ثبت درخواست در بکند (اگر در دسترس بود) — جریان واتساپ متوقف نمی‌شود
  try {
    fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: val })
    })
      .then((response) => {
        if (response.ok) console.info('✅ استعلام شما در سامانه ثبت شد.');
      })
      .catch(() => {});
  } catch (error) { /* در حالت آفلاین فقط واتساپ باز می‌شود */ }

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

// --- هیرو و سوشال داینامیک ---
function renderHeroSection(){
  const h = TrendStore.hero || defaultHeroConfig;
  const badge = document.getElementById('hero-badge');
  if(badge) badge.innerHTML = h.badge;
  const title = document.getElementById('hero-title');
  if(title) title.innerHTML = h.title;
  const desc = document.getElementById('hero-desc');
  if(desc) desc.textContent = h.desc;
  const chips = document.getElementById('hero-chips');
  if(chips) chips.innerHTML = (h.chips||[]).map(c=>`<span class="p-chip">${escapeHTML(c)}</span>`).join('');
  const primary = document.getElementById('hero-primary-btn');
  if(primary){ primary.innerHTML = `<span>${escapeHTML(h.primaryBtn?.text||'')}</span><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`; primary.href = h.primaryBtn?.href||'#flash-sale'; }
  const secondary = document.getElementById('hero-secondary-btn');
  if(secondary){ secondary.textContent = h.secondaryBtn?.text||''; secondary.href = h.secondaryBtn?.href||'#custom-order'; }
  const points = document.getElementById('hero-key-points');
  if(points) points.innerHTML = (h.keyPoints||[]).map(k=>`<div class="point-item"><span class="p-icon">${escapeHTML(k.icon||'')}</span><div class="p-txt"><strong>${escapeHTML(k.title||'')}</strong><small>${escapeHTML(k.desc||'')}</small></div></div>`).join('');
}
function renderSocialsSection(){
  const s = TrendStore.socials || defaultSocialsConfig;
  // اینستا استایل
  const st = s.instagramStyle||defaultSocialsConfig.instagramStyle;
  const g = s.instagramGadget||defaultSocialsConfig.instagramGadget;
  const set = (prefix, data)=>{
    const els = {
      badge: document.getElementById(prefix+'-badge'),
      title: document.getElementById(prefix+'-title'),
      handle: document.getElementById(prefix+'-handle'),
      note: document.getElementById(prefix+'-note'),
      bio: document.getElementById(prefix+'-bio'),
      btn: document.getElementById(prefix+'-btn'),
      avatar: document.getElementById(prefix+'-avatar'),
      tags: document.getElementById(prefix+'-tags')
    };
    if(els.badge) els.badge.textContent = data.badge||'';
    if(els.title) els.title.textContent = data.title||'';
    if(els.handle) els.handle.textContent = data.handle||'';
    if(els.note) els.note.textContent = data.followersNote||'';
    if(els.bio) els.bio.textContent = data.bio||'';
    if(els.btn){ els.btn.href = data.url||'#'; const span = els.btn.querySelector('span'); if(span) span.textContent = data.btnText||''; }
    if(els.avatar) els.avatar.src = data.avatar||'assets/logo.png';
    if(els.tags) els.tags.innerHTML = (data.tags||[]).map(t=>`<span>${escapeHTML(t)}</span>`).join('');
  };
  set('insta-style', st);
  set('insta-gadget', g);
  // فوتر سایت‌ها
  const footerBox = document.getElementById('footer-sites-list');
  if(footerBox && s.footerLinks?.sites){
    footerBox.innerHTML = s.footerLinks.sites.map(l=>`<li><a href="${escapeHTML(l.href)}" target="_blank" rel="noopener">${escapeHTML(l.label)}</a></li>`).join('');
  }
  // واتساپ لینک‌ها
  const waNum = (s.whatsapp||WHATSAPP_NUMBER).replace(/[^0-9]/g,'');
  document.querySelectorAll('a.whatsapp-btn, a.footer-whatsapp-link').forEach(a=>{
    const base = a.getAttribute('href')||'';
    if(base.includes('wa.me')) a.href = `https://wa.me/${waNum}` + (base.includes('?text=')? base.slice(base.indexOf('?text=')) : '?text='+encodeURIComponent('سلام درخواست مشاوره و ثبت سفارش دارم'));
    if(a.classList.contains('footer-whatsapp-link')) a.textContent = '+'+waNum.slice(0,2)+' '+waNum.slice(2,5)+' '+waNum.slice(5,8)+' '+waNum.slice(8);
  });
}
// --- مدیریت اخبار در ادمین (CRUD) ---
function addNewsItem(payload){
  const item = {
    id: Date.now(),
    category: payload?.category || 'تکنولوژی',
    title: payload?.title || 'عنوان خبر جدید',
    date: payload?.date || new Date().toLocaleDateString('fa-IR'),
    readTime: payload?.readTime || 'زمان مطالعه: ۳ دقیقه',
    img: payload?.img || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    badge: payload?.badge || 'جدید',
    shortDesc: payload?.shortDesc || 'توضیح کوتاه خبر...',
    fullBody: payload?.fullBody || 'متن کامل خبر قابل ویرایش از پنل ادمین.',
    specs: Array.isArray(payload?.specs)? payload.specs : ['ویژگی ۱','ویژگی ۲']
  };
  techNewsList.unshift(item);
  TrendStore.saveNews(techNewsList);
  return item;
}
function removeNewsItem(id){
  techNewsList = techNewsList.filter(n=> String(n.id)!==String(id));
  TrendStore.saveNews(techNewsList);
}
function updateNewsItem(id, patch){
  const idx = techNewsList.findIndex(n=> String(n.id)===String(id));
  if(idx>=0){ techNewsList[idx]={...techNewsList[idx], ...patch}; TrendStore.saveNews(techNewsList); }
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
  renderHeroSection();
  renderSocialsSection();
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
