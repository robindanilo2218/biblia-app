const CACHE_NAME = 'biblia-estudio-v5';
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

// Stale-While-Revalidate para assets estáticos, network-only para JSON de datos
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    const url = event.request.url;
    // No cachear JSONs de datos grandes (solo cachear assets de la app)
    const isDataJson = url.endsWith('biblia.json') || url.endsWith('estudiobiblico.json') || url.includes('/api/');
    if (isDataJson) {
        event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify([]), {headers:{'Content-Type':'application/json'}})));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Solo cachear respuestas válidas de assets
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                console.log('[SW] Offline, usando caché:', url);
            });
            return cachedResponse || fetchPromise;
        })
    );
});
