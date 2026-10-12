// QIE Yap Service Worker
// Versi cache — naikkan angka ini kalau mau force update
const CACHE_VERSION = 'qie-yap-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// File yang di-cache saat pertama install (app shell)
const PRECACHE_URLS = [
  '/',
  '/feed',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('qie-yap-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first untuk API, cache-first untuk static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip API calls (always fresh)
  if (url.pathname.startsWith('/api/')) return;

  // Skip external domains (CoinGecko, IPFS, dll)
  if (url.origin !== self.location.origin) return;

  // Network-first untuk HTML (biar selalu update)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Cache-first untuk static assets (JS, CSS, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Hanya cache response sukses
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
