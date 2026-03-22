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
let app, auth, db;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
    return true;
  } else {
    console.warn('Firebase SDK not loaded - using localStorage fallback');
    return false;
  }
}
