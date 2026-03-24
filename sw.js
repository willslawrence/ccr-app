/* ====================================
   SERVICE WORKER
   Offline caching for PWA + Push Notifications
   ==================================== */

const CACHE_NAME = 'ccr-app-v71';
const APP_VERSION = '2.6.2';

// Firebase configuration for service worker
const firebaseConfig = {
  apiKey: "AIzaSyBObs_aGSXFl2Ph4KWz3ohwgvNSbQSmr9I",
  authDomain: "ccr-church-app.firebaseapp.com",
  projectId: "ccr-church-app",
  storageBucket: "ccr-church-app.firebasestorage.app",
  messagingSenderId: "139840828810",
  appId: "1:139840828810:web:4f9f275a491eed430e8473"
};

// Import Firebase scripts for push messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3 (app ' + APP_VERSION + ')...');
  self.skipWaiting();
});

// Activate event - clean ALL old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback from cache
        return caches.match(event.request);
      })
  );
});

/* ====================================
   PUSH NOTIFICATION HANDLERS
   ==================================== */

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon, url } = payload.data || {};
  
  if (title && body) {
    const notificationTitle = title;
    const notificationOptions = {
      body,
      icon: icon || '/ccr-app/icon-192.svg',
      badge: '/ccr-app/icon-192.svg',
      tag: 'ccr-app-notification',
      data: {
        url: url || '/ccr-app/'
      },
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open or focus the app
  const urlToOpen = event.notification.data?.url || '/ccr-app/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window/tab with the app
        for (let client of clientList) {
          if (client.url.includes('ccr-app') && 'focus' in client) {
            // Navigate to specific page if needed
            if (urlToOpen !== '/ccr-app/') {
              client.postMessage({ type: 'navigate', url: urlToOpen });
            }
            return client.focus();
          }
        }
        
        // No existing window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
