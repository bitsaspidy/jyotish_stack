/* Jyotish Stack service worker — PWA install + web push */
const CACHE = 'js-static-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isSafeStaticResponse(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return false;

  const path = new URL(request.url).pathname.toLowerCase();
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  // A reverse proxy may return an HTML error document for a missing chunk.
  // Never store that response under a JavaScript or stylesheet cache key.
  if (path.endsWith('.js')) return contentType.includes('javascript');
  if (path.endsWith('.css')) return contentType.includes('text/css');
  return !contentType.includes('text/html');
}

// Network-first passthrough; cache only valid same-origin static assets as fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Never cache API or auth-bound pages
  if (url.pathname.startsWith('/api/')) return;

  const isStatic = /\.(js|css|woff2?|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)
    || url.pathname.startsWith('/_next/static/');
  if (!isStatic) return;

  event.respondWith(
    fetch(event.request)
      .then(async (res) => {
        if (!res.ok) {
          const cached = await caches.match(event.request);
          return cached || res;
        }

        if (isSafeStaticResponse(event.request, res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return Response.error();
      })
  );
});

// ── Web push ──────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Jyotish Stack', body: event.data?.text() || '' }; }

  const title = data.title || '🔯 Jyotish Stack';
  const options = {
    body: data.body || '',
    icon: '/logo-icon.svg',
    badge: '/logo-icon.svg',
    tag: data.tag || 'jyotish-daily',
    renotify: false,
    data: { url: data.url || '/horoscope' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/horoscope';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
