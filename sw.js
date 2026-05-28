// Service Worker for Rosaline Bela - Interactive Novel Platform
const CACHE_NAME = 'rosaline-bela-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/robots.txt'
];

// Install Event - Pre-cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline experience app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Smart Caching Strategy
// 1. Static Assets / Scripts / Fonts: Cache First (Fast Loading, Offline Ready)
// 2. Images (Unsplash Covers): Cache first, background network update
// 3. API / HTML: Network first with offline fallback (Guarantees fresh chapters)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle local application routes & root index
  if (requestUrl.origin === self.location.origin) {
    // If requesting the direct HTML page, prioritize network to fetch latest live novels, fallback to cached index if offline
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Keep a fresh copy in the cache
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseCopy));
            return response;
          })
          .catch(() => caches.match('/'))
      );
      return;
    }

    // For static files (css, js, assets, fonts), go cache-first
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
  } else {
    // Handling third-party assets (Unsplash photos, Google Fonts, etc.)
    // Cache First with background refreshing for covers/fonts to prevent flickering
    if (requestUrl.host.includes('unsplash.com') || requestUrl.host.includes('googleapis.com') || requestUrl.host.includes('gstatic.com')) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        })
      );
    }
  }
});
