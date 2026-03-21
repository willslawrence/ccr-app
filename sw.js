/* ====================================
   SERVICE WORKER
   Offline caching for PWA
   ==================================== */

const CACHE_NAME = 'ccr-app-v2';

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  self.skipWaiting();
});

// Activate event - clean ALL old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback from cache
        return caches.match(event.request);
      })
  );
});
