// Bump this version string any time you change any cached file.
// It forces the service worker to re-cache everything on next load.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `mck-offline-${CACHE_VERSION}`;

// Every file the app needs to run with zero connection.
// If you add a new page or asset, add it here too.
const PRECACHE_URLS = [
  './',
  './index.html',
  './self-check-medaid.html',
  './self-check-ntd.html',
  './scenario.html',
  './sorting.html',
  './offline.html',
  './manifest.json',
  './register-sw.js',
  './fonts/fonts.css',
  './fonts/poppins-latin-400-normal.woff2',
  './fonts/poppins-latin-500-normal.woff2',
  './fonts/poppins-latin-600-normal.woff2',
  './fonts/poppins-latin-700-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Cache-first: serve from cache instantly if we have it (this is what
// makes the app open with no spinner and no network wait, online or not).
// Falls back to network for anything not precached, and to offline.html
// for page navigations that fail with no cache and no connection.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
    })
  );
});
