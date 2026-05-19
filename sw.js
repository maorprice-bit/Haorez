const CACHE_NAME = 'haorz-v3';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// התקנה — שמור קבצים ב-cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/', '/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// הפעלה — מחק cache ישן
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// בקשות — Cache First לקבצים מקומיים, Network First לשאר
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase ו-fonts — תמיד מהרשת
  if (url.hostname.includes('firebase') || url.hostname.includes('fonts') || url.hostname.includes('gstatic')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // קבצים מקומיים — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
