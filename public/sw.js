const CACHE_NAME = 'mitra-banten-news-v1';
const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'content-sync';
const MAX_RETRY_COUNT = 3;

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

const DB_NAME = 'sync-queue-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function getSyncQueue() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function addToSyncQueueDB(action) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

async function removeFromSyncQueueDB(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

async function clearSyncQueueDB() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

function getEndpointForAction(action) {
  switch (action.type) {
    case 'reading_history':
      return '/api/sync/reading-history';
    case 'bookmark':
      return '/api/sync/bookmark';
    case 'recommendation_click':
      return '/api/sync/recommendation-click';
    default:
      return '/api/sync/unknown';
  }
}

async function processSyncQueue() {
  const queue = await getSyncQueue();
  if (queue.length === 0) return { successful: 0, failed: 0 };

  const results = { successful: 0, failed: 0 };

  for (const action of queue) {
    if (action.retryCount >= MAX_RETRY_COUNT) {
      await removeFromSyncQueueDB(action.id);
      continue;
    }

    try {
      const endpoint = getEndpointForAction(action);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });

      if (response.ok) {
        await removeFromSyncQueueDB(action.id);
        results.successful++;
      } else {
        action.retryCount = (action.retryCount || 0) + 1;
        await addToSyncQueueDB(action);
        results.failed++;
      }
    } catch {
      action.retryCount = (action.retryCount || 0) + 1;
      await addToSyncQueueDB(action);
      results.failed++;
    }
  }

  return results;
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('wordpress') ||
         url.hostname.includes('mitrabantennews.com/wp-json');
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return caches.match('/offline.html');
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return caches.match('/offline.html');
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse || caches.match('/offline.html'));

  return cachedResponse || fetchPromise;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidateStrategy(event.request));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(
      processSyncQueue().then(results => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETED',
              successful: results.successful,
              failed: results.failed,
            });
          });
        });
      })
    );
  }
});

self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      processSyncQueue().then(results => {
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETED',
              successful: results.successful,
              failed: results.failed,
            });
          });
        });
      })
    );
  }
});

self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New content available',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Mitra Banten News', options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});