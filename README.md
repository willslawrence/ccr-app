# CCR Church App

A beautiful, fully-functional Progressive Web App (PWA) for church community management.

## 🚀 Quick Start

```bash
# Start local server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

**Login:** Use any email/password (mock authentication)

## ✨ Features

- 📖 **Bible Reading Tracker** - Track progress through all 66 books, 1,189 chapters
- 📚 **Friends Library** - Book catalog with Google Sheets integration
- 🙏 **Prayer Requests** - Submit, track, and pray for community needs
- 💰 **Giving Dashboard** - View charity allocations and transactions
- 🗳️ **Giving Vote** - Participate in allocation decisions
- 🎧 **Sermons** - Audio library with notes
- 📅 **Schedule** - Events, volunteering, Order of Service
- 📋 **Bulletin** - Weekly announcements
- ⚙️ **Settings** - Dark mode, profile, preferences

## 📱 Pages (10 Total)

1. Login
2. Prayer Requests
3. Giving Dashboard
4. Friends Library
5. Bible Reading Tracker
6. Sermons
7. Schedule
8. Bulletin
9. Giving Vote
10. Settings

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Styling:** Custom CSS with neumorphic design
- **Data:** localStorage (ready for Firebase)
- **Fonts:** DM Sans, JetBrains Mono
- **PWA:** Service worker, manifest, offline support

## 📂 File Structure

```
ccr-app/
├── index.html           # SPA shell
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
├── icon-*.svg           # App icons
├── css/
│   └── app.css         # Complete design system
└── js/
    ├── app.js          # Router & navigation
    ├── auth.js         # Authentication
    ├── bible.js        # Bible tracker
    ├── library.js      # Friends Library
    ├── giving.js       # Giving dashboard
    ├── vote.js         # Giving vote
    ├── prayer.js       # Prayer requests
    ├── sermons.js      # Sermon audio
    ├── schedule.js     # Events & volunteering
    ├── bulletin.js     # Weekly bulletin
    └── settings.js     # User settings
```

## ✅ Verification

Run the build verification script:

```bash
./verify.sh
```

## 📖 Documentation

- **BUILD_SUMMARY.md** - Complete build details and features
- **TEST_INSTRUCTIONS.md** - Detailed testing guide
- **SPEC.md** - Original requirements specification
- **MOCK_DATA_SETUP.md** - Mock data documentation

## 🎨 Design System

- **Colors:** Gold accent (#b8860b), neumorphic shadows
- **Typography:** DM Sans (UI), JetBrains Mono (data)
- **Navigation:** Floating Action Button (FAB) with glassmorphism
- **Theme:** Light/dark mode support
- **Mobile-first:** Responsive on all devices

## 🔧 Next Steps

To make this production-ready:

1. Create Firebase project
2. Enable Firebase Authentication
3. Set up Firestore database
4. Replace mock data with real Firebase integration
5. Deploy to Firebase Hosting or GitHub Pages

## 🌟 Highlights

- ✅ All 10 pages fully functional
- ✅ Complete PWA with offline support
- ✅ Beautiful neumorphic design
- ✅ 66 Bible books, 1,189 chapters
- ✅ Google Sheets integration (Library)
- ✅ Role-based access control
- ✅ Dark/light theme
- ✅ Zero external dependencies (except fonts)
- ✅ Mobile-optimized

## 📱 Browser Support

- Chrome/Edge (latest)
- Safari (iOS/macOS)
- Firefox (latest)

Requires: ES6+, LocalStorage, Service Workers

---

**Status:** ✅ Complete and ready for testing

Built with ❤️ for CCR Church Community
