// sw.js
const CACHE_NAME = 'v2.0';
const urlsToCache = [
    'index.html',
    'dashboard.html',
    'pos.html',
    'style.css',
    'auth.js',
    'db7.js',
    'app.js',
    'manifest.json',
    'assets/css/bootstrap.min.css',
    'assets/js/bootstrap.bundle.min.js',
    'logo.png'
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
