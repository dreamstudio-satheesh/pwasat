// sw.js
const CACHE_NAME = 'v2.5';
const urlsToCache = [
    'https://pwa.satsweets.com/index.html',
    'https://pwa.satsweets.com/dashboard.html',
    'https://pwa.satsweets.com/pos.html',
    'https://pwa.satsweets.com/style22.css',
    'https://pwa.satsweets.com/auth.js',
    'https://pwa.satsweets.com/dba16.js',
    'https://pwa.satsweets.com/app.js',
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
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
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
