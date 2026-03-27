const CACHE_NAME = 'connect-valley-v4';
const STATIC_CACHE = 'cv-static-v4';
const DATA_CACHE = 'cv-data-v4';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Pages to precache for offline navigation
const APP_SHELL = [
  '/login',
  '/evento',
  '/evento/agenda',
  '/evento/networking',
  '/evento/patrocinadores',
  '/evento/mapa',
  '/evento/meu-perfil',
  '/evento/palestrantes',
];

// Install - precache static assets + app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(CACHE_NAME).then((cache) => {
        // Try to cache app shell pages (best effort)
        return Promise.allSettled(
          APP_SHELL.map((url) =>
            fetch(url)
              .then((res) => {
                if (res.ok) cache.put(url, res);
              })
              .catch(() => {})
          )
        );
      }),
    ])
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, STATIC_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes, auth, and extensions
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) return;
  if (!request.url.startsWith('http')) return;

  // Supabase auth and data API calls - Network only (no cache) to prevent stale tokens/data
  if (request.url.includes('/auth/') || request.url.includes('/rest/v1/')) {
    return;
  }

  // Supabase API calls - Network first, cache for offline
  if (request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(JSON.stringify({ data: [], error: 'offline' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503, // Service Unavailable — not 200, so client knows it's offline
            });
          });
        })
    );
    return;
  }

  // Static assets - Cache first
  if (
    request.url.includes('/icons/') ||
    request.url.includes('/favicon') ||
    request.url.includes('.svg') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Next.js static chunks - Cache first
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App pages - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;

          // For navigation requests, return cached home page (SPA fallback)
          if (request.mode === 'navigate') {
            return caches.match('/evento') || caches.match('/');
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
