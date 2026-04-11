/* ====================================
   SERVICE WORKER
   Offline caching for PWA + Push Notifications
   ==================================== */

const CACHE_NAME = 'ccr-app-v32';
const APP_VERSION = '3.2';

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

// Pre-cache all app assets on install for instant subsequent loads
const PRECACHE_URLS = [
  './',
  'index.html',
  'css/app.css?v=2.10.0',
  'js/firebase.js?v=' + APP_VERSION,
  'js/app.js?v=' + APP_VERSION,
  'js/home.js?v=' + APP_VERSION,
  'js/auth.js?v=' + APP_VERSION,
  'js/prayer.js?v=' + APP_VERSION,
  'js/bulletin.js?v=' + APP_VERSION,
  'js/documents.js?v=' + APP_VERSION,
  'js/notifications.js?v=' + APP_VERSION,
  // Lazy scripts — pre-cached so first navigation is instant
  'js/schedule.js?v=' + APP_VERSION,
  'js/library.js?v=' + APP_VERSION,
  'js/giving.js?v=' + APP_VERSION,
  'js/charities-data.js?v=' + APP_VERSION,
  'js/bible.js?v=' + APP_VERSION,
  'js/bible-reading-plan.js?v=' + APP_VERSION,
  'js/luke2444-plan.js?v=' + APP_VERSION,
  'js/sermons.js?v=' + APP_VERSION,
  'js/vote.js?v=' + APP_VERSION,
  'js/settings.js?v=' + APP_VERSION
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3 (app ' + APP_VERSION + ')...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Pre-cache partial failure:', err);
        self.skipWaiting();
      })
  );
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

// Fetch event - stale-while-revalidate (instant from cache, update in background)
// API/Firestore calls bypass cache and go network-only
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Network-only for API calls (Firebase, external APIs)
  const url = new URL(event.request.url);
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('gstatic.com')) {
    return; // let browser handle normally
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Always fetch in background to update cache
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse); // network fail = use cache

        // Return cached version immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
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
