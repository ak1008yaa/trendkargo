
/**
 * ==========================================================================
 * TREND CARGO — PRODUCTION CONTROLLER ENGINE (ES6+ MODULAR)
 * ==========================================================================
 */

const WHATSAPP_NUMBER = "989374443386";
const STORAGE_KEYS = {
  products: 'trendcargo_custom_products',
  specialOffer: 'trendcargo_special_offer',
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
  },
  {
    id: 11, category: "gadget", catName: "گجت و دیجیتال", title: "هدست گیمینگ بی‌سیم نویزکنسلینگ اورایر",
    price: "۲,۹۸۰,۰۰۰", rawPrice: 2980000, tag: "ترند گیمینگ", mainImg: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "هدفون اورایر با نویزکنسلینگ اکتیو، صدای فرکانس‌بالا و میکروفون حذف نویز محیط مناسب گیم و کال‌های طولانی.",
    specs: ["اتصال: بلوتوث ۵.۳ با تاخیر زیر ۶۰ میلی‌ثانیه", "باتری: ۴۰ ساعت پخش مداوم با شارژ سریع Type-C", "پد گوش طبی با فوم حافظه‌دار برای استفاده طولانی"]
  },
  {
    id: 12, category: "gadget", catName: "گجت و دیجیتال", title: "ساعت هوشمند آمولد با پایش ضربان و اکسیژن خون",
    price: "۲,۱۵۰,۰۰۰", rawPrice: 2150000, tag: "پرفروش هدیه", mainImg: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "اسمارت واچ نمایشگر آمولد گرد با بیش از ۱۰۰ حالت ورزشی، پایش خواب و اعلان‌های هوشمند فارسی.",
    specs: ["نمایشگر: آمولد ۱.۴ اینچی همیشه‌روشن", "سنسورها: ضربان قلب، SpO2 و پایش خواب", "مقاومت: ضدآب IP68 با باتری ۷ روزه"]
  },
  {
    id: 13, category: "gadget", catName: "گجت و دیجیتال", title: "کیبورد مکانیکال RGB هات‌سواپ قابل شستشو",
    price: "۲,۷۵۰,۰۰۰", rawPrice: 2750000, tag: "ست‌آپ حرفه‌ای", mainImg: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "کیبورد ۷۵٪ مکانیکال با سوییچ هات‌سواپ، نورپردازی RGB پریمیوشن و بدنه فلزی برای استیم و تایپ حرفه‌ای.",
    specs: ["سوییچ: قرمز خطی هات‌سواپ قابل تعویض", "اتصال: سه‌حالته بلوتوث، ۲.۴G و سیمی Type-C", "بدنه آلومینیومی با فوم عایق صدای تایپ"]
  },
  {
    id: 14, category: "fashion", catName: "استایل و پوشاک", title: "کتانی رانینگ مش نخی بالشتکی سبک تک‌رنگ",
    price: "۲,۲۹۰,۰۰۰", rawPrice: 2290000, tag: "استایل اسپرت", mainImg: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "کتانی رانینگ روزمره با رویه مش تنفسی و کفی فوم مموری؛ سبک، راحت و مناسب پیاده‌روی طولانی و استایل اسپرت.",
    specs: ["کفی: فوم مموری قابل تعویض ضدبو", "وزن: حدود ۲۸۰ گرم برای هر لنگه", "سایزبندی: ۳۹ تا ۴۴ استاندارد"]
  },
  {
    id: 15, category: "fashion", catName: "استایل و پوشاک", title: "کت بامبر پایلینگ ضدآب و باد اورسایز",
    price: "۲,۵۵۰,۰۰۰", rawPrice: 2550000, tag: "ضد آب و باد", mainImg: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "بامبر جکت پاییزه با روکش ضدآب، آستر توری و بندهای تنظیم کمر؛ مناسب استایل استریت و سفر.",
    specs: ["روکش: پلی‌استر ضدآب با پوشش پوسته‌ای", "آستر: توری تنفسی با جیب داخلی زیپ‌دار", "سایزبندی: M تا XXL فیت آزاد"]
  },
  {
    id: 16, category: "accessory", catName: "اکسسوری و کیف", title: "بک‌پک ضدآب لپ‌تاپی با پورت شارژ USB",
    price: "۱,۳۵۰,۰۰۰", rawPrice: 1350000, tag: "محبوب دانشجویی", mainImg: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "کوله اداری و دانشجویی با محفظه ضربه‌گیر لپ‌تاپ ۱۵.۶ اینچ، جنس ضدآب و پورت شارژ USB بیرونی.",
    specs: ["گنجایش: ۲۵ لیتر با ۱۲ جیب داخلی و خارجی", "محفظه لپ‌تاپ: ضربه‌گیر تا سایز ۱۵.۶ اینچ", "کمربند سینه + پشت پنل ضدتعریق"]
  },
  {
    id: 17, category: "accessory", catName: "اکسسوری و کیف", title: "عینک آفتابی پلاریزه یووی ۴۰۰ فریم فلزی",
    price: "۹۸۰,۰۰۰", rawPrice: 980000, tag: "یووی ۴۰۰ اصل", mainImg: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "عینک آفتابی با لنز پلاریزه حذف انعکاس و محافظت کامل UV400؛ همراه با کیف سخت و دستمال مخصوص.",
    specs: ["لنز: پلاریزه با پوشش ضدخش و UV400", "فریم: فلزی سبک با پد بینی سیلیکونی", "همراه: کیف سخت، دستمال و کارت تست اصل"]
  },
  {
    id: 18, category: "accessory", catName: "اکسسوری و کیف", title: "کیف دستی مینیمال زنانه با بند شانه جداشدنی",
    price: "۱,۶۸۰,۰۰۰", rawPrice: 1680000, tag: "ترند مینیمال", mainImg: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "کیف دستی بافت مینیمال با آستر پارچه‌ای، سه محفظه و بند شانه قابل جدا شدن؛ مناسب استایل روزمره و مجلسی.",
    specs: ["جنس: چرم مصنوعی درجه یک ضدخط‌وخش", "ابعاد: ۲۶×۱۸×۹ سانتی‌متر", "بند شانه: قابل تنظیم و جداشدنی"]
  },
  {
    id: 19, category: "lifestyle", catName: "خانه و لایف‌استایل", title: "بطری آب استیل ترمو ۱ لیتری دوجداره بدنه چسبی",
    price: "۸۵۰,۰۰۰", rawPrice: 850000, tag: "همراه سفر", mainImg: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "بطری استیل ضدزنگ دوجداره با ماندگاری سردی ۲۴ ساعت و گرمی ۱۲ ساعت؛ درب ضدنشت و بدنه روکش پودری.",
    specs: ["ظرفیت: ۱ لیتر با درب بسته‌بندی ضدنشت", "متریال: استیل ۳۰۴ غذایی دوجداره خلأ", "بدنه: روکش پودری ضدلغزش و ضدعرق"]
  },
  {
    id: 20, category: "lifestyle", catName: "خانه و لایف‌استایل", title: "رینگ لایت حلقه‌ای خودی با پایه و ریموت تیک‌تاک",
    price: "۱,۴۵۰,۰۰۰", rawPrice: 1450000, tag: "وایرال تیک‌تاک", mainImg: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
    ],
    desc: "رینگ لایت ۱۲ اینچی با ۳ حالت رنگ و ۱۰ سطح شدت نور، پایه تلسکوپی تا ۲ متر و ریموت شاتر بلوتوثی.",
    specs: ["نور: ۳ حالت سفید، گرم و مخلوط با دیمر ۱۰ مرحله", "پایه: تلسکوپی تا ۲ متر با سر چرخان ۳۶۰", "ریموت: بلوتوث شاتر سازگار با iOS و اندروید"]
  }
];

// محصول تخفیف ویژه (ویترین حراجی لحظه‌ای — قابل ویرایش از پنل ادمین)
const specialOfferProduct = {
  id: 101, category: "special", catName: "تخفیف ویژه", title: "ایرباد بلوتوث ۵.۳ پرو با نویزکنسلینگ فعال",
  price: "۸۹۰,۰۰۰", rawPrice: 890000, oldPrice: "۱,۷۸۰,۰۰۰", discountPercent: 50,
  tag: "تخفیف ویژه ۵۰٪", mainImg: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80"
  ],
  desc: "ایرباد وایرلس با نویزکنسلینگ فعال (ANC)، صدای بیس عمیق، دکمه لمسی و جعبه شارژ نمایش‌دار؛ پیشنهاد حراج هفته ترندز کارگو.",
  specs: ["نویزکنسلینگ فعال ANC تا ۳۵ دسی‌بل", "باتری: ۶ ساعت پخش + ۲۴ ساعت با کیس شارژ", "مقاومت: ضدتعریق IPX5 با حالت گیم کم‌تاخیر"]
};

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
  specialOffer: null,
  rates: { ...CURRENCY_CONFIG },

  init() {
    const storedProducts = this.loadStorage(STORAGE_KEYS.products, null);
    this.products = Array.isArray(storedProducts) ? storedProducts : JSON.parse(JSON.stringify(top20Products));
    const storedOffer = this.loadStorage(STORAGE_KEYS.specialOffer, null);
    this.specialOffer = (storedOffer && !Array.isArray(storedOffer)) ? storedOffer : JSON.parse(JSON.stringify(specialOfferProduct));
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

  saveSpecialOffer(newOffer) {
    this.specialOffer = (newOffer && typeof newOffer === 'object') ? newOffer : this.specialOffer;
    try {
      localStorage.setItem(STORAGE_KEYS.specialOffer, JSON.stringify(this.specialOffer));
    } catch (error) {
      console.warn('Unable to persist special offer:', error);
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
      <p class="product-desc">${escapeHTML((p.desc || '').slice(0, 75))}...</p>
      <div class="product-footer">
        <div class="product-price">${p.oldPrice ? `<del>${escapeHTML(p.oldPrice)}</del>` : ''}${p.price} <span>تومان</span></div>
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
    String(p.title || '').toLowerCase().includes(q) || 
    String(p.catName || '').toLowerCase().includes(q) || 
    String(p.tag || '').toLowerCase().includes(q)
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
  const product = TrendStore.products.find(p => p.id === productId) ||
    (TrendStore.specialOffer && TrendStore.specialOffer.id === productId ? TrendStore.specialOffer : null);
  if (!product || !modalBackdrop) return;

  const fallbackImg = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80';
  const images = (product.gallery && product.gallery.length > 0 ? product.gallery : [product.mainImg]).filter(Boolean);
  if (!images.length) images.push(fallbackImg);
  const mainImgElem = document.getElementById('modal-main-image');
  mainImgElem.src = images[0];
  mainImgElem.onerror = () => { mainImgElem.src = fallbackImg; };

  document.getElementById('modal-badge-tag').innerText = product.tag || '';
  document.getElementById('modal-cat-name').innerText = product.catName || '';
  document.getElementById('modal-title').innerText = product.title || '';
  document.getElementById('modal-price').innerHTML = `${product.oldPrice ? `<del class="modal-old-price">${escapeHTML(product.oldPrice)}</del> ` : ''}${product.price} <span>تومان</span>`;
  document.getElementById('modal-desc').innerText = product.desc || '';

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
  const serviceProfit = baseToman * 0.25;
  const transferFee = baseToman * 0.01;

  let shippingUsd = 12;
  if (pkg === 'single_heavy') shippingUsd = 15;
  if (pkg === 'bulk_multi') shippingUsd = 5;

  const shippingToman = Math.max(3500000, shippingUsd * (TrendStore.rates.usdShippingRate || 188000));
  const total = Math.round((baseToman + serviceProfit + transferFee + shippingToman) / 10000) * 10000;

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
// محصول تخفیف ویژه (ویترین حراجی لحظه‌ای)
// ==========================================================================
function toFaDigits(value) {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(value).replace(/\d/g, (d) => faDigits[Number(d)]);
}

function renderSpecialOffer() {
  const container = document.getElementById('special-offer-container');
  const offer = TrendStore.specialOffer;
  if (!container || !offer) return;

  const displayImg = (offer.gallery && offer.gallery.length > 0 ? offer.gallery[0] : offer.mainImg) || '';
  const waText = encodeURIComponent(`سلام تیم ترندز کارگو، درخواست ثبت سفارش محصول تخفیف ویژه «${offer.title || ''}» به مبلغ ${offer.price || ''} تومان را دارم.`);

  container.innerHTML = `
    <div class="special-offer-card">
      <img src="${displayImg}" alt="${escapeHTML(offer.title || 'محصول تخفیف ویژه')}" class="special-offer-img" loading="lazy" onclick="openProductModal(${Number(offer.id)})"
        onerror="this.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80'">
      <div class="special-offer-body">
        <span class="special-offer-badge">🔥 ${escapeHTML(offer.tag || 'تخفیف ویژه')}${offer.discountPercent ? ' | ' + toFaDigits(offer.discountPercent) + '٪ آف' : ''}</span>
        <h3 class="special-offer-title" onclick="openProductModal(${Number(offer.id)})">${escapeHTML(offer.title || '')}</h3>
        <p class="special-offer-desc">${escapeHTML(offer.desc || '')}</p>
        <div class="special-price-row">
          ${offer.oldPrice ? `<del>${escapeHTML(offer.oldPrice)}</del>` : ''}
          <span class="special-price">${offer.price} <small>تومان</small></span>
        </div>
        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waText}" target="_blank" rel="noopener noreferrer" class="btn-primary special-offer-cta">
          <span>سفارش با تخفیف ویژه</span>
        </a>
      </div>
    </div>
  `;
}

// ==========================================================================
// تایمر شمارش معکوس حراجی (ریست روزانه در پایان شب)
// ==========================================================================
function startFlashCountdown() {
  const hoursElem = document.getElementById('hours');
  const minutesElem = document.getElementById('minutes');
  const secondsElem = document.getElementById('seconds');
  if (!hoursElem || !minutesElem || !secondsElem) return;

  const tick = () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    let diff = Math.max(0, Math.floor((endOfDay - now) / 1000));

    const hours = Math.floor(diff / 3600); diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    hoursElem.textContent = toFaDigits(String(hours).padStart(2, '0'));
    minutesElem.textContent = toFaDigits(String(minutes).padStart(2, '0'));
    secondsElem.textContent = toFaDigits(String(seconds).padStart(2, '0'));
  };

  tick();
  setInterval(tick, 1000);
}

// ==========================================================================
// توست اطلاع‌رسانی چرخشی (اطلاعات واقعی خدمات)
// ==========================================================================
function startLiveToasts() {
  const toast = document.getElementById('live-toast');
  if (!toast) return;

  const messages = [
    { user: 'پشتیبانی ترندز کارگو', action: 'آنلاین هستیم — همه‌روزه ۹ الی ۲۳ پاسخگوی شما' },
    { user: 'ارسال اکسپرس تیپاکس', action: 'از هاب تبریز به سراسر ایران با بارکد پیامکی' },
    { user: 'بازرسی در ایروان', action: 'تست سلامت کالا قبل از ورود به ایران' },
    { user: 'تخفیف ویژه امروز', action: 'پیشنهاد حراج را از بخش حراجی‌ها ببینید' }
  ];

  let index = 0;
  const showNext = () => {
    const userElem = document.getElementById('toast-user');
    const actionElem = document.getElementById('toast-action');
    if (userElem && actionElem) {
      userElem.textContent = messages[index].user;
      actionElem.textContent = messages[index].action;
    }
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 6000);
    index = (index + 1) % messages.length;
  };

  setTimeout(showNext, 4000);
  setInterval(showNext, 14000);
}

// ==========================================================================
// ثبت سرویس‌ورکر (PWA — فقط در صفحه اصلی و روی HTTPS)
// ==========================================================================
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname)) return;
  if (!/\/(index\.html)?$/.test(location.pathname)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
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
  renderSpecialOffer();
  renderTechNews();
  renderTestimonials();
  initTestimonialsSlider();
  initTestimonialForm();
  calculateCargoPrice();
  updateHeaderClock();
  startFlashCountdown();
  startLiveToasts();
  registerServiceWorker();
  fetchTgjuLiveRates().catch(() => {});
  setInterval(() => fetchTgjuLiveRates().catch(() => {}), 60 * 60 * 1000);
  setInterval(updateHeaderClock, 1000);

  // برچسب تعداد محصولات در تب «همه محصولات»
  const allTab = document.querySelector('.filter-tabs .tab-btn[data-filter="all"]');
  if (allTab) allTab.textContent = `همه محصولات (${toFaDigits(TrendStore.products.length)})`;

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

// ==========================================================================
// ??? ????? ??????? (Testimonials)
// ==========================================================================
const STORAGE_KEYS_TESTIMONIALS = "trendcargo_testimonials";

const defaultTestimonials = [
  {
    id: 1, name: "???? ?????", city: "?????", rating: 5,
    text: "????? ?????????? ???! ????? ?? ?? ?? ??? ????? ?? ????????? ???? ? ?? ?????? ???? ???? ????. ?????? ???? ??? ?? ????? ????? ?? ???? ??????. ????? ?????? ????? ?????.",
    date: "????/??/??", verified: true
  },
  {
    id: 2, name: "???? ?????", city: "?????", rating: 5,
    text: "?? ????? ????? ?? ??? ? ??? ???? ? ?? ??? ?? ????? ?????? ????? ?????. ??????? ?????? ??????? ??? ? ???????? ???? ?????? ???.",
    date: "????/??/??", verified: true
  },
  {
    id: 3, name: "????? ?????", city: "??????", rating: 5,
    text: "????? ??? ??? ?? ????? ???? ??????? ? ??? ????? ???? ??? ??? ??? ???? ???. ?????? ?? ?? ?????? ????? ??? ? ???? ??? ????? ????.",
    date: "????/??/??", verified: true
  },
  {
    id: 4, name: "???? ?????", city: "????", rating: 4,
    text: "???? ????? ???? ??? ? ???? ?? ?????? ????? ????????? ??? ???. ??? ???????? ???? ??????? ????? ???. ?? ?? ??????? ??????.",
    date: "????/??/??", verified: true
  },
  {
    id: 5, name: "???? ?????", city: "?????", rating: 5,
    text: "????? ??? ????? ???? ? ?? ??? ????? ???? ?????. ??????? ?????? ???? ?? ?????? ?? ???? ????? ?? ???? ??????.",
    date: "????/??/??", verified: true
  },
  {
    id: 6, name: "??? ?????", city: "???", rating: 5,
    text: "???????? ????? ????? ???? ?? ?????? ???? ?????. ?? ???? ????? ?? ?????? ??? ??? ??????? ? ???? ????? ??. ????? ?? ???.",
    date: "????/??/??", verified: true
  }
];

function getTestimonials() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS_TESTIMONIALS);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEYS_TESTIMONIALS, JSON.stringify(defaultTestimonials));
    return defaultTestimonials;
  } catch {
    return defaultTestimonials;
  }
}

function saveTestimonials(testimonials) {
  localStorage.setItem(STORAGE_KEYS_TESTIMONIALS, JSON.stringify(testimonials));
}

function renderTestimonials() {
  const track = document.getElementById("testimonials-track");
  const dotsContainer = document.getElementById("testimonial-dots");
  if (!track) return;

  const testimonials = getTestimonials();
  const approved = testimonials.filter(t => t.approved !== false);

  track.innerHTML = approved.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-header">
        <div class="testimonial-avatar">${t.name.charAt(0)}</div>
        <div class="testimonial-info">
          <div class="testimonial-name">${escapeHTML(t.name)}</div>
          <div class="testimonial-city">?? ${escapeHTML(t.city)}</div>
        </div>
        <div class="testimonial-stars">${'?'.repeat(t.rating)}${'u2606'.repeat(5 - t.rating)}</div>
      </div>
      <p class="testimonial-text">${escapeHTML(t.text)}</p>
      ${t.verified ? '<span class="testimonial-verified">? ???? ????? ???</span>' : ""}
      <div class="testimonial-date">${t.date || ""}</div>
    </div>
  `).join("");

  // Dots
  if (dotsContainer) {
    dotsContainer.innerHTML = approved.map((_, i) =>
      `<button class="testimonial-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="?????? ${toFaDigits(i + 1)}"></button>`
    ).join("");
    dotsContainer.querySelectorAll(".testimonial-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.index);
        scrollToTestimonial(idx);
      });
    });
  }
}

function scrollToTestimonial(index) {
  const track = document.getElementById("testimonials-track");
  if (!track) return;
  const cards = track.querySelectorAll(".testimonial-card");
  if (cards[index]) {
    const cardWidth = cards[index].offsetWidth + 24;
    track.scrollTo({ left: cardWidth * index, behavior: "smooth" });
    document.querySelectorAll(".testimonial-dot").forEach((d, i) => {
      d.classList.toggle("active", i === index);
    });
  }
}

function initTestimonialsSlider() {
  const prevBtn = document.getElementById("testimonial-prev");
  const nextBtn = document.getElementById("testimonial-next");
  const track = document.getElementById("testimonials-track");
  if (!track) return;

  let currentIndex = 0;
  const testimonials = getTestimonials().filter(t => t.approved !== false);

  const updateNav = () => {
    const cards = track.querySelectorAll(".testimonial-card");
    const scrollLeft = track.scrollLeft;
    const cardWidth = cards[0] ? cards[0].offsetWidth + 24 : 300;
    currentIndex = Math.round(scrollLeft / cardWidth);
    document.querySelectorAll(".testimonial-dot").forEach((d, i) => {
      d.classList.toggle("active", i === currentIndex);
    });
  };

  track.addEventListener("scroll", updateNav);

  if (prevBtn) {
    prevBtn.addEventListener("click", () => scrollToTestimonial(Math.max(0, currentIndex - 1)));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => scrollToTestimonial(Math.min(testimonials.length - 1, currentIndex + 1)));
  }
}

function initTestimonialForm() {
  const modal = document.getElementById("testimonial-modal");
  const openBtn = document.getElementById("btn-open-testimonial-form");
  const closeBtn = document.getElementById("btn-close-testimonial-modal");
  const form = document.getElementById("testimonial-form");
  const starBtns = document.querySelectorAll(".star-btn");
  const ratingInput = document.getElementById("testimonial-rating");

  if (!modal || !form) return;

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    });
  }

  const closeModal = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  starBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const value = Number(btn.dataset.value);
      ratingInput.value = value;
      starBtns.forEach(b => {
        b.classList.toggle("active", Number(b.dataset.value) <= value);
      });
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("testimonial-name").value.trim();
    const city = document.getElementById("testimonial-city").value.trim();
    const text = document.getElementById("testimonial-text").value.trim();
    const rating = Number(ratingInput.value);

    if (text.length < 20) return;

    const testimonials = getTestimonials();
    const now = new Date();
    const jalaali = { year: 1405, month: 6, day: 20 }; // simplified
    testimonials.unshift({
      id: Date.now(),
      name, city, text, rating,
      date: `${jalaali.year}/${String(jalaali.month).padStart(2, '0')}/${String(jalaali.day).padStart(2, '0')}`,
      verified: false,
      approved: false
    });
    saveTestimonials(testimonials);

    form.reset();
    starBtns.forEach(b => b.classList.toggle("active", Number(b.dataset.value) <= 5));
    ratingInput.value = 5;
    closeModal();

    // Show success toast
    const toast = document.getElementById("live-toast");
    if (toast) {
      const userEl = document.getElementById("toast-user");
      const actionEl = document.getElementById("toast-action");
      if (userEl) userEl.textContent = "? ??? ??? ??? ??";
      if (actionEl) actionEl.textContent = "?? ?? ????? ??? ??? ????? ???? ????? ??";
      toast.classList.add("active");
      setTimeout(() => toast.classList.remove("active"), 5000);
    }
  });
}
