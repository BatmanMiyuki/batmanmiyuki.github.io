// Privara PWA - Service Worker (fichier externe)
const CACHE_NAME = 'privara-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/favicon-64.png'
];

// Install : met en cache le "shell" de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate : supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch : stratégie network-first pour la page, stale-while-revalidate pour le reste
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Ne pas intercepter les ressources externes (CDN, polices, etc.)
  if (url.origin !== location.origin) return;

  // Navigation (la page) : toujours essayer le réseau d'abord
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Autres ressources (icônes...) : cache d'abord, mise à jour en arrière-plan
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
