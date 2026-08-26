// Privara PWA - Service Worker (fichier externe)
const CACHE_NAME = 'privara-v4';
const SHARE_DB_NAME = 'PrivaraShareDB';
const ASSETS = [
  './',
  './index.html',
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

// ==================== Partage externe (Web Share Target) ====================
// Base temporaire qui reçoit les fichiers partagés ; l'application les lira
function openShareDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('shares')) {
        d.createObjectStore('shares', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeSharedFiles(files) {
  const db = await openShareDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shares', 'readwrite');
    const store = tx.objectStore('shares');
    files.forEach((file) => {
      // name/type stockés séparément par robustesse (le nom est préservé
      // par les navigateurs, mais on couvre tous les cas)
      store.add({ file, name: file.name || '', type: file.type || '', receivedAt: Date.now() });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Fetch : stratégie network-first pour la page, stale-while-revalidate pour le reste
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Partage reçu depuis le système (POST multipart sur ./share)
  if (request.method === 'POST') {
    event.respondWith((async () => {
      try {
        const url = new URL(request.url);
        // Seule notre cible de partage est traitée
        if (!url.pathname.endsWith('/share')) {
          return new Response('Non trouvé', { status: 404 });
        }
        const formData = await request.formData();
        const files = (formData.getAll('media') || []).filter((f) => f && f.size > 0);
        if (files.length > 0) {
          await storeSharedFiles(files);
        }
      } catch (err) {
        console.warn('[SW] Erreur lors du partage :', err);
      }
      // Redirige vers l'application, qui proposera le choix du dossier
      const dest = new URL('./index.html?shared=1', self.location.href);
      return Response.redirect(dest.href, 303);
    })());
    return;
  }

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Ne pas intercepter les ressources externes (CDN, polices, etc.)
  if (url.origin !== location.origin) return;

  // Le manifest doit TOUJOURS être frais : le navigateur le relit pour
  // détecter le share_target. On ne le sert jamais depuis le cache.
  if (url.pathname.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

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
