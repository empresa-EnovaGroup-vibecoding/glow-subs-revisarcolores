// CACHE_NAME: Cambiar la version fuerza a TODOS los usuarios a descargar
// los archivos nuevos. Si en el futuro haces otro cambio grande, cambia a v4, v5, etc.
const CACHE_NAME = 'nexus-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

// "install" = cuando la app se descarga por primera vez (o se actualiza)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // skipWaiting = no esperar, activar inmediatamente la version nueva
  self.skipWaiting();
});

// "activate" = cuando la version nueva toma control
// Borra TODAS las caches viejas (v2, v1, etc.)
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

  // No interceptar llamadas a Supabase (API, auth, storage)
  if (request.method !== 'GET' || request.url.includes('/rest/') || request.url.includes('/auth/') || request.url.includes('/functions/')) {
    event.respondWith(fetch(request));
    return;
  }

  // NETWORK-FIRST para TODO (HTML, CSS, JS)
  // Siempre intenta bajar la version nueva del servidor.
  // Solo si no hay internet, usa la version guardada en cache.
  // Antes era "cache-first" para CSS/JS, lo que causaba que la app
  // descargada usara archivos viejos y no se actualizara.
  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
