/**
 * TREND CARGO — SERVICE WORKER
 * Cache Offline & Push Notifications Handler
 */

const CACHE_NAME = 'trendcargo-v398968.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html', './blog.html', './js/blog-data.js', './js/blog.js',
  './404.html',
  './admin.html',
  './invoice.html',
  './css/style.css',
  './js/script.js',
  './manifest.json',
  './assets/logo.png',
  './assets/favicon_io/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: '🔥 حراجی ۹۰٪ آف تمو در ترندز کارگو!', body: 'محصولات جدید اضافه شدند.' };
  if (event.data) {
    try { data = event.data.json(); } catch { data.body = event.data.text(); }
  }

  const options = {
    body: data.body,
    icon: 'assets/logo.png',
    badge: 'assets/logo.png',
    data: { url: './index.html' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || './index.html'));
});
