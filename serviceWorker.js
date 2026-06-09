// Service Worker for handling push notifications

const CACHE_NAME = 'laundry-dashboard-v1';
const urlsToCache = ['/', 'logo192.png', 'logo512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Laundry Event';
  const options = {
    body: data.body || 'Your laundry status has changed.',
    icon: 'logo192.png',
    badge: 'logo192.png',
    tag: data.tag || 'laundry-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      appliance: data.appliance,
      event: data.event,
      timestamp: data.timestamp,
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url
    ? new URL(notificationData.url, self.registration.scope).href
    : self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event.notification.tag);
});
