/* ====================================
   PUSH NOTIFICATIONS - Firebase Cloud Messaging
   ==================================== */

// Apps Script URL for sending push notifications (placeholder for now)
const PUSH_SERVER_URL = 'https://script.google.com/macros/s/AKfycbwIdYATZbE6BGgVTKUDFkVIfTcBbDhgATb5OPJeT-LWiU5sTrT8E_s4sNlCZTkpNqBQkg/exec';

let notificationPermission = 'default';
let fcmToken = null;

/* ====================================
   INITIALIZATION & TOKEN MANAGEMENT
   ==================================== */

/**
 * Initialize push notifications when user logs in
 */
async function initPushNotifications() {
  if (!messaging) {
    console.log('Firebase Messaging not available');
    return;
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  // Get current permission status
  notificationPermission = Notification.permission;
  console.log('Notification permission:', notificationPermission);

  // If already granted, get token
  if (notificationPermission === 'granted') {
    await getFCMToken();
  } else if (notificationPermission === 'default') {
    // Show a subtle hint about enabling notifications, but don't ask immediately
    console.log('Notifications available - user can enable in Settings');
  }
}

/**
 * Request notification permission (called on user interaction)
 */
async function requestNotificationPermission() {
  if (!messaging || notificationPermission === 'granted') {
    return notificationPermission === 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      await getFCMToken();
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token and store in Firestore
 */
async function getFCMToken() {
  if (!messaging) return null;

  try {
    const token = await messaging.getToken({ vapidKey: 'BBMmlPVPIGEP3UQZ26covkZFXfVFFpSbL6o7Tk6IkbEatHKSyzUCHHW9KMnMNweybWKLXpjyruSL5MHlQFyF0AA' });
    if (token) {
      console.log('FCM token retrieved:', token.substring(0, 20) + '...');
      fcmToken = token;
      await storeFCMToken(token);
      return token;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Store FCM token in Firestore
 */
async function storeFCMToken(token) {
  const user = getCurrentUser();
  if (!user || !db) return;

  try {
    // Store token with metadata
    await db.collection('pushTokens').doc(token).set({
      uid: user.uid,
      role: user.role || 'member',
      name: user.name,
      createdAt: firebase.firestore.Timestamp.now(),
      lastUsed: firebase.firestore.Timestamp.now(),
      userAgent: navigator.userAgent
    });
    console.log('FCM token stored in Firestore');
  } catch (error) {
    console.error('Error storing FCM token:', error);
  }
}

/**
 * Handle token refresh
 */
function setupTokenRefresh() {
  // Token refresh is handled automatically by getToken() in modern Firebase SDK
  // No need for onTokenRefresh — it's deprecated in compat v10+
  console.log('Token refresh handled by getToken()');
}

/* ====================================
   SENDING PUSH NOTIFICATIONS
   ==================================== */

/**
 * Send push notification via Apps Script server
 */
async function sendPushNotification(type, title, body, topic = 'all') {
  // Don't send push for our own actions
  const user = getCurrentUser();
  if (!user) return;

  try {
    const response = await fetch(PUSH_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        body,
        topic,
        senderUid: user.uid,
        url: `/${type === 'prayer' ? 'prayer' : type === 'bulletin' ? 'bulletin' : type === 'oos' ? 'schedule' : 'giving'}`
      })
    });

    if (response.ok) {
      console.log('Push notification sent:', { type, title, body, topic });
    } else {
      console.error('Failed to send push notification:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/* ====================================
   FOREGROUND MESSAGE HANDLING
   ==================================== */

/**
 * Handle messages when app is in foreground
 */
function setupForegroundMessaging() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log('Message received in foreground:', payload);
    
    // Show notification manually since we're in foreground
    const { title, body, icon, url } = payload.data || {};
    
    if (title && body) {
      // Show browser notification
      if (notificationPermission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: icon || '/ccr-app/icon-192.svg',
          tag: 'ccr-app-notification'
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (url) {
            // Navigate to the relevant page
            window.location.hash = url;
          }
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    }
  });
}

/* ====================================
   INTEGRATION FUNCTIONS
   ==================================== */

/**
 * Called after user login to initialize notifications
 */
function onUserLogin() {
  initPushNotifications();
  setupTokenRefresh();
  setupForegroundMessaging();
}

/**
 * Called when user logs out to clean up
 */
function onUserLogout() {
  fcmToken = null;
  // Note: We don't remove the token from Firestore on logout
  // so notifications can still reach the device if user logs back in
}

/**
 * Request notification permission with user context
 * Call this on first meaningful interaction, not on page load
 */
async function enableNotifications() {
  const granted = await requestNotificationPermission();
  if (granted) {
    // Show success message
    console.log('Notifications enabled successfully');
    return true;
  } else {
    // Show instruction to enable in browser settings
    console.log('Notifications blocked - user can enable in browser settings');
    return false;
  }
}

/**
 * Suggest enabling notifications on first content interaction
 * Called when user creates their first prayer, etc.
 */
async function suggestNotifications() {
  if (notificationPermission === 'default' && !localStorage.getItem('ccr_notifications_suggested')) {
    // Mark that we've suggested it
    localStorage.setItem('ccr_notifications_suggested', 'true');
    
    // Simple console message for now - could be a toast or modal
    console.log('💡 Tip: Enable notifications in Settings to get alerts for new prayers and announcements');
    
    // Could show a subtle toast here if desired
    return true;
  }
  return false;
}

/* ====================================
   UTILITY FUNCTIONS
   ==================================== */

/**
 * Check if notifications are supported and enabled
 */
function areNotificationsEnabled() {
  return 'Notification' in window && 
         Notification.permission === 'granted' && 
         messaging && 
         fcmToken;
}

/**
 * Get notification status for UI display
 */
function getNotificationStatus() {
  if (!('Notification' in window)) {
    return { status: 'unsupported', message: 'Notifications not supported' };
  }
  
  if (!messaging) {
    return { status: 'unavailable', message: 'Messaging not available' };
  }
  
  switch (Notification.permission) {
    case 'granted':
      return { status: 'enabled', message: 'Notifications enabled' };
    case 'denied':
      return { status: 'blocked', message: 'Notifications blocked' };
    default:
      return { status: 'prompt', message: 'Enable notifications' };
  }
}