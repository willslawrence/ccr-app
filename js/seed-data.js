/* ====================================
   SEED DATA INITIALIZATION - Firestore
   Loads mock/seed data on first visit
   ==================================== */

async function initializeSeedData() {
  // Check if already initialized by checking if prayers collection has any documents
  try {
    const prayersSnapshot = await db.collection('prayers').limit(1).get();
    if (!prayersSnapshot.empty) {
      console.log('Seed data already exists, skipping initialization');
      return;
    }
  } catch (error) {
    console.error('Error checking for existing data:', error);
    return;
  }

  console.log('Initializing seed data in Firestore...');

  // 5 fake prayer requests
  const prayers = [
    {
      text: 'Healing for Sarah\'s mother who is in the hospital',
      shortDesc: 'Healing for Sarah\'s mother who is in the hospital',
      longDesc: 'Sarah\'s mom was admitted to the hospital last week with pneumonia. Please pray for her complete healing and strength for the family.',
      author: 'Will Lawrence',
      authorId: 'seed_user_admin',
      submittedBy: 'seed_user_admin',
      submitterName: 'Will Lawrence',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 3,
      prayedBy: ['seed_user_admin'],
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
    },
    {
      text: 'Job interview this Friday',
      shortDesc: 'Job interview this Friday',
      longDesc: '',
      author: 'Anonymous',
      authorId: 'seed_user_member1',
      submittedBy: 'seed_user_member1',
      submitterName: 'Anonymous',
      anonymous: true,
      answered: false,
      answeredAt: null,
      prayingCount: 5,
      prayedBy: ['seed_user_admin'],
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
    },
    {
      text: 'Thanksgiving for a new job!',
      shortDesc: 'Thanksgiving for a new job!',
      longDesc: 'Just wanted to give thanks to God for answering prayer - I got the job I interviewed for last month! Thank you all for praying.',
      author: 'James',
      authorId: 'seed_user_member2',
      submittedBy: 'seed_user_member2',
      submitterName: 'James',
      anonymous: false,
      answered: true,
      answeredAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
      prayingCount: 8,
      prayedBy: ['seed_user_admin'],
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
    },
    {
      text: 'Wisdom in a difficult decision about moving',
      shortDesc: 'Wisdom in a difficult decision about moving',
      longDesc: 'Our family is considering relocating for work. We need wisdom to know if this is God\'s will and peace about the decision.',
      author: 'Rachel',
      authorId: 'seed_user_member3',
      submittedBy: 'seed_user_member3',
      submitterName: 'Rachel',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 4,
      prayedBy: ['seed_user_admin'],
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
    },
    {
      text: 'Strength during Ramadan - outreach opportunities',
      shortDesc: 'Strength during Ramadan - outreach opportunities',
      longDesc: 'Praying for our Muslim neighbors during Ramadan. Ask God to give us opportunities to share the gospel in love and to prepare hearts.',
      author: 'Will Lawrence',
      authorId: 'seed_user_admin',
      submittedBy: 'seed_user_admin',
      submitterName: 'Will Lawrence',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 6,
      prayedBy: ['seed_user_admin'],
      createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000))
    }
  ];

  // Bulletin data
  const bulletin = {
    date: '2026-03-20',
    sections: [
      {
        heading: 'Ramadan Prayer',
        content: `**Ramadan begins March 1** - a month of fasting and prayer for Muslims worldwide.

- Pray for Muslim neighbors and colleagues
- Pray for opportunities to share the gospel in love
- Pray for hearts to be softened and prepared
- Consider using resources at **[30 Days of Prayer](https://www.30daysprayer.com)** to guide your prayers

*"How beautiful are the feet of those who bring good news!" - Romans 10:15*`
      },
      {
        heading: 'Home Groups / Life Groups',
        content: `We have **3 active life groups** meeting throughout the week:

- **Monday Evenings** (7pm) - Young Adults - Contact James
- **Wednesday Mornings** (10am) - Parents with Young Children - Contact Rachel
- **Thursday Evenings** (7:30pm) - General Study - Contact Will

All groups are open! Reach out if you'd like to join.`
      },
      {
        heading: 'Women\'s Weekend',
        content: `**April 15-17** - Women\'s retreat at Cedar Lake Camp

Theme: *"Rooted in His Love"* based on Ephesians 3:14-21

Cost: $150 (scholarships available)
Register by April 1 with Rachel`
      },
      {
        heading: 'Friends Library',
        content: `**25+ books** available to borrow from our church library!

Browse the catalog and check out books at [willslawrence.github.io/friends-library](https://willslawrence.github.io/friends-library/)

New additions this month:
- *The Cost of Discipleship* by Dietrich Bonhoeffer
- *Knowing God* by J.I. Packer`
      },
      {
        heading: 'Giving',
        content: `Thank you for your faithful giving!

**Q1 2026 Summary:**
- Total Given: $32,500
- Missions: 35%
- Local Ministry: 25%
- Building: 20%
- Benevolence: 20%

Vote on Q2 allocation priorities in the app under Giving → Vote`
      },
      {
        heading: 'Traveling Soon?',
        content: `Let us know if you'll be away so we can pray for safe travels and stay connected!

Email travel dates to [email protected]`
      }
    ],
    published: true,
    createdBy: 'seed_user_admin',
    createdAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
  };

  // Volunteer Schedule
  const volunteerSchedule = [
    {
      date: '2026-03-06',
      location: 'Istraha',
      setupCleanup: 'Jake/Marcus',
      gospel: 'Eddie',
      kids: 'Becca/Jeni/Meghan',
      it: 'Sue',
      songs: 'Lucy & Grayson',
      passageTheme: 'Luke 9:1-17',
      createdAt: firebase.firestore.Timestamp.now()
    },
    {
      date: '2026-03-13',
      location: 'Istraha',
      setupCleanup: 'Joslynn/Amber',
      gospel: 'Dylan',
      kids: 'Eddie/Becca/Anna',
      it: 'Josie',
      songs: 'Kevin',
      passageTheme: 'Revelation 2:18-3:6',
      createdAt: firebase.firestore.Timestamp.now()
    },
    {
      date: '2026-03-20',
      location: 'W&R',
      setupCleanup: 'Redempter/Sue',
      gospel: 'Zak',
      kids: 'Hunter/Renee/Kaitlyn',
      it: 'Zak',
      songs: 'Hunter',
      passageTheme: 'Luke 9:18-27',
      createdAt: firebase.firestore.Timestamp.now()
    },
    {
      date: '2026-03-27',
      location: 'Istraha',
      setupCleanup: 'Amber/Kaitlyn',
      gospel: 'Jake',
      kids: 'Kevin/Dylan/Faith',
      it: 'Yohannes',
      songs: 'Tim',
      passageTheme: '1 John 2:28-3:10',
      createdAt: firebase.firestore.Timestamp.now()
    }
  ];

  // Order of Service
  const orderOfService = {
    date: '2026-03-20',
    venueName: 'Will & Renee\'s place - Number 17',
    venueUrl: 'https://maps.app.goo.gl/o2V9QMQDAwjcJB8VA?g_st=isi',
    items: [
      { time: '1:00pm', title: 'Arrival', url: '' },
      { time: '1:15pm', title: 'Food & Fellowship', url: '' },
      { time: '1:45pm', title: 'Gospel & Lord\'s Supper', url: '' },
      { time: '2:15pm', title: 'Public Reading: Romans 7-8', url: '' },
      { time: '2:15pm', title: 'Psalms/Hymns/Spiritual Songs', url: '' },
      { time: '', title: 'Song: John 3:16 Eternal Life', url: 'https://youtu.be/nTc8Lv6SdJg' },
      { time: '', title: 'Song: This I Believe', url: 'https://youtu.be/uuDI-sk2nJU' },
      { time: '', title: 'Song: Lord of Hosts Psalm 46', url: 'https://youtu.be/2emelR7lGmw' },
      { time: '', title: 'Song: What a Beautiful Name', url: 'https://youtu.be/4W65tpIsntU' },
      { time: '2:45pm', title: 'Exhortation: Luke 9:18-27', url: '' },
      { time: '', title: 'Prayers & Building Up', url: '' },
      { time: '', title: 'Cheerful Giving', url: '' },
      { time: '', title: 'Benediction: 1 Cor 1:7-9', url: '' },
      { time: '', title: 'Great Commission: Matt 28:18-20', url: '' }
    ],
    childrenSection: 'Continuing 7-part series on \'Who Am I?\' - grounding children in biblical understanding of identity',
    createdAt: firebase.firestore.Timestamp.now()
  };

  // Giving transactions
  const transactions = [
    { date: '2026-03-15', description: 'Sunday Offering', category: 'Tithe', amount: 2500, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-03-14', description: 'Facility Rent', category: 'Expense', amount: -500, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-03-10', description: 'Special Missions Gift', category: 'Offering', amount: 1000, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-03-08', description: 'Sunday Offering', category: 'Tithe', amount: 1800, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-03-05', description: 'IT Equipment', category: 'Expense', amount: -350, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-03-01', description: 'Sunday Offering', category: 'Tithe', amount: 2200, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-02-28', description: 'Benevolence Fund', category: 'Expense', amount: -200, createdAt: firebase.firestore.Timestamp.now() },
    { date: '2026-02-25', description: 'Online Giving', category: 'Tithe', amount: 750, createdAt: firebase.firestore.Timestamp.now() }
  ];

  try {
    // Seed prayers
    for (const prayer of prayers) {
      await db.collection('prayers').add(prayer);
    }
    console.log('Seeded prayers');

    // Seed bulletin
    await db.collection('bulletins').add(bulletin);
    console.log('Seeded bulletin');

    // Seed volunteer schedule
    for (const week of volunteerSchedule) {
      await db.collection('schedule_volunteers').add(week);
    }
    console.log('Seeded volunteer schedule');

    // Seed order of service
    await db.collection('order_of_service').add(orderOfService);
    console.log('Seeded order of service');

    // Seed transactions
    for (const transaction of transactions) {
      await db.collection('transactions').add(transaction);
    }
    console.log('Seeded transactions');

    console.log('Seed data initialization complete!');
  } catch (error) {
    console.error('Error initializing seed data:', error);
  }
}

// Run seed data initialization after Firebase is initialized
// This will be called from app.js after auth state is set up
