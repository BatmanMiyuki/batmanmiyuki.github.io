/* Service worker Platina : l'application fonctionne hors ligne.
   On ne met jamais en cache les appels vers PlayStation (relais compris). */

const SCOPE = self.registration.scope;
const CACHE_PREFIX = `platina:${new URL(SCOPE).pathname}:`;
const CACHE = `${CACHE_PREFIX}v2`;
const INDEX = new URL("index.html", SCOPE).href;

// Each GitHub Pages project has its own cache and service worker scope.
const scopedUrl = (path) => new URL(path, SCOPE).href;

const ASSETS = [
  "./",
  "./index.html",
  "./icon.svg",
  "./manifest.webmanifest",
  "./images/avatar.jpg",
  "./images/ps5.png",
  "./images/trophy-tile.jpg",
  "./images/g-elden.jpg",
  "./images/g-ghost.jpg",
  "./images/g-rdr.jpg",
  "./images/g-hogwarts.jpg",
  "./images/g-gow.jpg",
  "./images/g-spider.jpg",
  "./images/g-tlou.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(ASSETS.map((a) => cache.add(scopedUrl(a)).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const scopeUrl = new URL(SCOPE);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (await cache.match(req)) || (await cache.match(INDEX)) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      } catch {
        return Response.error();
      }
    }),
  );
});
