const CACHE_NAME = 'weeklingo-v1';
const urlsToCache = [
  './',
  './index.html',
  // Ajoute ici tes images si tu veux qu'elles marchent hors-ligne !
  // 'duo-landing.png',
  // 'duolingo-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
