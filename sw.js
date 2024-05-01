// sw.js
const CACHE_NAME = 'v2.2';
const urlsToCache = [
    'https://pwa.satsweets.com/index.html',
    'https://pwa.satsweets.com/dashboard.html',
    'https://pwa.satsweets.com/pos.html',
    'https://pwa.satsweets.com/style21.css',
    'https://pwa.satsweets.com/select2.min.css',
    'https://pwa.satsweets.com/auth.js',
    'https://pwa.satsweets.com/dba12.js',
    'https://pwa.satsweets.com/app.js',
    'https://pwa.satsweets.com/select2.min.js',
    'https://pwa.satsweets.com/jquery.min.js',
    'https://pwa.satsweets.com/manifest.json',
    'https://pwa.satsweets.com/assets/css/bootstrap.min.css',
    'https://pwa.satsweets.com/assets/js/bootstrap.bundle.min.js',
    'https://pwa.satsweets.com/logo.png',
    'https://pwa.satsweets.com/favicon.png'
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

let authToken = null;

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SET_TOKEN') {
        authToken = event.data.token;
    }
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === 'https://app.satsweets.com' && requestUrl.pathname.startsWith('/storage/')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                const headers = new Headers(event.request.headers);
                if (authToken) {
                    headers.append('Authorization', `Bearer ${authToken}`);
                }

                const modifiedRequest = new Request(event.request, {
                    mode: 'cors',
                    headers: headers
                });

                return fetch(modifiedRequest).then(response => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
    } else {
        const headers = new Headers(event.request.headers);
        if (authToken) {
            headers.append('Authorization', `Bearer ${authToken}`);
        }

        const modifiedRequest = new Request(event.request, {
            headers: headers
        });

        event.respondWith(
            fetch(modifiedRequest).catch(() => {
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
