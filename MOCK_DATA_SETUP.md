# Mock Data Setup Guide

This guide shows how to add mock data to test the newly created pages.

## Quick Setup

Open your browser console on the CCR app and run these commands to populate mock data:

### 1. Schedule Data (Events)

```javascript
const mockEvents = [
  {
    id: 'event_1',
    title: 'Sunday Worship Service',
    date: '2026-03-28',
    time: '10:00',
    location: 'Main Church Building',
    description: 'Join us for our weekly worship service with communion',
    createdBy: 'user123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'event_2',
    title: 'Women\'s Bible Study',
    date: '2026-04-02',
    time: '19:00',
    location: 'Fellowship Hall',
    description: 'Continuing our study through the book of James',
    createdBy: 'user123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'event_3',
    title: 'Youth Group Meeting',
    date: '2026-04-05',
    time: '18:30',
    location: 'Youth Room',
    description: 'Game night and devotional',
    createdBy: 'user123',
    createdAt: new Date().toISOString()
  }
];
localStorage.setItem('ccr_events', JSON.stringify(mockEvents));
```

### 2. Schedule Data (Volunteer Schedule)

```javascript
const mockVolunteerSchedule = [
  {
    id: 'volunteer_1',
    date: '2026-03-28',
    location: 'Main Building',
    setupCleanup: 'John, Sarah, Mike',
    gospel: 'David',
    kids: 'Emma, Lisa',
    it: 'Tom',
    songs: 'Worship Team',
    passageTheme: 'Romans 8:28-39',
    createdAt: new Date().toISOString()
  },
  {
    id: 'volunteer_2',
    date: '2026-04-04',
    location: 'Main Building',
    setupCleanup: 'Peter, Mary',
    gospel: 'James',
    kids: 'Rachel, Anna',
    it: 'Sam',
    songs: 'Music Ministry',
    passageTheme: '1 Corinthians 13',
    createdAt: new Date().toISOString()
  }
];
localStorage.setItem('ccr_volunteer_schedule', JSON.stringify(mockVolunteerSchedule));
```

### 3. Schedule Data (Order of Service)

```javascript
const mockOrderOfService = [
  {
    id: 'oos_1',
    date: '2026-03-28',
    venueName: 'Main Church Building',
    venueUrl: 'https://maps.google.com/?q=Example+Church',
    items: [
      { time: '10:00 AM', title: 'Welcome & Announcements', url: '' },
      { time: '10:10 AM', title: 'Opening Prayer', url: '' },
      { time: '10:15 AM', title: 'Worship Song: Amazing Grace', url: 'https://youtube.com/watch?v=example1' },
      { time: '10:20 AM', title: 'Worship Song: How Great Thou Art', url: 'https://youtube.com/watch?v=example2' },
      { time: '10:30 AM', title: 'Scripture Reading: Romans 8:28-39', url: '' },
      { time: '10:35 AM', title: 'Sermon: God\'s Sovereignty', url: '' },
      { time: '11:20 AM', title: 'Communion', url: '' },
      { time: '11:35 AM', title: 'Closing Song & Benediction', url: '' }
    ],
    childrenSection: 'Children ages 3-10 will be dismissed after the worship songs for Sunday School in Room 203.',
    createdAt: new Date().toISOString()
  }
];
localStorage.setItem('ccr_order_of_service', JSON.stringify(mockOrderOfService));
```

### 4. Bulletin Data

```javascript
const mockBulletins = [
  {
    id: 'bulletin_1',
    date: '2026-03-28',
    sections: [
      {
        heading: 'Welcome',
        content: 'Welcome to CCR Church! We\'re glad you\'re here. Whether this is your first time or you\'ve been with us for years, you are valued and loved.'
      },
      {
        heading: 'Upcoming Events',
        content: '- **Women\'s Bible Study** - April 2nd at 7:00 PM\n- **Youth Group** - April 5th at 6:30 PM\n- **Easter Service** - April 17th at 10:00 AM\n- **Community Meal** - April 24th at 5:00 PM'
      },
      {
        heading: 'Prayer Requests',
        content: 'Please keep the following in your prayers:\n- The Johnson family as they grieve the loss of their mother\n- Sarah as she recovers from surgery\n- Our missionaries in Southeast Asia\n- Those struggling with unemployment'
      },
      {
        heading: 'This Week\'s Sermon',
        content: '**Title:** God\'s Unfailing Love\n**Scripture:** Romans 8:28-39\n\nPastor David will explore how nothing can separate us from God\'s love and how He works all things for good for those who love Him.'
      }
    ],
    published: true,
    createdBy: 'user123',
    createdAt: new Date().toISOString()
  }
];
localStorage.setItem('ccr_bulletins', JSON.stringify(mockBulletins));
```

### 5. Sermon Data

```javascript
const mockSermons = [
  {
    id: 'sermon_1',
    title: 'The Good Shepherd',
    speaker: 'Pastor David',
    date: '2026-03-21',
    duration: '42:15',
    scriptureRef: 'John 10:1-18',
    description: 'Jesus describes himself as the Good Shepherd who lays down his life for the sheep. We explore what it means to know the Shepherd\'s voice and follow Him.',
    audioUrl: 'https://storage.firebase.app/sermons/good-shepherd-2026-03-21.mp3',
    audioFileName: 'good-shepherd-2026-03-21.mp3',
    uploadedBy: 'user123',
    uploaderName: 'Admin User',
    createdAt: '2026-03-21T10:00:00.000Z'
  },
  {
    id: 'sermon_2',
    title: 'Walking in Faith',
    speaker: 'Pastor David',
    date: '2026-03-14',
    duration: '38:20',
    scriptureRef: 'Hebrews 11:1-6',
    description: 'Faith is being sure of what we hope for and certain of what we do not see. A message about trusting God even when we cannot see the path ahead.',
    audioUrl: 'https://storage.firebase.app/sermons/walking-in-faith-2026-03-14.mp3',
    audioFileName: 'walking-in-faith-2026-03-14.mp3',
    uploadedBy: 'user123',
    uploaderName: 'Admin User',
    createdAt: '2026-03-14T10:00:00.000Z'
  },
  {
    id: 'sermon_3',
    title: 'Love Your Neighbor',
    speaker: 'Guest Speaker - Rev. Sarah Johnson',
    date: '2026-03-07',
    duration: '35:45',
    scriptureRef: 'Luke 10:25-37',
    description: 'The parable of the Good Samaritan challenges us to love beyond boundaries and show mercy to all people.',
    audioUrl: 'https://storage.firebase.app/sermons/love-your-neighbor-2026-03-07.mp3',
    audioFileName: 'love-your-neighbor-2026-03-07.mp3',
    uploadedBy: 'user123',
    uploaderName: 'Admin User',
    createdAt: '2026-03-07T10:00:00.000Z'
  }
];
localStorage.setItem('ccr_sermons', JSON.stringify(mockSermons));
```

## To Load All Mock Data at Once

Run this in the browser console:

```javascript
// Copy and paste all the mock data arrays from above, then run:
localStorage.setItem('ccr_events', JSON.stringify(mockEvents));
localStorage.setItem('ccr_volunteer_schedule', JSON.stringify(mockVolunteerSchedule));
localStorage.setItem('ccr_order_of_service', JSON.stringify(mockOrderOfService));
localStorage.setItem('ccr_bulletins', JSON.stringify(mockBulletins));
localStorage.setItem('ccr_sermons', JSON.stringify(mockSermons));
console.log('✅ All mock data loaded!');
location.reload();
```

## To Clear All Data

```javascript
localStorage.removeItem('ccr_events');
localStorage.removeItem('ccr_volunteer_schedule');
localStorage.removeItem('ccr_order_of_service');
localStorage.removeItem('ccr_bulletins');
localStorage.removeItem('ccr_sermons');
console.log('🗑️ All data cleared!');
location.reload();
```

## Notes

- All mock data uses localStorage for easy testing without Firebase
- The sermon audio URLs are mocked - in production, these would be real Firebase Storage URLs
- The audio player is a mock UI - in production, it would use HTML5 audio with real playback functionality
- To edit data as an admin/editor, make sure you're logged in with the appropriate role
