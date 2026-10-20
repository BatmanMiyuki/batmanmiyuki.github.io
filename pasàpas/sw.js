/* Pas à pas — service worker pour GitHub Pages et le mode hors connexion. */
const CACHE_PREFIX = 'pas-a-pas-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_ROOT = self.registration.scope;
const appUrl = (path) => new URL(path, APP_ROOT).href;
const APP_SHELL = [
  appUrl('index.html'),
  appUrl('manifest.json'),
  appUrl('icons/icon.svg'),
  appUrl('icons/icon-192.png'),
  appUrl('icons/icon-512.png'),
  appUrl('icons/icon-maskable-512.png'),
  appUrl('icons/apple-touch-icon.png')
];
const OFFLINE_PAGE = appUrl('index.html');

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok && response.type !== 'opaque') {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request))
          || (await cache.match(OFFLINE_PAGE))
          || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type !== 'opaque') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});

/* Ouvre l'app si une future notification système est sélectionnée. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(APP_ROOT) && 'focus' in client) return client.focus();
    }
    return self.clients.openWindow(APP_ROOT);
  })());
});
