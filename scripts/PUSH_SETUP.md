# Push Notifications Setup Guide

This guide explains how to deploy and configure the push notification system for the CCR Church App.

## Overview

The push notification system consists of:

1. **Client-side (app)**: Manages FCM tokens, sends notification requests
2. **Service worker (sw.js)**: Handles background push messages and notification display  
3. **Push server (Apps Script)**: Receives requests and sends FCM messages to registered tokens
4. **Firebase Cloud Messaging**: Delivers push notifications to devices

## Deployment Steps

### 1. Firebase Configuration

The Firebase project `ccr-church-app` is already configured with:
- ✅ Project ID: `ccr-church-app`
- ✅ Web App ID: `1:139840828810:web:4f9f275a491eed430e8473`
- ✅ VAPID key: `BBMmlPVPIGEP3UQZ26covkZFXfVFFpSbL6o7Tk6IkbEatHKSyzUCHHW9KMnMNweybWKLXpjyruSL5MHlQFyF0AA`

Service account JSON is stored at: `~/Projects/ccr-app/scripts/.secrets/service-account.json`

### 2. Deploy Apps Script Push Server

1. **Create new Apps Script project**:
   - Go to https://script.google.com
   - Click "New Project"
   - Name it "CCR Push Server"

2. **Add the code**:
   - Replace `Code.gs` contents with `scripts/push-server.gs`
   - Save the project

3. **Configure service account**:
   - Go to Project Settings (gear icon)
   - Under "Script Properties", add:
     - Property: `SERVICE_ACCOUNT_JSON`
     - Value: Contents of `scripts/.secrets/service-account.json`

4. **Deploy as web app**:
   - Click "Deploy" > "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - **Copy the web app URL**

5. **Update client code**:
   - Edit `js/notifications.js`
   - Replace `PUSH_SERVER_URL` with the Apps Script web app URL

### 3. Update Firestore Security Rules

Add these rules to your Firestore security rules:

```javascript
// Push notification tokens
match /pushTokens/{tokenId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && 
    request.auth.uid == request.resource.data.uid;
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.uid;
}
```

### 4. Deploy App Updates

1. **Version bump**: All files are already updated to v2.6.0
2. **Deploy to GitHub Pages**: Push changes to trigger deployment
3. **Service worker**: Will auto-update on next app visit

## Testing

### 1. Enable Notifications

1. Open the app in a browser
2. Log in as any user
3. The app should automatically request notification permission
4. Grant permission when prompted

### 2. Test Push Triggers

- **Prayer**: Add a new prayer request → should send push to all users
- **Bulletin**: Publish a bulletin → should send push to all users  
- **Schedule**: Create Order of Service → should send push to all users
- **Giving**: Add transaction → should send push to admins only

### 3. Verify Service Worker

1. Open browser DevTools
2. Go to Application > Service Workers
3. Should show `sw.js` active with version 2.6.0
4. Check Console for messaging logs

## Troubleshooting

### No notifications received

1. **Check permissions**: Browser Settings > Notifications
2. **Verify FCM token**: Check browser console for token logs
3. **Check Apps Script logs**: View execution logs in Apps Script editor
4. **Test service worker**: DevTools > Application > Service Workers

### Apps Script errors

1. **Service account**: Verify JSON is correctly stored in Script Properties
2. **Permissions**: Ensure web app is deployed with "Anyone" access
3. **Logs**: Check Apps Script execution log for detailed errors

### Token storage issues

1. **Firestore rules**: Verify pushTokens collection rules are deployed
2. **User authentication**: Ensure user is logged in when storing tokens
3. **Network**: Check browser network tab for Firestore errors

## Production Considerations

### Security
- Apps Script web app URL should be kept private
- Consider adding request validation/authentication to Apps Script
- Monitor FCM quota usage

### Performance  
- FCM has rate limits - batch notifications when possible
- Clean up old/invalid tokens periodically
- Consider using FCM topics for better targeting

### Monitoring
- Track notification delivery rates
- Monitor user engagement with notifications
- Set up error alerting for push server failures

## File Structure

```
ccr-app/
├── index.html              (✅ Updated - FCM SDK added)
├── sw.js                   (✅ Updated - push handlers)
├── js/
│   ├── firebase.js         (✅ Updated - messaging init)
│   ├── notifications.js    (✅ New - FCM management)
│   ├── app.js              (✅ Updated - login/logout hooks)
│   ├── prayer.js           (✅ Updated - push trigger)
│   ├── bulletin.js         (✅ Updated - push trigger)
│   ├── schedule.js         (✅ Updated - push trigger)
│   └── giving.js           (✅ Updated - push trigger)
└── scripts/
    ├── push-server.gs      (✅ New - Apps Script code)
    ├── PUSH_SETUP.md       (✅ This file)
    └── .secrets/
        └── service-account.json  (✅ Exists)
```

## Next Steps

1. Deploy the Apps Script and get the web app URL
2. Update `PUSH_SERVER_URL` in `js/notifications.js` 
3. Test with real users
4. Monitor performance and adjust as needed

---

**Note**: The current implementation uses a placeholder URL for the Apps Script. Complete step 2 above to make notifications functional.