import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();

// @ts-ignore - self.__WB_MANIFEST is injected at build time by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// API: StaleWhileRevalidate — shows cached data instantly, fetches fresh in background
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// Fonts: CacheFirst — never re-fetch, expires yearly
registerRoute(
  ({ url }) => url.origin === location.origin && url.pathname.startsWith('/fonts/'),
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// Images & static assets: CacheFirst — cache aggressively
registerRoute(
  ({ url, request }) =>
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp|woff2?)$/),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Navigation: NetworkFirst with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'page-cache',
    networkTimeoutSeconds: 5,
  })
);

// Offline fallback — serve cached pages or basic fallback
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const cached = await caches.match(new Request('/index.html'));
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0f12;color:#e0e0e0;text-align:center;padding:20px}span{font-size:48px;margin-bottom:16px}h1{font-size:20px;margin:0 0 8px}p{color:#888;font-size:14px;margin:0}</style></head><body><span>📡</span><h1>No connection</h1><p>Check your internet and try again</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
  return Response.error();
});

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('push', (event) => {
  let data: Record<string, unknown> = {};
  try {
    data = event.data?.json() ?? {};
  } catch {}
  const title = (data.title as string) || 'ClassSpace';
  const options: NotificationOptions = {
    body: (data.body as string) || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: (data.tag as string) || 'default',
    data: data.data || {},
    requireInteraction: (data.requireInteraction as boolean) ?? false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = ((event.notification.data as any)?.url as string) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    self.clients.claim();
  }
});
