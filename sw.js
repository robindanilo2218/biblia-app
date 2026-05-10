const CACHE_NAME = 'biblia-estudio-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/state.js',
    './js/constants.js',
    './js/utils.js',
    './js/db.js',
    './js/ui.js',
    './js/sidebar.js',
    './js/importExport.js',
    './js/editor.js',
    './js/main.js',
    './manifest.json',
    './icons/icon.svg'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

// Stale-While-Revalidate strategy for offline support and background updates
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                console.log('[Service Worker] Network request failed, using cache for:', event.request.url);
            });
            return cachedResponse || fetchPromise;
        })
    );
});
