// IndexedDB utility for persistent event tracking
// Works in Service Worker and main thread

const DB_NAME = 'gosslens-notifications';
const STORE_NAME = 'events';
const DB_VERSION = 1;

let db = null;

async function openDB() {
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

// Get all stored event IDs
async function getStoredEventIds() {
  const database = await openDB();
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
}

// Add event ID to store
async function addEventId(eventId) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id: eventId, timestamp: Date.now() });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Add multiple event IDs
async function addEventIds(eventIds) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    eventIds.forEach(id => {
      store.put({ id, timestamp: Date.now() });
    });

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

// Clear old event IDs (keep only recent ones)
async function clearOldEventIds(maxAge = 7 * 24 * 60 * 60 * 1000) {
  const database = await openDB();
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
}
