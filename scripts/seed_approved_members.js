#!/usr/bin/env node
/* ====================================
   SEED SCRIPT: Approved Members Whitelist
   Run this in browser console or as a standalone script
   ==================================== */

// This script seeds the approvedMembers collection with initial whitelisted users
// Run this in the browser console after Firebase is initialized

async function seedApprovedMembers() {
  console.log('Starting seed of approvedMembers collection...');

  // Check if Firebase is initialized
  if (typeof firebase === 'undefined' || !firebase.firestore) {
    console.error('Firebase not initialized. Run this in the browser console after the app loads.');
    return;
  }

  const db = firebase.firestore();

  // Initial approved members
  const approvedMembers = [
    {
      username: 'lwill',
      role: 'admin',
      displayName: 'Will',
      createdAt: firebase.firestore.Timestamp.now()
    },
    {
      username: 'lrenee',
      role: 'member',
      displayName: 'Renee',
      createdAt: firebase.firestore.Timestamp.now()
    },
    {
      username: 'lpo',
      role: 'editor',
      displayName: 'Po',
      createdAt: firebase.firestore.Timestamp.now()
    }
  ];

  try {
    const batch = db.batch();

    for (const member of approvedMembers) {
      const docRef = db.collection('approvedMembers').doc(member.username);
      batch.set(docRef, member);
      console.log(`✅ Queued: ${member.username} (${member.role})`);
    }

    await batch.commit();
    console.log('✅ Successfully seeded approvedMembers collection!');
    console.log('Total members added:', approvedMembers.length);

    // Verify the seeded data
    const snapshot = await db.collection('approvedMembers').get();
    console.log('Current approvedMembers count:', snapshot.size);

  } catch (error) {
    console.error('❌ Error seeding approvedMembers:', error);
  }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('To seed approvedMembers, run: seedApprovedMembers()');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { seedApprovedMembers };
}
