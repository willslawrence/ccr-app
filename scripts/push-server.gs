/**
 * CCR Church App Push Notification Server
 * Google Apps Script to send FCM push notifications
 * 
 * Setup:
 * 1. Create new Google Apps Script project
 * 2. Paste this code
 * 3. Add service account JSON as script property "SERVICE_ACCOUNT_JSON"
 * 4. Deploy as web app (Execute as: Me, Who has access: Anyone)
 * 5. Copy the web app URL to replace PUSH_SERVER_URL in notifications.js
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received push request:', data);
    
    const { type, title, body, topic, senderUid, url } = data;
    
    if (!type || !title || !body) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Send the notification
    const result = sendFCMNotification({
      type,
      title,
      body,
      topic: topic || 'all',
      senderUid,
      url: url || '/ccr-app/'
    });
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Push server error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendFCMNotification(params) {
  const { type, title, body, topic, senderUid, url } = params;
  
  try {
    // Get access token
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }
    
    // Get FCM tokens from Firestore
    const tokens = getFCMTokens(topic, senderUid);
    if (tokens.length === 0) {
      console.log('No tokens found for topic:', topic);
      return { success: true, sent: 0, message: 'No recipients' };
    }
    
    // Send to each token
    let successCount = 0;
    let errorCount = 0;
    
    tokens.forEach(tokenData => {
      try {
        const payload = {
          message: {
            token: tokenData.token,
            data: {
              type,
              title,
              body,
              url: url || '/ccr-app/',
              icon: '/img/icon-192.png'
            },
            android: {
              notification: {
                title,
                body,
                icon: '/img/icon-192.png',
                click_action: url || '/ccr-app/'
              }
            },
            apns: {
              payload: {
                aps: {
                  alert: {
                    title,
                    body
                  },
                  badge: 1,
                  sound: 'default'
                }
              }
            },
            webpush: {
              notification: {
                title,
                body,
                icon: '/img/icon-192.png',
                data: { url: url || '/ccr-app/' }
              }
            }
          }
        };
        
        const response = UrlFetchApp.fetch(
          'https://fcm.googleapis.com/v1/projects/ccr-church-app/messages:send',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json'
            },
            payload: JSON.stringify(payload)
          }
        );
        
        if (response.getResponseCode() === 200) {
          successCount++;
        } else {
          console.error('FCM error for token:', tokenData.token.substring(0, 10) + '...', response.getContentText());
          errorCount++;
        }
        
      } catch (tokenError) {
        console.error('Error sending to token:', tokenData.token.substring(0, 10) + '...', tokenError);
        errorCount++;
      }
    });
    
    console.log(`Push notification sent: ${successCount} success, ${errorCount} errors`);
    return { 
      success: true, 
      sent: successCount, 
      errors: errorCount,
      total: tokens.length 
    };
    
  } catch (error) {
    console.error('FCM send error:', error);
    return { success: false, error: error.toString() };
  }
}

function getAccessToken() {
  try {
    // Get service account JSON from script properties
    const serviceAccountJson = PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('SERVICE_ACCOUNT_JSON not found in script properties');
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Create JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };
    
    const jwt = createJWT(payload, serviceAccount.private_key);
    
    // Exchange JWT for access token
    const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Token exchange failed: ' + response.getContentText());
    }
    
    const tokenData = JSON.parse(response.getContentText());
    return tokenData.access_token;
    
  } catch (error) {
    console.error('Access token error:', error);
    return null;
  }
}

function createJWT(payload, privateKey) {
  // Simple JWT creation for Apps Script
  const header = { alg: 'RS256', typ: 'JWT' };
  
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload)).replace(/=/g, '');
  
  const signatureInput = encodedHeader + '.' + encodedPayload;
  const signature = Utilities.computeRsaSha256Signature(signatureInput, privateKey);
  const encodedSignature = Utilities.base64EncodeWebSafe(signature).replace(/=/g, '');
  
  return signatureInput + '.' + encodedSignature;
}

function getFCMTokens(topic, senderUid) {
  try {
    // This is a simplified version - in production you'd query Firestore
    // For now, return empty array since we can't easily access Firestore from Apps Script
    // without additional setup
    
    // TODO: Set up Firestore access or use a different approach
    // Option 1: Store tokens in Google Sheets
    // Option 2: Use Firebase Admin SDK (requires more setup)
    // Option 3: Have the client send tokens with the request
    
    console.log('Note: FCM token fetching not implemented yet - would fetch from Firestore');
    return [];
    
  } catch (error) {
    console.error('Error fetching FCM tokens:', error);
    return [];
  }
}

// Test function - remove in production
function testPushNotification() {
  const result = sendFCMNotification({
    type: 'test',
    title: 'Test Notification',
    body: 'This is a test from Apps Script',
    topic: 'all',
    url: '/ccr-app/'
  });
  console.log('Test result:', result);
}