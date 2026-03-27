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
    storage = firebase.storage();

    // Initialize Firebase Messaging (VAPID key passed at getToken time, not here)
    try {
      if (firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
        console.log('Firebase Messaging initialized');
      } else {
        console.warn('Firebase Messaging not supported in this browser');
      }
    } catch(e) {
      console.warn('Firebase Messaging init failed:', e.message);
    }
    
    console.log('Firebase initialized successfully');
    return true;
  } else {
    console.warn('Firebase SDK not loaded - using localStorage fallback');
    return false;
  }
}
