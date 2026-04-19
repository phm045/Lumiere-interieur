// Service Worker — Une Voix Intérieure
// Stratégie : network-first pour le code (JS/CSS/HTML), cache-first pour les images
// IMPORTANT : bumper CACHE_NAME à chaque déploiement de code critique pour forcer
// la purge des anciens assets (iOS garde le SW très longtemps en cache).

const CACHE_NAME = 'voix-interieure-v7-2026-04-19-rubriques';
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
      // addAll échoue si un seul asset manque : utiliser add() individuel tolérant
      return Promise.all(
        STATIC_ASSETS.map(function(url) {
          return cache.add(url).catch(function() {/* ignorer si 404 */});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activation : suppression des anciens caches + prise de contrôle immédiate
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

// Helpers
function isCodeAsset(url) {
  return /\.(css|js)(\?|$)/.test(url);
}
function isImageAsset(url) {
  return /\.(png|jpg|jpeg|webp|svg|ico|woff2?)(\?|$)/.test(url);
}
function isHtmlOrRoot(url) {
  return /\.html(\?|$)/.test(url) || !/\.[a-z0-9]+(\?|$)/i.test(url);
}

// Network-first avec fallback cache (1.5s timeout)
function networkFirst(request) {
  return new Promise(function(resolve) {
    var timeoutId = setTimeout(function() {
      caches.match(request).then(function(cached) {
        if (cached) resolve(cached);
      });
    }, 1500);

    fetch(request).then(function(response) {
      clearTimeout(timeoutId);
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone).catch(function() {/* ignorer */});
        });
      }
      resolve(response);
    }).catch(function() {
      clearTimeout(timeoutId);
      caches.match(request).then(function(cached) {
        resolve(cached || new Response('', { status: 504 }));
      });
    });
  });
}

// Cache-first pour images (ne changent quasi jamais)
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone).catch(function() {/* ignorer */});
        });
      }
      return response;
    });
  });
}

// Fetch : stratégie par type de ressource
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Ne pas intercepter : requêtes non-GET, domaines externes sensibles
  if (event.request.method !== 'GET') return;
  if (url.includes('supabase.co') || url.includes('ipwho.is') || url.includes('ipapi.co') ||
      url.includes('stripe') || url.includes('paypal') ||
      url.includes('cal.com') || url.includes('brevo') ||
      url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') ||
      url.includes('fontshare.com') || url.includes('unpkg.com') ||
      url.includes('cdn.jsdelivr.net') || url.includes('googletagmanager.com')) {
    return;
  }

  // Code (JS/CSS) → network-first (fixes toujours déployés rapidement)
  if (isCodeAsset(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Images / fonts → cache-first
  if (isImageAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML / root → network-first
  if (isHtmlOrRoot(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }
});

// Message channel : permet au client de déclencher un skipWaiting pour update immédiat
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
