/* Weeklingo PWA Service Worker v1.3 */
const CACHE_NAME = 'weeklingo-v3-20260702';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-144.png',
  './duolingo-logo.png',
  // mascottes (optionnelles - seront cachées à la demande)
  './mascotte1.png','./mascotte2.png','./mascotte3.png','./mascotte4.png',
  './mascotte5.png','./mascotte6.png','./mascotte7.png','./mascotte8.png',
  // ligues
  './bronze.png','./argent.png','./or.png','./saphir.png','./rubis.png',
  './emeraude.png','./amethyste.png','./perle.png','./obsidienne.png','./diamant.png'
];

// install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS.map(u => new Request(u, {cache:'reload'}))).catch(()=>{}))
  );
  self.skipWaiting();
});

// activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(()=> self.clients.claim())
  );
});

// fetch - Stale-while-revalidate for same-origin, network-first for API/CDN
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // CDN (chart.js) -> cache first with network update
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if(res.ok){
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c=>c.put(req, copy));
          }
          return res;
        }).catch(()=>cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // same-origin: cache-first, then network
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // update in background
        fetch(req).then(res => {
          if(res && res.ok){
            caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          }
        }).catch(()=>{});
        return cached;
      }
      return fetch(req).then(res => {
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req, copy));
        }
        return res;
      }).catch(()=> {
        // offline fallback -> index.html (SPA)
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// background sync placeholder
self.addEventListener('sync', event => {
  if (event.tag === 'weeklingo-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// push notifications (future)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {title:'Weeklingo', body:'N’oublie pas ta leçon !'};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Weeklingo', {
      body: data.body || 'C’est l’heure de ta streak Duolingo 🔥',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [120,60,120],
      data: { url: '/' }
    })
  );
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});

// periodic sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'weeklingo-backup') {
    event.waitUntil(Promise.resolve());
  }
});
