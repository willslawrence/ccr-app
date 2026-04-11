/* ====================================
   FIREBASE CONFIGURATION
   ==================================== */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBObs_aGSXFl2Ph4KWz3ohwgvNSbQSmr9I",
  authDomain: "ccr-church-app.firebaseapp.com",
  projectId: "ccr-church-app",
  storageBucket: "ccr-church-app.firebasestorage.app",
  messagingSenderId: "139840828810",
  appId: "1:139840828810:web:4f9f275a491eed430e8473"
};

// Firebase SDK loaded via CDN <script> tags in index.html
// Initialize Firebase
let app, auth, db, messaging, storage;

let _storageLoaded = false;
let _messagingLoaded = false;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    db.enablePersistence({ synchronizeTabs: true })
      .then(() => console.log('Firestore offline persistence enabled'))
      .catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence not supported in this browser');
        }
      });
    // Storage + Messaging loaded on demand (not needed at startup)
    console.log('Firebase initialized successfully');
    return true;
  } else {
    console.warn('Firebase SDK not loaded - using localStorage fallback');
    return false;
  }
}

// Lazy-load Firebase Storage SDK when first needed
async function ensureStorage() {
  if (_storageLoaded && storage) return storage;
  if (typeof firebase !== 'undefined' && firebase.storage) {
    storage = firebase.storage();
    _storageLoaded = true;
    return storage;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js';
    s.onload = () => { storage = firebase.storage(); _storageLoaded = true; resolve(storage); };
    s.onerror = () => reject(new Error('Failed to load Firebase Storage'));
    document.head.appendChild(s);
  });
}

// Lazy-load Firebase Messaging SDK when first needed
async function ensureMessaging() {
  if (_messagingLoaded && messaging) return messaging;
  if (typeof firebase !== 'undefined' && firebase.messaging && firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
    _messagingLoaded = true;
    return messaging;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js';
    s.onload = () => {
      try {
        if (firebase.messaging.isSupported()) {
          messaging = firebase.messaging();
          _messagingLoaded = true;
          resolve(messaging);
        } else {
          reject(new Error('Messaging not supported'));
        }
      } catch(e) { reject(e); }
    };
    s.onerror = () => reject(new Error('Failed to load Firebase Messaging'));
    document.head.appendChild(s);
  });
}
