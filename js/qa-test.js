/* ====================================
   QA TEST FUNCTIONS
   Run from browser console to create test data
   ==================================== */

/**
 * Creates a test prayer request with push notification
 * Usage: await qaCreatePrayer()
 */
async function qaCreatePrayer() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ Not logged in');
      return;
    }

    const testData = {
      text: '[QA Test] Prayer for successful testing',
      shortDesc: '[QA Test] Prayer for successful testing',
      longDesc: 'This is a test prayer request created by the QA test function.',
      author: user.name,
      authorId: user.uid,
      submittedBy: user.uid,
      submitterName: user.name,
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 0,
      prayedBy: [],
      createdAt: firebase.firestore.Timestamp.now(),
      qa_test: true
    };

    const docRef = await db.collection('prayers').add(testData);
    console.log('✅ Prayer created:', docRef.id);

    // Trigger push notification
    try {
      if (typeof sendPushNotification === 'function') {
        await sendPushNotification('prayer', '🙏 New Prayer Request', testData.shortDesc, 'all');
        console.log('✅ Push notification sent');
      }
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating prayer:', error);
  }
}

/**
 * Creates and publishes a test bulletin with push notification
 * Usage: await qaCreateBulletin()
 */
async function qaCreateBulletin() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ Not logged in');
      return;
    }

    if (!isEditor()) {
      console.error('❌ Must be editor or admin to create bulletins');
      return;
    }

    const testData = {
      date: new Date().toISOString().split('T')[0],
      sections: [
        { heading: '[QA Test] Announcements', content: 'This is a test bulletin section.' },
        { heading: '[QA Test] Upcoming', content: 'QA test content for the upcoming section.' }
      ],
      published: true,
      createdBy: user.uid,
      createdAt: firebase.firestore.Timestamp.now(),
      qa_test: true
    };

    const docRef = await db.collection('bulletins').add(testData);
    console.log('✅ Bulletin created and published:', docRef.id);

    // Trigger push notification
    try {
      if (typeof sendPushNotification === 'function') {
        await sendPushNotification('bulletin', '📰 New Bulletin', testData.sections[0].heading, 'all');
        console.log('✅ Push notification sent');
      }
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating bulletin:', error);
  }
}

/**
 * Creates a test Order of Service with push notification
 * Usage: await qaCreateOoS()
 */
async function qaCreateOoS() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ Not logged in');
      return;
    }

    if (!isEditor()) {
      console.error('❌ Must be editor or admin to create Order of Service');
      return;
    }

    // Create a test date for next Sunday
    const today = new Date();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
    const dateStr = nextSunday.toISOString().split('T')[0];

    const testData = {
      date: dateStr,
      venueName: '[QA Test] Venue',
      venueUrl: '',
      instructions: 'QA test instructions',
      items: [
        { title: '[QA Test] Opening Song', leader: '', details: 'Amazing Grace' },
        { title: '[QA Test] Prayer', leader: '', details: '' },
        { title: '[QA Test] Sermon', leader: '', details: 'Test Topic' },
        { title: '[QA Test] Closing Song', leader: '', details: 'How Great Thou Art' }
      ],
      childrenSection: '',
      createdAt: firebase.firestore.Timestamp.now(),
      qa_test: true
    };

    const docRef = await db.collection('order_of_service').add(testData);
    console.log('✅ Order of Service created:', docRef.id);

    // Trigger push notification
    try {
      if (typeof sendPushNotification === 'function') {
        const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        await sendPushNotification('oos', '📋 Order of Service', formattedDate, 'all');
        console.log('✅ Push notification sent');
      }
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating Order of Service:', error);
  }
}

/**
 * Creates a test transaction with admin push notification
 * Usage: await qaCreateTransaction()
 */
async function qaCreateTransaction() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ Not logged in');
      return;
    }

    if (!isEditor()) {
      console.error('❌ Must be editor or admin to create transactions');
      return;
    }

    const testData = {
      date: new Date().toISOString().split('T')[0],
      type: 'Incoming',
      allocation: 'All',
      amount: 100,
      description: '[QA Test] Tithe test',
      via: 'Cash',
      donor: '',
      status: 'Pending',
      receiptId: '',
      receiptUrl: '',
      createdAt: firebase.firestore.Timestamp.now(),
      qa_test: true
    };

    const docRef = await db.collection('transactions').add(testData);
    console.log('✅ Transaction created:', docRef.id);

    // Trigger admin push notification
    try {
      if (typeof sendPushNotification === 'function') {
        const description = testData.description;
        await sendPushNotification('transaction', '💰 New Transaction', description, 'admin');
        console.log('✅ Push notification sent to admins');
      }
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
  }
}

/**
 * Deletes all QA test data
 * Usage: await qaCleanup()
 */
async function qaCleanup() {
  try {
    const collections = ['prayers', 'bulletins', 'order_of_service', 'transactions', 'sermons'];
    let totalDeleted = 0;

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).where('qa_test', '==', true).get();

        if (snapshot.empty) {
          console.log(`ℹ️ No QA test items in ${collectionName}`);
          continue;
        }

        const batch = db.batch();
        let count = 0;

        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          count++;

          // If this is a sermon, also delete the audio file from Storage
          if (collectionName === 'sermons') {
            const data = doc.data();
            if (data.storageFileName) {
              try {
                const storageRef = storage.ref(`sermons/${data.storageFileName}`);
                await storageRef.delete();
                console.log(`🗑️ Deleted audio file: ${data.storageFileName}`);
              } catch (storageError) {
                console.warn(`⚠️ Could not delete audio file (may not exist):`, storageError.message);
              }
            }
          }
        }

        await batch.commit();
        console.log(`✅ Deleted ${count} QA test items from ${collectionName}`);
        totalDeleted += count;
      } catch (error) {
        console.error(`❌ Error cleaning up ${collectionName}:`, error);
      }
    }

    console.log(`✅ Cleanup complete! Deleted ${totalDeleted} total items.`);
    return totalDeleted;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Log instructions to console
console.log(`
╔═══════════════════════════════════════════════╗
║         QA Test Functions Available          ║
╠═══════════════════════════════════════════════╣
║  await qaCreatePrayer()      - Create prayer  ║
║  await qaCreateBulletin()    - Create bulletin║
║  await qaCreateOoS()         - Create OoS     ║
║  await qaCreateTransaction() - Create txn     ║
║  await qaCleanup()           - Delete all QA  ║
╚═══════════════════════════════════════════════╝
All functions create real data with push notifications.
Use qaCleanup() to remove all test data when done.
`);
