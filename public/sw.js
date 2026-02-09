const CACHE_NAME = 'nexus-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // NO interceptar llamadas API - dejarlas pasar al network
  if (request.method !== 'GET' || request.url.includes('/rest/') || request.url.includes('/auth/') || request.url.includes('/functions/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Solo cachear assets estáticos
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open('nexus-v1').then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
