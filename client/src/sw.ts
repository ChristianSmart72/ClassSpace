import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();

// @ts-ignore - self.__WB_MANIFEST is injected at build time by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === location.origin && url.pathname.startsWith('/fonts/'),
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'page-cache',
  })
);

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
