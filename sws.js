// sw.js
const CACHE_NAME = 'v2.5';
const urlsToCache = [
    'https://pwa.satsweets.com/index.html',
    'https://pwa.satsweets.com/dashboard.html',
    'https://pwa.satsweets.com/pos.html',
    'https://pwa.satsweets.com/style22.css',
    'https://pwa.satsweets.com/autha.js',
    'https://pwa.satsweets.com/dba16.js',
    'https://pwa.satsweets.com/appa.js',
    'https://pwa.satsweets.com/manifest.json',
    'https://pwa.satsweets.com/assets/css/bootstrap.min.css',
    'https://pwa.satsweets.com/assets/js/bootstrap.bundle.min.js',
    'https://pwa.satsweets.com/logo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Define a strategy for caching product thumbnails
    if (requestUrl.origin === 'https://app.satsweets.com' && requestUrl.pathname.startsWith('/storage/')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    // If the image is already cached, return it
                    return cachedResponse;
                }

                // Otherwise, fetch the image with CORS, cache it, and return it
                return fetch(event.request, { mode: 'no-cors' }).then(response => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
    } else {
        // For other requests, try to fetch from network first, then fallback to cache
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});

self.addEventListener('activate', event => {
    var cacheAllowlist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (cacheAllowlist.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
