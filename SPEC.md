# CCR Church App — Build Specification

## Overview
**CCR** (Community Church R) — a Progressive Web App (PWA) for a small non-denominational Christian church community. Replaces multiple standalone web apps with one unified, beautiful, mobile-first experience.

## Tech Stack
- **Frontend:** Vanilla JS Single Page App (no frameworks)
- **Backend:** Firebase Auth + Firestore + Firebase Storage
- **Hosting:** GitHub Pages (static files) + Firebase for data
- **Fonts:** DM Sans (body), JetBrains Mono (numbers/data)
- **Offline:** Service worker for PWA install + offline caching

## Design System

### Theme Reference
Use the Friends Library app (see `/tmp/friends-library-reference.html`) as the color/style reference. Key design tokens:

```css
:root {
  --bg: #f0f0f0;
  --card: #ffffff;
  --border: rgba(0,0,0,0.06);
  --text: #1a1a1a;
  --muted: #8a8a8a;
  --accent: #b8860b;        /* Gold */
  --accent-light: #d4a84b;
  --gold-grad: linear-gradient(135deg, #d4a84b, #b8860b, #8b6914, #d4a84b);
  --gold-shine: linear-gradient(135deg, #f5e6b8, #d4a84b, #b8860b, #d4a84b, #f5e6b8);
  --green: #3d8b4f;
  --blue: #4a7ab5;
  --purple: #7a5fad;
  --red: #c0392b;
  --shadow-neu: 6px 6px 12px rgba(0,0,0,0.06), -4px -4px 10px rgba(255,255,255,0.9);
}
```

### Design Principles
- **Neumorphic cards** with soft shadows (like Friends Library)
- **Gold accent** for primary actions and highlights
- **DM Sans** font family throughout
- **Border-radius: 14-16px** on all cards/inputs
- Mobile-first, responsive
- Minimal clutter — clean whitespace

### Glassmorphism (for navigation)
The floating nav uses "Liquid Glass" style:
```css
background: rgba(255,255,255,0.25);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.3);
box-shadow: 0 8px 32px rgba(0,0,0,0.1);
```

## Authentication & Roles

### Firebase Auth
- Email/password sign-in
- Simple sign-up (name + email + password)
- Password reset via Firebase email

### User Roles (stored in Firestore `users` collection)
- **member** (default) — read everything, submit prayer requests, track Bible reading, vote
- **editor** — all member perms + publish bulletins, upload sermons, upload sermon notes, manage schedule/OoS, moderate prayer requests
- **admin** — all editor perms + manage users/roles, edit giving data, full CRUD everywhere

Role is stored in `users/{uid}/role` field. The first user (admin setup) should have a way to set themselves as admin (e.g., a setup page that appears when no admin exists).

## Navigation — Floating Action Button (FAB)

### Design
- A half-circle button fixed to the **right edge** of the screen, vertically centered
- Small, unobtrusive when closed (just a slight bump/tab on the right edge)
- When tapped, it expands: buttons fan out in an arc to the left
- Each button is a circle with an icon + small label
- Liquid Glass / glassmorphism style on all nav elements
- Smooth spring animation on open/close
- Persists on ALL pages (except login)
- Tap outside the expanded nav to close it

### Nav Items (in the arc, max 7)
1. 🙏 Prayer
2. 💰 Giving  
3. 📚 Library
4. 📖 Bible
5. 🎧 Sermons
6. 📅 Schedule
7. ☰ More → sub-menu with: Bulletin, Vote, Settings

### Active State
The current page's icon should be highlighted (gold accent glow)

## Pages

---

### 1. Login Page (`/`)
- Clean, centered layout
- "CCR" in large, elegant typography (gold gradient like Friends Library h1)
- Email + Password fields
- "Sign In" button (gold gradient)
- "Create Account" link below
- No other navigation visible
- After login, redirect to Prayer page (default home)

---

### 2. Prayer Requests Page (`/prayer`)
**Default home page after login**

#### Header
Two buttons at the top:
- **"+ Add Request"** (gold gradient button)
- **"🔍 Search"** (outline button — toggles a search bar)

#### List
- Simple vertical list of prayer request cards
- Each card shows: **Date** — **Short description** (one line)
- Sorted: newest on top
- Scroll down for history

#### Expanded Card (tap to expand inline)
When a card is tapped, it expands to show:
- Full longer description
- Submitted by: [name]
- 🙏 **Praying** counter (tap to increment — each user can pray once per request, shows count)
- **"Answered ✓"** button (editor/admin, or the submitter)
- **"Edit"** button (submitter, editor, admin)
- **"Delete"** button (submitter, editor, admin)
- Answered requests get a subtle green "Answered" badge and move to bottom / reduced opacity

#### Add Request Form
- Short description (required, single line)
- Longer description (optional, textarea)
- Anonymous toggle (hides submitter name)
- Submit button

#### Firestore Collection: `prayers`
```
{
  id: auto,
  shortDesc: string,
  longDesc: string,
  submittedBy: uid,
  submitterName: string,
  anonymous: boolean,
  answered: boolean,
  answeredAt: timestamp | null,
  prayingCount: number,
  prayedBy: [uid, uid, ...],  // track who prayed to prevent duplicates
  createdAt: timestamp
}
```

---

### 3. Giving Page (`/giving`)

#### Header
Two buttons at top:
- **"Transactions"** — future feature, shows "Coming Soon" placeholder
- **"Charities"** — shows the current Giving Dashboard content

#### Charities Tab (default)
- Pulls data from the existing Google Sheet (Sheet ID: `1I4nI0wOcS-BITM7t0T89YMy7bgPstgkRjnvf5bbFjl0` — wait, that's Giving Vote sheet)
- Actually, the Giving Dashboard currently lives at willslawrence.github.io/giving-dashboard/
- For now, embed/recreate the existing Giving Dashboard functionality
- Cards showing each charity with allocation amounts
- Match the app's design system

#### Transactions Tab
- "Coming Soon" card with a nice illustration/icon
- Brief description: "Track church giving transactions — coming in a future update"

---

### 4. Friends Library Page (`/library`)

#### Header  
Two buttons at top (matching existing):
- **"📚 Books"** — book catalog
- **"📤 Checked Out"** — checkout logs

#### Books Tab
- Same data source: Google Sheet `1tarzoeTPmF7At2B5a0yJJ9NzcrjtnTuXUgr-71xVHfk`
- **Filter area collapsed by default** — a "Filter" button that expands to show category/genre/owner filters
- **Book cards are HALF the current size** — show same info but more compact so more are visible
  - Smaller cover image (40x60px instead of 60x88px)
  - Tighter padding
  - Single line title (truncate with ellipsis)
  - Author, status badge, genre badge on one line
- Grid: `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- Search bar always visible
- Tap card to expand (modal with full details)

#### Checked Out Tab
- Same functionality as current Friends Library
- Card layout on mobile, table on desktop

---

### 5. Bible Reading Tracker (`/bible`)

#### Functionality
Rebuild Chapter by Chapter as a component within the app. Key features:
- Chapter grid showing all 66 books (NO deuterocanonical/Catholic books — remove toggle entirely)
- Tap chapters to mark as read
- Progress rings per book
- Overall progress stats
- Streak tracking
- Heatmap
- Genre progress bars
- Completed books list
- Quick wins suggestions
- Study list
- Export/import data
- Dark/light theme follows app setting

#### Data Storage
- **Firestore** — tied to user account, persists forever, syncs across devices
- Collection: `bible_progress/{uid}`
- Contains: chapters read (as a map of book → [chapter numbers]), streak data, preferences

---

### 6. Sermon Audio Page (`/sermons`)

#### Design
- Clean list of sermon cards, newest first
- Each card:
  - Date
  - Title
  - Speaker name
  - Duration
  - Play button (inline audio player)
  - Download button
- Tapping a card expands to show:
  - Description/notes (if uploaded by admin/editor)
  - Scripture references
  - Audio player (full controls)
  - Download link
  
#### Admin/Editor Features
- "Upload Sermon" button (visible only to editor/admin)
- Form: Title, Speaker, Date, Scripture Reference, Notes/Description, Audio File upload
- Audio stored in Firebase Storage (or Cloudflare R2 — start with Firebase Storage)

#### Firestore Collection: `sermons`
```
{
  id: auto,
  title: string,
  speaker: string,
  date: timestamp,
  duration: string,
  scriptureRef: string,
  description: string,
  notesHtml: string,        // sermon notes (editor/admin uploaded)
  audioUrl: string,          // Firebase Storage URL
  audioFileName: string,
  createdAt: timestamp,
  uploadedBy: uid
}
```

---

### 7. Schedule Page (`/schedule`)

#### Header
Two buttons at top:
- **"Volunteering"** — volunteer schedule table
- **"Friday OoS"** — Order of Service

#### Events List (default view)
- Simple list of upcoming events (similar to prayer list style)
- Each event card: Date — Event Name — Time — Location
- Past events grayed out
- Admin/editor can add/edit/delete events

#### Volunteering Tab
- Card-based table (responsive)
- Columns: Date, Location, Set Up/Clean Up, Gospel, Kids, IT, Songs, Passage Theme
- Current/next week highlighted with gold border
- Past weeks reduced opacity
- Admin/editor can add/edit rows
- Mobile: each week is a card with labeled fields

#### Friday Order of Service Tab
- Displays the current week's OoS as a beautifully styled card
- Sections:
  - **Venue** with tappable Google Maps link
  - **Numbered items** with times (bold times)
  - **Songs** with YouTube links (show as tappable links with video title)
  - **Scripture readings** 
  - **Children's section** at the bottom (slightly different style/indented)
- Admin/editor can edit each week's OoS
- Past OoS archived and browsable

#### Firestore Collections
```
// Events
events: {
  id, title, date, time, location, description, createdBy, createdAt
}

// Volunteer Schedule  
volunteer_schedule: {
  id, date, location, setupCleanup: [string], gospel: string,
  kids: [string], it: string, songs: string, passageTheme: string
}

// Order of Service
order_of_service: {
  id, date, venue: { name, mapsUrl },
  items: [{ order, title, time?, url?, type: 'item'|'song'|'reading' }],
  childrenSection: { title, description },
  createdBy, updatedAt
}
```

---

### 8. Bulletin Page (`/bulletin`)

#### Display
- Shows the most recent bulletin as the main view
- Each bulletin is a styled card with:
  - Date/week header at top
  - Sections as sub-cards, each with:
    - Bold heading (e.g., "Ramadan Prayer", "Women's Weekend")
    - Bulleted content below with rich text (links rendered as tappable)
- Scroll through past bulletins (or "Previous" / "Next" navigation)
- Search across all bulletins

#### Admin/Editor Features
- "New Bulletin" button
- Form:
  - Date
  - Add sections (repeatable):
    - Section heading
    - Content (rich text editor — basic: bold, italic, links, bullet lists)
  - Publish / Save Draft

#### Firestore Collection: `bulletins`
```
{
  id: auto,
  date: timestamp,
  sections: [{
    heading: string,
    content: string  // HTML from rich text editor
  }],
  published: boolean,
  createdBy: uid,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 9. Giving Vote Page (`/vote`)

#### Functionality
Rebuild existing Giving Vote as a component. Same features:
- View current active vote
- Cast votes on allocation percentages
- See results (after voting or when vote closes)

#### Admin Features (two buttons at top, visible to admin only)
- **"Create Vote"** — set up a new voting round
- **"Past Results"** — browse historical vote results

#### Data
- Migrate to Firestore (or keep Sheets for now, match app style)
- Sheet ID for reference: `1I4nI0wOcS-BITM7t0T89YMy7bgPstgkRjnvf5bbFjl0`

---

### 10. Settings Page (from More menu)
- Profile: Display name, email (read-only)
- Theme: Light / Dark toggle
- About: "CCR App v1.0"
- Sign Out button

---

## PWA Configuration

### manifest.json
```json
{
  "name": "CCR",
  "short_name": "CCR",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0f0f0",
  "theme_color": "#b8860b",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- Cache app shell (HTML, CSS, JS, fonts)
- Network-first for Firestore data
- Offline fallback page

## File Structure
```
ccr-app/
├── index.html          # SPA entry point (all HTML)
├── css/
│   └── app.css         # All styles
├── js/
│   ├── app.js          # Router, nav, app init
│   ├── auth.js         # Firebase auth
│   ├── firebase.js     # Firebase config & init
│   ├── prayer.js       # Prayer requests page
│   ├── giving.js       # Giving page
│   ├── library.js      # Friends Library page
│   ├── bible.js        # Bible tracker page
│   ├── sermons.js      # Sermon audio page
│   ├── schedule.js     # Schedule, volunteering, OoS
│   ├── bulletin.js     # Bulletin page
│   ├── vote.js         # Giving vote page
│   └── settings.js     # Settings page
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── icon-192.png        # App icon
└── icon-512.png        # App icon large
```

## Firebase Setup Required
1. Create Firebase project (Will needs to do this in Firebase Console)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Set up security rules (role-based)
5. Get Firebase config object (apiKey, projectId, etc.)

**For the initial build, use placeholder Firebase config. Will can create the project and swap in real credentials.**

## Build Priority
1. App shell, router, navigation (FAB)
2. Login/Auth UI (with placeholder Firebase config — comment out actual Firebase calls, use mock auth for now so the app is testable)
3. Prayer Requests page (full CRUD)
4. Schedule page (events + OoS + volunteering)
5. Bulletin page
6. Bible Tracker (port from Chapter by Chapter)
7. Friends Library (restyle, keep Sheets backend)
8. Giving Dashboard (restyle, keep Sheets)
9. Giving Vote (restyle)
10. Sermon Audio page
11. Settings page

## Important Notes
- **No deuterocanonical books** in Bible tracker — non-denominational Christians
- Keep it simple — church members are not tech-savvy
- All interactive elements need good tap targets (min 44px)
- No browser chrome when installed — full screen standalone
- The app should feel cohesive — every page uses the same components, spacing, colors
- Test on mobile (iPhone Safari) as primary target
