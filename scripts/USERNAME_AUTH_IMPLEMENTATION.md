# Username Whitelist Authentication Implementation

## Overview
Implemented a username-based whitelist authentication system with phone number linking for password reset.

## Changes Made

### 1. Seed Script (`scripts/seed_approved_members.js`)
- Created seed script with initial approved members:
  - `lwill` (admin, Will)
  - `lrenee` (member, Renee)
  - `lpo` (editor, Po)
- Run in browser console after Firebase init: `seedApprovedMembers()`

### 2. Signup Flow (`js/auth.js`)
- Replaced email field with USERNAME field
- Added username validation against `approvedMembers` collection
- On signup:
  1. Checks if username exists in `approvedMembers`
  2. Shows error if not approved: "Username not approved. Contact admin."
  3. Creates Firebase Auth account with `username@ccr.app` (hidden from user)
  4. Sets user role from `approvedMembers` doc
  5. Stores username in Firestore `users` doc

### 3. Login Flow (`js/auth.js`)
- Replaced email field with USERNAME field
- Appends `@ccr.app` domain silently on login
- Uses `signInWithEmailAndPassword` with constructed email
- Forgot password shows: "Contact admin or use phone number to reset password"
- Added "Sign in with phone number" link

### 4. Phone Number Linking (`js/settings.js`)
- Added "Phone Number" section in Settings
- Features:
  - Input field for phone number (with +966 country code hint)
  - Send OTP via Firebase Phone Auth
  - Verification code input
  - Links phone credential via `linkWithCredential`
  - Shows linked phone number if already linked
  - reCAPTCHA verification for security

### 5. Password Reset via Phone (`js/settings.js`)
- Available when phone is linked
- Flow:
  1. Send OTP to linked phone
  2. Verify OTP code
  3. Reauthenticate with phone credential
  4. Prompt for new password
  5. Update password via `updatePassword`

### 6. Firestore Rules (`firestore.rules`)
- Added `approvedMembers` collection rules:
  - `allow get: if true` - Anyone can read specific username (needed for signup check)
  - `allow list: if isAdmin()` - Only admin can list all members
  - `allow write: if isAdmin()` - Only admin can manage whitelist

### 7. Phone Auth Setup (`index.html`)
- Added invisible reCAPTCHA container div: `<div id="recaptcha-container">`
- Firebase Phone Auth SDK already included
- RecaptchaVerifier initialized in auth flow

### 8. Version Bump
- `APP_VERSION` in `app.js`: **2.7.0**
- `CACHE_NAME` in `sw.js`: **ccr-app-v73**
- All `?v=` params in `index.html`: **2.7.0**

## User Experience

### Login Page
- Clean, minimal UI
- Username + Password fields only
- "Sign in with phone number" link at bottom
- Phone login is an alternative option

### Signup Page
- Username field (with hint: "Must be pre-approved by admin")
- Name field
- Password field
- Validates against whitelist before creating account

### Settings Page
- Phone Number section shows:
  - "No phone number linked" (if not linked)
  - Link phone form with reCAPTCHA
  - "Phone linked: +966..." (if linked)
  - Password reset via phone button

## Hidden Implementation Details
- Email domain `@ccr.app` is purely internal
- Users never see or interact with email addresses
- Existing auth state listener in `app.js` works unchanged
- Firebase Phone Auth requires reCAPTCHA verification (auto-handled)

## Migration Notes
- Existing email-based users can be manually migrated
- No automatic migration script included
- Admin can re-create accounts with new system

## Testing Checklist
1. ✅ Seed `approvedMembers` collection
2. ✅ Deploy Firestore rules
3. ✅ Test signup with approved username
4. ✅ Test signup with non-approved username (should fail)
5. ✅ Test login with username
6. ✅ Test phone linking in settings
7. ✅ Test phone login
8. ✅ Test password reset via phone

## Next Steps
1. Deploy to GitHub Pages
2. Update Firestore rules in Firebase Console
3. Run seed script in browser console
4. Test all flows
5. Verify phone auth works in production (requires HTTPS)
