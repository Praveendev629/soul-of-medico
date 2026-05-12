const CACHE_NAME = 'soul-of-medico-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/onboarding.html',
  '/signin.html',
  '/.env',
  '/manifest.json',
  '/assets/logo.jpeg',
  '/assets/mcq.png',
  '/assets/lecture.png',
  '/assets/ai.png',
  '/assets/login.png',
  'https://cdn.tailwindcss.com'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (except Tailwind CSS)
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('tailwindcss.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails, try to serve from cache
            console.log('Service Worker: Network failed, trying cache');
            return caches.match(event.request);
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New study reminder from Soul of Medico!',
    icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' fill=\'%232563eb\'/%3E%3Ccircle cx=\'96\' cy=\'96\' r=\'60\' fill=\'none\' stroke=\'%2386efac\' stroke-width=\'8\'/%3E%3Cpath d=\'M76 66 L76 126 L116 96 Z\' fill=\'%2386efac\'/%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Ccircle cx=\'96\' cy=\'96\' r=\'20\' fill=\'%2386efac\'/%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' fill=\'%232563eb\'/%3E%3Ctext x=\'96\' y=\'96\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%2386efac\' font-size=\'48\' font-family=\'Arial\'%3E▶%3C/text%3E%3C/svg%3E'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' fill=\'%232563eb\'/%3E%3Ctext x=\'96\' y=\'96\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%2386efac\' font-size=\'48\' font-family=\'Arial\'%3E✕%3C/text%3E%3C/svg%3E'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Soul of Medico', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
function doBackgroundSync() {
  // Handle offline actions here
  console.log('Service Worker: Performing background sync');
  return Promise.resolve();
}
