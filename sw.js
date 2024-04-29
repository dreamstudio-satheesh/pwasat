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
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});


self.addEventListener('activate', event => {
    var cacheAllowlist = ['v2'];

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
