/* Weeklingo PWA - Service Worker v3 */
const CACHE_NAME = 'weeklingo-v3-20260702';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './duolingo-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  // CDN - on les met en cache runtime, pas en precache
];

// Install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL.map(u => new Request(u, {cache:'reload'}))).catch(()=>{}))
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(()=> self.clients.claim())
  );
});

// Fetch - Cache first for app shell, network first for CDN / API
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache-first pour assets locaux
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkRes => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return networkRes;
        }).catch(()=> cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first pour CDN (Chart.js, fonts)
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }).catch(()=> caches.match(req))
  );
});

// Background sync placeholder (pour future synchro)
self.addEventListener('sync', event => {
  if (event.tag === 'weeklingo-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// Push notifications (préparé)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Weeklingo', {
      body: data.body || 'N’oublie pas ta streak Duolingo !',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
