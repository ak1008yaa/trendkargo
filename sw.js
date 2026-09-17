/**
 * TREND CARGO — SERVICE WORKER v5.2
 * Network-first for HTML, cache-first for assets (all imagery served locally)
 */

const CACHE_VERSION = 'trendcargo-v5.2.0';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './404.html',
  './admin.html',
  './invoice.html',
  './blog.html',
  './css/style.css',
  './js/script.js',
  './js/blog-data.js',
  './js/blog.js',
  './manifest.json',
  './assets/logo.png',
  './assets/img/placeholder.svg',
  './assets/favicon_io/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] precache partial failure:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match('./index.html'))
        )
    );
  } else {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
      )
    );
  }
});

self.addEventListener('push', (event) => {
  let data = { title: '🔥 حراجی ویژه ترندز کارگو', body: 'محصولات جدید اضافه شدند.' };
  if (event.data) {
    try { data = event.data.json(); }
    catch { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'assets/logo.png',
      badge: 'assets/logo.png',
      dir: 'rtl',
      lang: 'fa',
      data: { url: './index.html' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || './index.html')
  );
});
