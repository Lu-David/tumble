// Service Worker for handling push notifications

const CACHE_NAME = 'laundry-dashboard-v1';
const urlsToCache = ['/'];

// === IndexedDB functions ===
const DB_NAME = 'gosslens-notifications';
const STORE_NAME = 'events';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function getStoredEventIds() {
  return openDB().then((database) => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const ids = new Set(request.result.map(e => e.id));
        resolve(ids);
      };
    });
  });
}

function addEventId(eventId) {
  return openDB().then((database) => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: eventId, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

function clearOldEventIds(maxAge = 7 * 24 * 60 * 60 * 1000) {
  return openDB().then((database) => {
    const cutoffTime = Date.now() - maxAge;
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const toDelete = request.result
          .filter(e => e.timestamp < cutoffTime)
          .map(e => e.id);

        toDelete.forEach(id => {
          store.delete(id);
        });

        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
      };
    });
  });
}

// === Service Worker lifecycle ===

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Your laundry is done!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: data.tag || 'laundry-notification',
    requireInteraction: true, // Keep notification until user interacts
    vibrate: [200, 100, 200],
    data: {
      appliance: data.appliance,
      event: data.event,
      timestamp: data.timestamp,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Laundry Alert', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Periodic background sync - check for new events periodically
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-laundry-events') {
    event.waitUntil(checkForNewEvents());
  }
});

// Check API for new events and show notifications
async function checkForNewEvents() {
  try {
    const WAN_BASE = 'https://gosslens.ludavidyi.us';
    const EVENTS_PATH = '/events';

    console.log('🔄 [Service Worker] Checking for new laundry events...');

    // Fetch events from API
    const response = await fetch(`${WAN_BASE}${EVENTS_PATH}?page=1&limit=50`);
    if (!response.ok) {
      console.warn('Failed to fetch events:', response.status);
      return;
    }

    const data = await response.json();
    const events = data.events || [];

    if (events.length === 0) {
      console.log('✓ No events found');
      return;
    }

    console.log(`✓ Found ${events.length} events from API`);

    // Get stored event IDs
    const storedIds = await getStoredEventIds();
    console.log(`✓ Stored ${storedIds.size} previously seen event IDs`);

    // Find new events
    const newEvents = events.filter(e => !storedIds.has(e.id));
    console.log(`✓ Found ${newEvents.length} new events`);

    // Show notifications for new events
    for (const event of newEvents) {
      await showEventNotification(event);
      await addEventId(event.id);
    }

    // Clean up old stored IDs
    await clearOldEventIds();
  } catch (err) {
    console.error('❌ Error in background sync:', err);
  }
}

// Show notification for an event
async function showEventNotification(event) {
  try {
    const appliance = 'Dryer'; // Currently only tracking dryer
    let title, body;

    switch (event.event) {
      case 'STARTED':
        title = `${appliance} Started`;
        body = `Your ${appliance.toLowerCase()} has started.`;
        break;
      case 'DONE':
        title = `${appliance} Complete!`;
        body = `Your ${appliance.toLowerCase()} has finished.`;
        break;
      default:
        title = `${appliance} Event`;
        body = `Your ${appliance.toLowerCase()}: ${event.event}`;
    }

    console.log(`📢 [Service Worker] Showing notification: ${title}`);

    const options = {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `dryer-${event.timestamp}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        appliance,
        event: event.event,
        timestamp: event.timestamp,
      },
    };

    await self.registration.showNotification(title, options);
    console.log(`✓ Notification shown: ${title}`);
  } catch (err) {
    console.error('❌ Failed to show notification:', err);
  }
}
