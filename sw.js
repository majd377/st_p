const CACHE_NAME = 'app-shell-v3';
const urlsToCache = [
  './',
  './index.html',
  './assets/css/style.css?v=20260914-3',
  './assets/css/v4-overrides.css?v=20260914-3',
  './assets/js/firebase-config.js?v=20260914-3',
  './assets/js/app.js?v=20260914-3',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(urlsToCache.map(async (url) => {
        try { await cache.add(url); } catch (error) { console.warn('Cache skipped:', url, error); }
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, fetchRes.clone()); } catch(e) {}
          return fetchRes;
        });
      }).catch(() => response);
    })
  );
});