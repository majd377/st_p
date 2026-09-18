/* =====================================================================
   Service Worker — نسخة V5
   ---------------------------------------------------------------------
   تغييرات مهمة عن النسخة السابقة:
   1) لوحة الإدارة (/admin/) لا تُخزَّن إطلاقاً — لا نسخة مخبأة من صفحة
      تحكم، ولا رد من الكاش يتجاوز التحقق.
   2) صفحات HTML: الشبكة أولاً ثم الكاش، حتى تصل التحديثات فوراً
      بدل بقاء المستخدم على نسخة قديمة.
   3) طلبات Firebase/Google لا تُخزَّن أبداً.
   ===================================================================== */

const CACHE_NAME = 'app-shell-v5';
const ASSET_CACHE = 'assets-v5';

const PRECACHE = [
  './',
  './index.html',
  './assets/css/style.css?v=20260918-5',
  './assets/css/v4-overrides.css?v=20260918-5',
  './assets/js/firebase-config.js?v=20260918-5',
  './assets/js/app.js?v=20260918-5',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(PRECACHE.map(async (url) => {
        try { await cache.add(url); } catch (error) { console.warn('Cache skipped:', url, error); }
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => (key !== CACHE_NAME && key !== ASSET_CACHE) ? caches.delete(key) : null)
    ))
  );
  self.clients.claim();
});

function isAdminRequest(url) {
  return url.pathname.includes('/admin');
}

function isExternalService(url) {
  return /(^|\.)(googleapis|gstatic|firebaseio|firebaseapp|google)\.com$/i.test(url.hostname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // لا نتدخل إطلاقاً في لوحة الإدارة ولا في خدمات Firebase/Google
  if (isAdminRequest(url) || isExternalService(url) || url.origin !== self.location.origin) {
    return;
  }

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // الشبكة أولاً: التحديثات تصل فوراً، والكاش احتياطي عند انقطاع الاتصال
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => { try { c.put(req, copy); } catch (e) {} });
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // الملفات الثابتة: من الكاش فوراً مع تحديثه في الخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(ASSET_CACHE).then((c) => { try { c.put(req, copy); } catch (e) {} });
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
