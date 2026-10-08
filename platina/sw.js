/* Service worker Platina : l'application fonctionne hors ligne.
   On ne met jamais en cache les appels vers PlayStation : la synchronisation
   passe par le workflow GitHub, qui publie psn-data.json. */

const SCOPE = self.registration.scope;
const CACHE_PREFIX = `platina:${new URL(SCOPE).pathname}:`;
const CACHE = `${CACHE_PREFIX}v4`;
const INDEX = new URL("index.html", SCOPE).href;

// Chaque site GitHub Pages a son propre cache et sa propre portée.
const scopedUrl = (path) => new URL(path, SCOPE).href;

const ASSETS = [
  "index.html",
  "icon.svg",
  "manifest.webmanifest",
  "images/avatar.jpg",
  "images/ps5.png",
  "images/trophy-tile.jpg",
  "images/apple-touch-icon.png",
  "images/icon-192.png",
  "images/icon-512.png",
  "images/icon-maskable-512.png",
  "images/g-elden.jpg",
  "images/g-ghost.jpg",
  "images/g-rdr.jpg",
  "images/g-hogwarts.jpg",
  "images/g-gow.jpg",
  "images/g-spider.jpg",
  "images/g-tlou.jpg",
];

/** Toujours relire ces fichiers sur le réseau : ce sont des données fraîches. */
const LIVE_FILES = ["psn-data.json", "pstat-accounts.json"];

const isLive = (url) => LIVE_FILES.some((file) => url.pathname.endsWith(`/${file}`));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(ASSETS.map((asset) => cache.add(scopedUrl(asset)).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
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
          caches.open(CACHE).then((cache) => cache.put(req, copy));
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
      // Les données publiées par les workflows ne sont jamais servies périmées.
      if (isLive(url)) {
        try {
          const res = await fetch(req);
          if (res.ok) await cache.put(req, res.clone());
          return res;
        } catch {
          return (await cache.match(req)) || Response.error();
        }
      }

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
