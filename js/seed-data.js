/* ====================================
   SEED DATA INITIALIZATION
   Loads mock/seed data on first visit
   ==================================== */

function initializeSeedData() {
  // Check if already initialized
  if (localStorage.getItem('ccr_seed_initialized')) {
    return;
  }

  // 5 fake prayer requests
  const prayers = [
    {
      id: 'prayer_' + Date.now() + '_1',
      shortDesc: 'Healing for Sarah\'s mother who is in the hospital',
      longDesc: 'Sarah\'s mom was admitted to the hospital last week with pneumonia. Please pray for her complete healing and strength for the family.',
      submittedBy: 'user_admin',
      submitterName: 'Will Lawrence',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 3,
      prayedBy: ['user_admin'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'prayer_' + Date.now() + '_2',
      shortDesc: 'Job interview this Friday',
      longDesc: '',
      submittedBy: 'user_member1',
      submitterName: 'Anonymous',
      anonymous: true,
      answered: false,
      answeredAt: null,
      prayingCount: 5,
      prayedBy: ['user_admin'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'prayer_' + Date.now() + '_3',
      shortDesc: 'Thanksgiving for a new job!',
      longDesc: 'Just wanted to give thanks to God for answering prayer - I got the job I interviewed for last month! Thank you all for praying.',
      submittedBy: 'user_member2',
      submitterName: 'James',
      anonymous: false,
      answered: true,
      answeredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      prayingCount: 8,
      prayedBy: ['user_admin'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'prayer_' + Date.now() + '_4',
      shortDesc: 'Wisdom in a difficult decision about moving',
      longDesc: 'Our family is considering relocating for work. We need wisdom to know if this is God\'s will and peace about the decision.',
      submittedBy: 'user_member3',
      submitterName: 'Rachel',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 4,
      prayedBy: ['user_admin'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'prayer_' + Date.now() + '_5',
      shortDesc: 'Strength during Ramadan - outreach opportunities',
      longDesc: 'Praying for our Muslim neighbors during Ramadan. Ask God to give us opportunities to share the gospel in love and to prepare hearts.',
      submittedBy: 'user_admin',
      submitterName: 'Will Lawrence',
      anonymous: false,
      answered: false,
      answeredAt: null,
      prayingCount: 6,
      prayedBy: ['user_admin'],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Bulletin data (from bulletin-sample.jpg reference)
  const bulletins = [
    {
      id: 'bulletin_' + Date.now(),
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
      createdBy: 'user_admin',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Volunteer Schedule (from volunteer-schedule.jpg reference)
  const volunteerSchedule = [
    {
      id: 'volunteer_' + Date.now() + '_1',
      date: '2026-03-06',
      location: 'Istraha',
      setupCleanup: 'Jake/Marcus',
      gospel: 'Eddie',
      kids: 'Becca/Jeni/Meghan',
      it: 'Sue',
      songs: 'Lucy & Grayson',
      passageTheme: 'Luke 9:1-17',
      createdAt: new Date().toISOString()
    },
    {
      id: 'volunteer_' + Date.now() + '_2',
      date: '2026-03-13',
      location: 'Istraha',
      setupCleanup: 'Joslynn/Amber',
      gospel: 'Dylan',
      kids: 'Eddie/Becca/Anna',
      it: 'Josie',
      songs: 'Kevin',
      passageTheme: 'Revelation 2:18-3:6',
      createdAt: new Date().toISOString()
    },
    {
      id: 'volunteer_' + Date.now() + '_3',
      date: '2026-03-20',
      location: 'W&R',
      setupCleanup: 'Redempter/Sue',
      gospel: 'Zak',
      kids: 'Hunter/Renee/Kaitlyn',
      it: 'Zak',
      songs: 'Hunter',
      passageTheme: 'Luke 9:18-27',
      createdAt: new Date().toISOString()
    },
    {
      id: 'volunteer_' + Date.now() + '_4',
      date: '2026-03-27',
      location: 'Istraha',
      setupCleanup: 'Amber/Kaitlyn',
      gospel: 'Jake',
      kids: 'Kevin/Dylan/Faith',
      it: 'Yohannes',
      songs: 'Tim',
      passageTheme: '1 John 2:28-3:10',
      createdAt: new Date().toISOString()
    }
  ];

  // Order of Service (from spec - March 20, 2026)
  const orderOfService = [
    {
      id: 'oos_' + Date.now(),
      date: '2026-03-20',
      venueName: 'Will & Renee\'s place - Number 17',
      venueUrl: 'https://maps.app.goo.gl/o2V9QMQDAwjcJB8VA?g_st=isi',
      items: [
        { time: '1:00pm', title: 'Arrival', url: '' },
        { time: '1:15pm', title: 'Food & Fellowship', url: '' },
        { time: '1:45pm', title: 'Gospel & Lord\'s Supper', url: '' },
        { time: '2:15pm', title: 'Public Reading: Romans 7-8', url: '' },
        { time: '2:15pm', title: 'Psalms/Hymns/Spiritual Songs', url: '' },
        { time: '', title: 'John 3:16 Eternal Life', url: 'https://youtu.be/nTc8Lv6SdJg' },
        { time: '', title: 'This I Believe', url: 'https://youtu.be/uuDI-sk2nJU' },
        { time: '', title: 'Lord of Hosts Psalm 46', url: 'https://youtu.be/2emelR7lGmw' },
        { time: '', title: 'What a Beautiful Name', url: 'https://youtu.be/4W65tpIsntU' },
        { time: '2:45pm', title: 'Exhortation: Luke 9:18-27', url: '' },
        { time: '', title: 'Prayers & Building Up', url: '' },
        { time: '', title: 'Cheerful Giving', url: '' },
        { time: '', title: 'Benediction: 1 Cor 1:7-9', url: '' },
        { time: '', title: 'Great Commission: Matt 28:18-20', url: '' }
      ],
      childrenSection: 'Continuing 7-part series on \'Who Am I?\' - grounding children in biblical understanding of identity',
      createdAt: new Date().toISOString()
    }
  ];

  // 8 fake giving transactions
  const transactions = [
    { id: 'trans_1', date: '2026-03-15', description: 'Sunday Offering', category: 'Tithe', amount: 2500, createdAt: new Date().toISOString() },
    { id: 'trans_2', date: '2026-03-14', description: 'Facility Rent', category: 'Expense', amount: -500, createdAt: new Date().toISOString() },
    { id: 'trans_3', date: '2026-03-10', description: 'Special Missions Gift', category: 'Offering', amount: 1000, createdAt: new Date().toISOString() },
    { id: 'trans_4', date: '2026-03-08', description: 'Sunday Offering', category: 'Tithe', amount: 1800, createdAt: new Date().toISOString() },
    { id: 'trans_5', date: '2026-03-05', description: 'IT Equipment', category: 'Expense', amount: -350, createdAt: new Date().toISOString() },
    { id: 'trans_6', date: '2026-03-01', description: 'Sunday Offering', category: 'Tithe', amount: 2200, createdAt: new Date().toISOString() },
    { id: 'trans_7', date: '2026-02-28', description: 'Benevolence Fund', category: 'Expense', amount: -200, createdAt: new Date().toISOString() },
    { id: 'trans_8', date: '2026-02-25', description: 'Online Giving', category: 'Tithe', amount: 750, createdAt: new Date().toISOString() }
  ];

  // Save all seed data
  localStorage.setItem('ccr_prayers', JSON.stringify(prayers));
  localStorage.setItem('ccr_bulletins', JSON.stringify(bulletins));
  localStorage.setItem('ccr_volunteer_schedule', JSON.stringify(volunteerSchedule));
  localStorage.setItem('ccr_order_of_service', JSON.stringify(orderOfService));
  localStorage.setItem('ccr_transactions', JSON.stringify(transactions));

  // Mark as initialized
  localStorage.setItem('ccr_seed_initialized', 'true');

  console.log('Seed data initialized');
}

// Run seed data initialization on app load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSeedData);
} else {
  initializeSeedData();
}
