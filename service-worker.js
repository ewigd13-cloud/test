const CACHE_NAME = 'whiteboard-photo-booth-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/index-rQ6P09Eo',
  './assets/style.css'
];

const externalResources = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(urlsToCache);
      for (const url of externalResources) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('外部リソースのキャッシュ失敗:', url, err);
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Reactルーティング対応（navigateモード）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(response => response || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            !(networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);

          return networkResponse;
        }).catch(err => {
          console.error('Fetch failed; returning offline fallback.', err);
          return caches.match('./index.html');
        });
      });
    })
  );
});
