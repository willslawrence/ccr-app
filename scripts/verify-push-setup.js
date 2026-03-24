#!/usr/bin/env node

/**
 * Verify Push Notifications Setup
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');

console.log('🔍 Verifying push notification setup...\n');

let allGood = true;
const issues = [];

// Check files exist
const requiredFiles = [
  'js/notifications.js',
  'scripts/push-server.gs', 
  'scripts/PUSH_SETUP.md',
  'firestore.rules'
];

requiredFiles.forEach(file => {
  const filePath = path.join(appRoot, file);
  if (fs.existsSync(filePath)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '(MISSING)');
    issues.push(`Missing file: ${file}`);
    allGood = false;
  }
});

console.log('');

// Check key content in files
const checks = [
  {
    file: 'index.html',
    pattern: 'firebase-messaging-compat.js',
    description: 'Firebase Messaging SDK'
  },
  {
    file: 'index.html', 
    pattern: 'notifications.js',
    description: 'Notifications module import'
  },
  {
    file: 'js/firebase.js',
    pattern: 'messaging = firebase.messaging()',
    description: 'Firebase messaging initialization'
  },
  {
    file: 'js/firebase.js',
    pattern: 'BBMmlPVPIGEP3UQZ26covkZFXfVFFpSbL6o7Tk6IkbEatHKSyzUCHHW9KMnMNweybWKLXpjyruSL5MHlQFyF0AA',
    description: 'VAPID key'
  },
  {
    file: 'sw.js',
    pattern: 'onBackgroundMessage',
    description: 'Background message handler'
  },
  {
    file: 'js/prayer.js',
    pattern: 'sendPushNotification',
    description: 'Prayer push trigger'
  },
  {
    file: 'js/bulletin.js',
    pattern: 'sendPushNotification', 
    description: 'Bulletin push trigger'
  },
  {
    file: 'js/schedule.js',
    pattern: 'sendPushNotification',
    description: 'Schedule push trigger'
  },
  {
    file: 'js/giving.js',
    pattern: 'sendPushNotification',
    description: 'Giving push trigger'
  },
  {
    file: 'js/app.js',
    pattern: 'onUserLogin()',
    description: 'Login notification hook'
  },
  {
    file: 'js/settings.js',
    pattern: 'setupNotificationSettings',
    description: 'Settings page integration'
  },
  {
    file: 'firestore.rules',
    pattern: 'pushTokens',
    description: 'Firestore rules for push tokens'
  }
];

checks.forEach(check => {
  const filePath = path.join(appRoot, check.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(check.pattern)) {
      console.log('✅', check.description);
    } else {
      console.log('❌', check.description, '(NOT FOUND in', check.file + ')');
      issues.push(`${check.description} not found in ${check.file}`);
      allGood = false;
    }
  } else {
    console.log('❌', check.description, '(FILE MISSING:', check.file + ')');
    allGood = false;
  }
});

console.log('');

// Check version consistency
const versionFiles = ['index.html', 'sw.js', 'js/app.js'];
const expectedVersion = '2.6.0';

console.log('📊 Checking version consistency...');
versionFiles.forEach(file => {
  const filePath = path.join(appRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(expectedVersion)) {
      console.log('✅', file, 'version', expectedVersion);
    } else {
      console.log('❌', file, 'version mismatch (expected', expectedVersion + ')');
      issues.push(`Version mismatch in ${file}`);
      allGood = false;
    }
  }
});

console.log('');

// Check for placeholder URLs that need updating
const notificationsFile = path.join(appRoot, 'js/notifications.js');
if (fs.existsSync(notificationsFile)) {
  const content = fs.readFileSync(notificationsFile, 'utf8');
  if (content.includes('YOUR_SCRIPT_ID')) {
    console.log('⚠️  PUSH_SERVER_URL still has placeholder - needs real Apps Script URL');
    issues.push('PUSH_SERVER_URL needs real Apps Script URL');
  } else {
    console.log('✅ PUSH_SERVER_URL appears to be configured');
  }
}

console.log('');

// Final summary
if (allGood) {
  console.log('🎉 All checks passed! Push notifications are ready for testing.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy the Apps Script (see scripts/PUSH_SETUP.md)');
  console.log('2. Update PUSH_SERVER_URL in js/notifications.js');
  console.log('3. Deploy updated Firestore rules');
  console.log('4. Test with real users');
} else {
  console.log('❌ Issues found:');
  issues.forEach(issue => console.log('   •', issue));
  console.log('');
  console.log('Please fix these issues before deploying.');
  process.exit(1);
}