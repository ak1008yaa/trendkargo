const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return null;
}

function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filename}:`, e.message);
    return false;
  }
}

const defaultTestimonials = [
  { id: 1, name: 'سارا محمدی', city: 'تبریز', rating: 5, text: 'کیفیت هودی که گرفتم فوق‌العاده بود. دقیقاً همون سایز و رنگی که خواستم. بسته‌بندی هم خیلی حرفه‌ای انجام شده بود. حتماً دوباره خرید می‌کنم.', date: '۱۴۰۴/۰۵/۱۲', verified: true, approved: true },
  { id: 2, name: 'علی رضایی', city: 'تهران', rating: 5, text: 'از تمو یه گجت سفارش دادم که توی ایران پیدا نمی‌شد. توی ایروان تستش کردن و بعد ارسال. واقعاً خدماتشون حرف نداره.', date: '۱۴۰۴/۰۴/۲۸', verified: true, approved: true },
  { id: 3, name: 'مریم اکبری', city: 'اصفهان', rating: 5, text: 'قیمت‌هایی که میدن واقعاً منصفانه‌ست. چند جا استعلام گرفتم و ترندز کارگو ارزون‌تر بود. پاسخگویی واتساپ هم عالیه.', date: '۱۴۰۴/۰۴/۱۵', verified: true, approved: true },
  { id: 4, name: 'حسین نوری', city: 'مشهد', rating: 4, text: 'بسته‌ی من یه کم دیرتر رسید ولی کیفیت محصول عالی بود و پشتیبانی هم مرتب پیگیری می‌کرد. راضی‌ام.', date: '۱۴۰۴/۰۳/۲۲', verified: true, approved: true },
  { id: 5, name: 'نگار کریمی', city: 'شیراز', rating: 5, text: 'کتونی‌هایی که گرفتم خیلی خوشگل و راحت بودن. دقیقاً همون چیزی که توی عکس تمو بود. مرسی از تیم خوبتون.', date: '۱۴۰۴/۰۳/۱۰', verified: true, approved: true },
  { id: 6, name: 'امیر تهرانی', city: 'کرج', rating: 5, text: 'دومین سفارشمه و مثل همیشه عالی. بازرسی ایروان واقعاً ارزش داره چون اگه مشکلی باشه همون‌جا حل می‌شه.', date: '۱۴۰۴/۰۲/۲۶', verified: true, approved: true }
];

router.get('/', (req, res) => {
  let testimonials = readData('testimonials.json');
  if (!testimonials) {
    testimonials = defaultTestimonials;
    writeData('testimonials.json', testimonials);
  }
  return res.json({ success: true, data: testimonials });
});

router.post('/', (req, res) => {
  try {
    const { testimonials } = req.body;
    if (!Array.isArray(testimonials)) {
      return res.status(400).json({ error: 'Testimonials must be an array.' });
    }
    if (writeData('testimonials.json', testimonials)) {
      req.app.locals.broadcastStoreUpdate?.('testimonials');
      return res.json({ success: true, message: 'Testimonials saved successfully.' });
    }
    return res.status(500).json({ error: 'Failed to save testimonials.' });
  } catch (e) {
    console.error('[testimonials] error:', e);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
