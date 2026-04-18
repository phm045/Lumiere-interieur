// Service Worker — Une Voix Intérieure
// Cache-first pour les assets statiques, network-first pour les données

const CACHE_NAME = 'voix-interieure-v1';
const STATIC_ASSETS = [
  '/',
  './index.html',
  './style.css',
  './base.css',
  './app.js',
  './logo-horizontal.png',
  './logo-lumiere-interieure.png',
  './hero-voyance.png',
  './manifest.json'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch : stratégie hybride
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Ne pas intercepter les requêtes Supabase, API externes, ou POST
  if (event.request.method !== 'GET') return;
  if (url.includes('supabase.co') || url.includes('ipwho.is') ||
      url.includes('stripe') || url.includes('paypal') ||
      url.includes('cal.com') || url.includes('brevo')) return;

  // Cache-first pour les assets statiques (CSS, JS, images)
  if (url.match(/\.(css|js|png|jpg|jpeg|webp|woff2?|svg|ico)(\?|$)/)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first pour les pages HTML (toujours à jour)
  if (url.includes('.html') || !url.includes('.')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('./index.html');
      })
    );
  }
});
