// ── Pagot Piano Studio · Service Worker ──────────────────────────────────────
// Version : met à jour CACHE_NAME à chaque déploiement pour forcer le refresh
const CACHE_NAME = 'pps-v1';

// Fichiers à mettre en cache au démarrage (shell de l'app)
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// ── Installation : mise en cache du shell ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Erreur install', err))
  );
});

// ── Activation : nettoyage des anciens caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : network-first pour les samples audio, cache-first sinon ────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Toujours réseau pour les samples piano (CDN externe)
  if (url.includes('gleitz.github.io')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first pour le reste (shell HTML/CSS/JS, icônes…)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html')); // fallback offline
    })
  );
});
