/* ====================================
   BIBLE READING TRACKER PAGE
   Testament Cards, Book Locks, Sticky Header
   ==================================== */

// Bible data structure (66 books, no deuterocanonical)
const BIBLE_BOOKS = [
  // Old Testament
  // Law of Moses (Torah)
  { name: "Genesis", abbr: "Gen", chapters: 50, genre: "Torah", testament: "OT" },
  { name: "Exodus", abbr: "Exo", chapters: 40, genre: "Torah", testament: "OT" },
  { name: "Leviticus", abbr: "Lev", chapters: 27, genre: "Torah", testament: "OT" },
  { name: "Numbers", abbr: "Num", chapters: 36, genre: "Torah", testament: "OT" },
  { name: "Deuteronomy", abbr: "Deu", chapters: 34, genre: "Torah", testament: "OT" },
  // Prophets (Nevi'im) — Former Prophets
  { name: "Joshua", abbr: "Jos", chapters: 24, genre: "Nevi'im", testament: "OT" },
  { name: "Judges", abbr: "Jdg", chapters: 21, genre: "Nevi'im", testament: "OT" },
  { name: "1 Samuel", abbr: "1Sa", chapters: 31, genre: "Nevi'im", testament: "OT" },
  { name: "2 Samuel", abbr: "2Sa", chapters: 24, genre: "Nevi'im", testament: "OT" },
  { name: "1 Kings", abbr: "1Ki", chapters: 22, genre: "Nevi'im", testament: "OT" },
  { name: "2 Kings", abbr: "2Ki", chapters: 25, genre: "Nevi'im", testament: "OT" },
  // Prophets (Nevi'im) — Latter Prophets
  { name: "Isaiah", abbr: "Isa", chapters: 66, genre: "Nevi'im", testament: "OT" },
  { name: "Jeremiah", abbr: "Jer", chapters: 52, genre: "Nevi'im", testament: "OT" },
  { name: "Ezekiel", abbr: "Eze", chapters: 48, genre: "Nevi'im", testament: "OT" },
  { name: "Hosea", abbr: "Hos", chapters: 14, genre: "Nevi'im", testament: "OT" },
  { name: "Joel", abbr: "Joe", chapters: 3, genre: "Nevi'im", testament: "OT" },
  { name: "Amos", abbr: "Amo", chapters: 9, genre: "Nevi'im", testament: "OT" },
  { name: "Obadiah", abbr: "Oba", chapters: 1, genre: "Nevi'im", testament: "OT" },
  { name: "Jonah", abbr: "Jon", chapters: 4, genre: "Nevi'im", testament: "OT" },
  { name: "Micah", abbr: "Mic", chapters: 7, genre: "Nevi'im", testament: "OT" },
  { name: "Nahum", abbr: "Nah", chapters: 3, genre: "Nevi'im", testament: "OT" },
  { name: "Habakkuk", abbr: "Hab", chapters: 3, genre: "Nevi'im", testament: "OT" },
  { name: "Zephaniah", abbr: "Zep", chapters: 3, genre: "Nevi'im", testament: "OT" },
  { name: "Haggai", abbr: "Hag", chapters: 2, genre: "Nevi'im", testament: "OT" },
  { name: "Zechariah", abbr: "Zec", chapters: 14, genre: "Nevi'im", testament: "OT" },
  { name: "Malachi", abbr: "Mal", chapters: 4, genre: "Nevi'im", testament: "OT" },
  // Psalms/Writings (Ketuvim) — Emet
  { name: "Psalms", abbr: "Psa", chapters: 150, genre: "Ketuvim", testament: "OT" },
  { name: "Proverbs", abbr: "Pro", chapters: 31, genre: "Ketuvim", testament: "OT" },
  { name: "Job", abbr: "Job", chapters: 42, genre: "Ketuvim", testament: "OT" },
  // Psalms/Writings (Ketuvim) — Megillot
  { name: "Ruth", abbr: "Rut", chapters: 4, genre: "Ketuvim", testament: "OT" },
  { name: "Song of Solomon", abbr: "Sol", chapters: 8, genre: "Ketuvim", testament: "OT" },
  { name: "Ecclesiastes", abbr: "Ecc", chapters: 12, genre: "Ketuvim", testament: "OT" },
  { name: "Lamentations", abbr: "Lam", chapters: 5, genre: "Ketuvim", testament: "OT" },
  { name: "Esther", abbr: "Est", chapters: 10, genre: "Ketuvim", testament: "OT" },
  // Psalms/Writings (Ketuvim) — Other
  { name: "Daniel", abbr: "Dan", chapters: 12, genre: "Ketuvim", testament: "OT" },
  { name: "Ezra", abbr: "Ezr", chapters: 10, genre: "Ketuvim", testament: "OT" },
  { name: "Nehemiah", abbr: "Neh", chapters: 13, genre: "Ketuvim", testament: "OT" },
  { name: "1 Chronicles", abbr: "1Ch", chapters: 29, genre: "Ketuvim", testament: "OT" },
  { name: "2 Chronicles", abbr: "2Ch", chapters: 36, genre: "Ketuvim", testament: "OT" },
  // New Testament
  // Gospel Accounts and Acts
  { name: "Matthew", abbr: "Mat", chapters: 28, genre: "Gospels", testament: "NT" },
  { name: "Mark", abbr: "Mar", chapters: 16, genre: "Gospels", testament: "NT" },
  { name: "Luke", abbr: "Luk", chapters: 24, genre: "Gospels", testament: "NT" },
  { name: "John", abbr: "Joh", chapters: 21, genre: "Gospels", testament: "NT" },
  { name: "Acts", abbr: "Act", chapters: 28, genre: "Gospels", testament: "NT" },
  // Letters from the Apostles — Paul's Letters
  { name: "Romans", abbr: "Rom", chapters: 16, genre: "Letters", testament: "NT" },
  { name: "1 Corinthians", abbr: "1Co", chapters: 16, genre: "Letters", testament: "NT" },
  { name: "2 Corinthians", abbr: "2Co", chapters: 13, genre: "Letters", testament: "NT" },
  { name: "Galatians", abbr: "Gal", chapters: 6, genre: "Letters", testament: "NT" },
  { name: "Ephesians", abbr: "Eph", chapters: 6, genre: "Letters", testament: "NT" },
  { name: "Philippians", abbr: "Phi", chapters: 4, genre: "Letters", testament: "NT" },
  { name: "Colossians", abbr: "Col", chapters: 4, genre: "Letters", testament: "NT" },
  { name: "1 Thessalonians", abbr: "1Th", chapters: 5, genre: "Letters", testament: "NT" },
  { name: "2 Thessalonians", abbr: "2Th", chapters: 3, genre: "Letters", testament: "NT" },
  { name: "1 Timothy", abbr: "1Ti", chapters: 6, genre: "Letters", testament: "NT" },
  { name: "2 Timothy", abbr: "2Ti", chapters: 4, genre: "Letters", testament: "NT" },
  { name: "Titus", abbr: "Tit", chapters: 3, genre: "Letters", testament: "NT" },
  { name: "Philemon", abbr: "Phm", chapters: 1, genre: "Letters", testament: "NT" },
  // Letters from the Apostles — General Letters
  { name: "Hebrews", abbr: "Heb", chapters: 13, genre: "Letters", testament: "NT" },
  { name: "James", abbr: "Jam", chapters: 5, genre: "Letters", testament: "NT" },
  { name: "1 Peter", abbr: "1Pe", chapters: 5, genre: "Letters", testament: "NT" },
  { name: "2 Peter", abbr: "2Pe", chapters: 3, genre: "Letters", testament: "NT" },
  { name: "1 John", abbr: "1Jo", chapters: 5, genre: "Letters", testament: "NT" },
  { name: "2 John", abbr: "2Jo", chapters: 1, genre: "Letters", testament: "NT" },
  { name: "3 John", abbr: "3Jo", chapters: 1, genre: "Letters", testament: "NT" },
  { name: "Jude", abbr: "Jud", chapters: 1, genre: "Letters", testament: "NT" },
  // The Revelation
  { name: "Revelation", abbr: "Rev", chapters: 22, genre: "Revelation", testament: "NT" }
];

const OT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'OT');
const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT');
const OT_CHAPTERS = OT_BOOKS.reduce((s, b) => s + b.chapters, 0);
const NT_CHAPTERS = NT_BOOKS.reduce((s, b) => s + b.chapters, 0);
const TOTAL_CHAPTERS = OT_CHAPTERS + NT_CHAPTERS;

// Genre definitions for stats panel
const BIBLE_GENRES = [
  { name: 'Law of Moses (Torah)', color: '#C05535', books: ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy'] },
  { name: 'Psalms/Writings (Ketuvim)', color: '#A83878', books: ['Psalms','Proverbs','Job','Ruth','Song of Solomon','Ecclesiastes','Lamentations','Esther','Daniel','Ezra','Nehemiah','1 Chronicles','2 Chronicles'] },
  { name: 'Prophets (Nevi\'im)', color: '#28827A', books: ['Joshua','Judges','1 Samuel','2 Samuel','1 Kings','2 Kings','Isaiah','Jeremiah','Ezekiel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'] },
  { name: 'Gospel Accounts and Acts', color: '#38885A', books: ['Matthew','Mark','Luke','John','Acts'] },
  { name: 'Letters from the Apostles', color: '#3E68B8', books: ['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude'] },
  { name: 'The Revelation', color: '#6A42A8', books: ['Revelation'] },
];

// ====================================
// IN-MEMORY CACHE + DEBOUNCED SAVE + LOCKED BOOKS
// ====================================
let _bibleCache = null;
let _bibleSaveTimer = null;
let _bibleSaving = false;
let _lockedBooks = new Set(JSON.parse(localStorage.getItem('bible_locked_books') || '[]'));

// Load Bible progress from Firestore (or cache)
async function loadBibleProgress() {
  if (_bibleCache) return _bibleCache;

  const user = getCurrentUser();
  if (!user) {
    return {
      chaptersRead: {},
      streak: { current: 0, best: 0, lastRead: null },
      stats: { totalChapters: 0, booksCompleted: 0 }
    };
  }

  try {
    const doc = await db.collection('users').doc(user.uid)
      .collection('bibleProgress').doc('data').get();

    if (doc.exists) {
      const data = doc.data();
      if (data.streak && data.streak.lastRead?.toDate) {
        data.streak.lastRead = data.streak.lastRead.toDate().toDateString();
      }
      // Ensure all chapter numbers are integers (Firestore may return strings from older saves)
      if (data.chaptersRead) {
        for (const abbr of Object.keys(data.chaptersRead)) {
          data.chaptersRead[abbr] = data.chaptersRead[abbr].map(Number);
        }
      }
      _bibleCache = data;
      return data;
    }
  } catch (error) {
    console.error('Error loading Bible progress:', error);
  }

  _bibleCache = {
    chaptersRead: {},
    streak: { current: 0, best: 0, lastRead: null },
    stats: { totalChapters: 0, booksCompleted: 0 }
  };
  return _bibleCache;
}

// Debounced save — waits 500ms after last change before writing to Firestore
function scheduleBibleSave() {
  if (_bibleSaveTimer) clearTimeout(_bibleSaveTimer);
  _bibleSaveTimer = setTimeout(() => flushBibleSave(), 500);
}

async function flushBibleSave() {
  if (!_bibleCache || _bibleSaving) return;
  const user = getCurrentUser();
  if (!user) return;

  _bibleSaving = true;
  try {
    await db.collection('users').doc(user.uid)
      .collection('bibleProgress').doc('data').set(_bibleCache);
  } catch (error) {
    console.error('Error saving Bible progress:', error);
  }
  _bibleSaving = false;
}

// Save Bible progress (immediate for explicit saves)
async function saveBibleProgress(data) {
  _bibleCache = data;
  const user = getCurrentUser();
  if (!user) return;

  try {
    await db.collection('users').doc(user.uid)
      .collection('bibleProgress').doc('data').set(data);
  } catch (error) {
    console.error('Error saving Bible progress:', error);
  }
}

// Update streak helper
function updateStreak(data) {
  const today = new Date().toDateString();
  if (data.streak.lastRead !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (data.streak.lastRead === yesterday.toDateString()) {
      data.streak.current++;
    } else {
      data.streak.current = 1;
    }
    data.streak.lastRead = today;
    if (data.streak.current > data.streak.best) {
      data.streak.best = data.streak.current;
    }
  }
}

// Recompute stats helper
function recomputeBibleStats(data) {
  data.stats.totalChapters = Object.values(data.chaptersRead).flat().length;
  data.stats.booksCompleted = BIBLE_BOOKS.filter(book => {
    const read = data.chaptersRead[book.abbr] || [];
    return read.length === book.chapters;
  }).length;
}

// Toggle book lock status (global function for onclick handlers)
window.toggleBookLock = function(abbr) {
  if (_lockedBooks.has(abbr)) {
    _lockedBooks.delete(abbr);
  } else {
    _lockedBooks.add(abbr);
  }
  localStorage.setItem('bible_locked_books', JSON.stringify([..._lockedBooks]));
  
  // Update UI - refresh the book section
  updateBookSection(abbr);
}

// Update a single book section within its testament card
function updateBookSection(bookAbbr) {
  const book = BIBLE_BOOKS.find(b => b.abbr === bookAbbr);
  if (!book || !_bibleCache) return;

  const bookSection = document.querySelector(`.bible-book-section[data-book="${bookAbbr}"]`);
  if (!bookSection) return;

  const progress = getBookProgressSync(book.abbr, _bibleCache);
  const isLocked = _lockedBooks.has(book.abbr);
  
  bookSection.className = `bible-book-section ${isLocked ? 'locked' : ''}`;
  
  // Update progress counter
  const progressElement = bookSection.querySelector('.bible-book-progress');
  if (progressElement) {
    progressElement.textContent = `${progress.read}/${progress.total}`;
  }
  
  // Update progress bar
  const barFill = bookSection.querySelector('.bible-book-bar-fill');
  if (barFill) {
    barFill.style.width = `${progress.percent}%`;
  }
  
  // Update lock button
  const lockBtn = bookSection.querySelector('.bible-lock-btn');
  if (lockBtn) {
    lockBtn.className = `bible-lock-btn ${isLocked ? 'locked' : ''}`;
  }
  
  // Update chapter buttons
  const chapterButtons = bookSection.querySelectorAll('.chapter-btn');
  chapterButtons.forEach(btn => {
    const chapterNum = parseInt(btn.dataset.chapter);
    const read = (_bibleCache.chaptersRead[book.abbr] || []).includes(chapterNum);
    btn.classList.toggle('read', read);
  });
}

// Toggle chapter read status — instant UI, debounced save
function toggleChapter(bookAbbr, chapterNum) {
  if (!_bibleCache) return;
  
  // Skip if book is locked
  if (_lockedBooks.has(bookAbbr)) return;
  
  const data = _bibleCache;

  if (!data.chaptersRead[bookAbbr]) {
    data.chaptersRead[bookAbbr] = [];
  }

  const index = data.chaptersRead[bookAbbr].indexOf(chapterNum);
  if (index > -1) {
    // Remove ALL occurrences (guard against duplicates)
    data.chaptersRead[bookAbbr] = data.chaptersRead[bookAbbr].filter(c => c !== chapterNum);
  } else {
    data.chaptersRead[bookAbbr].push(chapterNum);
    updateStreak(data);
  }

  recomputeBibleStats(data);
  scheduleBibleSave();

  // Instant UI update
  const btn = document.querySelector(`.chapter-btn[data-book="${bookAbbr}"][data-chapter="${chapterNum}"]`);
  if (btn) btn.classList.toggle('read');
  updateBookSection(bookAbbr);
  updateBibleStats(data);
}

// Update a single book card's progress display (legacy compatibility)
function updateBookCard(bookAbbr, data) {
  updateBookSection(bookAbbr);
}

// ====================================
// TOUCH-DRAG CHAPTER SELECTION
// ====================================
let _dragState = null;
let _touchHandledChapter = false;

function initChapterDragSelection() {
  const container = document.querySelector('.bible-page');
  if (!container) return;

  container.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('.chapter-btn');
    if (!btn) return;

    const bookAbbr = btn.dataset.book;
    
    // Skip if book is locked
    if (_lockedBooks.has(bookAbbr)) return;
    
    const chapter = parseInt(btn.dataset.chapter);
    // Determine mode: if chapter is unread, we're marking as read. If read, unmarking.
    const isRead = btn.classList.contains('read');

    _dragState = {
      bookAbbr,
      markAsRead: !isRead,
      touchedChapters: new Set([chapter])
    };

    // Toggle this chapter
    applyDragChapter(bookAbbr, chapter, !isRead);
    _touchHandledChapter = true;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!_dragState) return;

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;

    const btn = el.closest('.chapter-btn');
    if (!btn || btn.dataset.book !== _dragState.bookAbbr) return;

    const chapter = parseInt(btn.dataset.chapter);
    if (_dragState.touchedChapters.has(chapter)) return;

    _dragState.touchedChapters.add(chapter);
    applyDragChapter(_dragState.bookAbbr, chapter, _dragState.markAsRead);
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (_dragState) {
      // Final save after drag
      recomputeBibleStats(_bibleCache);
      scheduleBibleSave();
      updateBookSection(_dragState.bookAbbr);
      updateBibleStats(_bibleCache);
      _dragState = null;
    }
  });
}

function applyDragChapter(bookAbbr, chapterNum, markAsRead) {
  if (!_bibleCache) return;
  
  // Skip if book is locked
  if (_lockedBooks.has(bookAbbr)) return;
  
  const data = _bibleCache;

  if (!data.chaptersRead[bookAbbr]) {
    data.chaptersRead[bookAbbr] = [];
  }

  const index = data.chaptersRead[bookAbbr].indexOf(chapterNum);

  if (markAsRead && index === -1) {
    data.chaptersRead[bookAbbr].push(chapterNum);
    updateStreak(data);
  } else if (!markAsRead && index > -1) {
    // Remove ALL occurrences (guard against duplicates)
    data.chaptersRead[bookAbbr] = data.chaptersRead[bookAbbr].filter(c => c !== chapterNum);
  }

  // Instant UI
  const btn = document.querySelector(`.chapter-btn[data-book="${bookAbbr}"][data-chapter="${chapterNum}"]`);
  if (btn) btn.classList.toggle('read', markAsRead);
}

function updateBibleStats(data) {
  const overallPercent = Math.round((data.stats.totalChapters / TOTAL_CHAPTERS) * 100);
  const otRead = OT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const ntRead = NT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const otPct = Math.round((otRead / OT_CHAPTERS) * 100);
  const ntPct = Math.round((ntRead / NT_CHAPTERS) * 100);

  // Main ring (overall) — radius 56, circumference 352
  const mainRing = document.getElementById('bible-ring-all');
  if (mainRing) mainRing.setAttribute('stroke-dasharray', `${(overallPercent / 100) * 352} 352`);
  const mainPct = document.getElementById('bible-pct-all');
  if (mainPct) mainPct.textContent = overallPercent + '%';

  // OT ring
  const otRing = document.getElementById('bible-ring-ot');
  if (otRing) otRing.setAttribute('stroke-dasharray', `${(otPct / 100) * 352} 352`);
  const otLabel = document.getElementById('bible-ot-label');
  if (otLabel) otLabel.textContent = otRead + '/' + OT_CHAPTERS;

  // NT ring
  const ntRing = document.getElementById('bible-ring-nt');
  if (ntRing) ntRing.setAttribute('stroke-dasharray', `${(ntPct / 100) * 352} 352`);
  const ntLabel = document.getElementById('bible-nt-label');
  if (ntLabel) ntLabel.textContent = ntRead + '/' + NT_CHAPTERS;

  // Update overall progress bar
  const overallFill = document.getElementById('bible-overall-fill');
  if (overallFill) overallFill.style.width = overallPercent + '%';

  // Update chapter counts
  const readCount = document.getElementById('bible-read-count');
  if (readCount) readCount.textContent = data.stats.totalChapters;
  const remainCount = document.getElementById('bible-remaining-count');
  if (remainCount) remainCount.textContent = TOTAL_CHAPTERS - data.stats.totalChapters;

  // Update chapters/day and days remaining
  const cpdEl = document.getElementById('bible-cpd');
  if (cpdEl) cpdEl.textContent = getChaptersPerDay(data);
  const daysEl = document.getElementById('bible-days-remaining');
  if (daysEl) daysEl.textContent = getDaysRemaining(data);

  // Update testament header counts
  const otHeader = document.getElementById('bible-ot-header-count');
  if (otHeader) otHeader.textContent = otRead + '/' + OT_CHAPTERS;
  const ntHeader = document.getElementById('bible-nt-header-count');
  if (ntHeader) ntHeader.textContent = ntRead + '/' + NT_CHAPTERS;

  // Update section headers (Torah, Historical Books, etc.)
  [...OT_SECTIONS, ...NT_SECTIONS].forEach(section => {
    const sectionId = section.name.replace(/[^a-zA-Z]/g, '');
    const sp = getSectionProgress(section, data);
    const countEl = document.getElementById('section-count-' + sectionId);
    if (countEl) countEl.textContent = sp.read + '/' + sp.total;
    const barEl = document.getElementById('section-bar-' + sectionId);
    if (barEl) barEl.style.width = sp.percent + '%';
  });

  // Update genre bars if stats panel is visible
  const genreContainer = document.getElementById('genreProgressBars');
  if (genreContainer && genreContainer.innerHTML) {
    const genreStats = calculateGenreStats(data);
    genreContainer.innerHTML = genreStats.map(stat => `
      <div class="genre-row">
        <div class="genre-info">
          <span class="genre-name" style="color: ${stat.color};">${stat.name}</span>
          <span class="genre-numbers">${stat.readChapters}/${stat.totalChapters} (${stat.percentage}%)</span>
        </div>
        <div class="genre-bar">
          <div class="genre-fill" style="width: ${stat.percentage}%; background: ${stat.color};"></div>
        </div>
      </div>
    `).join('');
  }
}

// Calculate genre stats
function calculateGenreStats(data) {
  // Create mapping from BIBLE_GENRES names to BIBLE_BOOKS genre field
  // Use the books array directly from BIBLE_GENRES (matches section structure)
  return BIBLE_GENRES.map(genre => {
    let totalChapters = 0;
    let readChapters = 0;
    
    const bookNames = new Set(genre.books);
    const booksInGenre = BIBLE_BOOKS.filter(book => bookNames.has(book.name));
    
    booksInGenre.forEach(book => {
      totalChapters += book.chapters;
      const readInBook = (data.chaptersRead[book.abbr] || []).length;
      readChapters += readInBook;
    });
    
    const percentage = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;
    
    return {
      name: genre.name,
      color: genre.color,
      totalChapters,
      readChapters,
      percentage
    };
  });
}

// Toggle stats panel (global function for onclick handlers)
let _readingPlanBefore = 1;
let _readingPlanAfter = 3;
let _readingPlanCache = null; // Firestore cache for luke2444
let _hamiltonCache = null; // Firestore cache for hamilton completed days

function getSelectedPlan() {
  return localStorage.getItem('bible_reading_plan_choice') || 'hamilton';
}

function getPlanData() {
  const plan = getSelectedPlan();
  if (plan === 'luke2444') {
    return { key: 'luke2444', name: 'Luke 24:44 Plan', total: LUKE2444_PLAN.length, hasColumns: true };
  }
  return { key: 'hamilton', name: 'Hamilton Plan', total: BIBLE_READING_PLAN.length, hasColumns: false };
}

// Load Luke 24:44 progress from Firestore (stored under users/{uid}/readingPlan/luke2444)
async function loadLuke2444Progress() {
  if (_readingPlanCache) return _readingPlanCache;
  const user = firebase.auth().currentUser;
  if (!user) return { startDate: null, completed: {} };
  try {
    const doc = await firebase.firestore().collection('users').doc(user.uid)
      .collection('readingPlan').doc('luke2444').get();
    if (doc.exists) {
      _readingPlanCache = doc.data();
    } else {
      _readingPlanCache = { startDate: null, completed: {} };
    }
  } catch (e) {
    console.error('Error loading reading plan:', e);
    _readingPlanCache = { startDate: null, completed: {} };
  }
  return _readingPlanCache;
}

// Save Luke 24:44 progress to Firestore
async function saveLuke2444Progress(data) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  _readingPlanCache = data;
  try {
    await firebase.firestore().collection('users').doc(user.uid)
      .collection('readingPlan').doc('luke2444').set(data, { merge: true });
  } catch (e) {
    console.error('Error saving reading plan:', e);
  }
}

// Load Hamilton progress from Firestore (stored under users/{uid}/readingPlan/hamilton)
// On first load, migrates any existing localStorage data to Firestore
async function loadHamiltonProgress() {
  if (_hamiltonCache) return _hamiltonCache;
  const user = firebase.auth().currentUser;
  if (!user) return { completed: {} };
  try {
    const doc = await firebase.firestore().collection('users').doc(user.uid)
      .collection('readingPlan').doc('hamilton').get();
    if (doc.exists) {
      _hamiltonCache = doc.data();
    } else {
      _hamiltonCache = { completed: {} };
      // Migrate from localStorage if any
      const year = new Date().getFullYear();
      const oldKeys = ['bible_reading_plan_' + year, 'bible_plan_done_hamilton_' + year];
      for (const key of oldKeys) {
        const old = localStorage.getItem(key);
        if (old) {
          try {
            const parsed = JSON.parse(old);
            if (parsed && typeof parsed === 'object') {
              Object.assign(_hamiltonCache.completed, parsed);
            }
          } catch(e) {}
          localStorage.removeItem(key); // Clean up after migration
        }
      }
      if (Object.keys(_hamiltonCache.completed).length > 0) {
        await saveHamiltonProgress(_hamiltonCache);
        console.log('Migrated Hamilton reading plan to Firestore');
      }
    }
  } catch (e) {
    console.error('Error loading Hamilton plan:', e);
    _hamiltonCache = { completed: {} };
  }
  return _hamiltonCache;
}

// Save Hamilton progress to Firestore
async function saveHamiltonProgress(data) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  _hamiltonCache = data;
  try {
    await firebase.firestore().collection('users').doc(user.uid)
      .collection('readingPlan').doc('hamilton').set(data, { merge: true });
  } catch (e) {
    console.error('Error saving Hamilton plan:', e);
  }
}

// Get the current day number for Luke 24:44 (relative to user's start date)
// Get the "current day" for Luke 24:44 = highest completed day + 1 (progress-driven)
function getLuke2444CurrentDay() {
  const data = _readingPlanCache || { completed: {} };
  const completed = data.completed || {};
  const keys = Object.keys(completed).map(Number).filter(n => !isNaN(n));
  if (keys.length === 0) return 1;
  return Math.max(...keys) + 1; // Next day after highest completed
}

function getPlanReadingsAround(daysBefore, daysAfter) {
  const plan = getPlanData();
  const results = [];

  if (plan.key === 'luke2444') {
    // Luke 24:44: progress-driven, "today" = next unchecked day
    const currentDay = Math.min(getLuke2444CurrentDay(), plan.total);
    for (let offset = -daysBefore; offset <= daysAfter; offset++) {
      const dayNum = currentDay + offset;
      const idx = dayNum - 1;
      if (idx >= 0 && idx < plan.total) {
        const entry = LUKE2444_PLAN[idx];
        results.push({
          day: dayNum,
          ot: entry[0], nt: entry[1], prayer: entry[2],
          reading: entry[0],
          isToday: offset === 0,
          isPast: offset < 0
        });
      }
    }
  } else {
    // Hamilton: day-of-year based
    const d = new Date();
    const dayOfYear = getDayOfYear(d);
    for (let offset = -daysBefore; offset <= daysAfter; offset++) {
      const idx = dayOfYear - 1 + offset;
      if (idx >= 0 && idx < plan.total) {
        const refDate = new Date(d);
        refDate.setDate(refDate.getDate() + offset);
        results.push({
          day: idx + 1,
          reading: BIBLE_READING_PLAN[idx],
          date: refDate,
          isToday: offset === 0,
          isPast: offset < 0
        });
      }
    }
  }
  return results;
}

// Update Bible tab button styles based on which panel is open
function updateBibleTabButtons() {
  const planOpen = document.getElementById('readingPlanCard')?.style.display !== 'none';
  const guideOpen = document.getElementById('readingGuideCard')?.style.display !== 'none';
  const statsOpen = document.getElementById('bibleStatsAll')?.style.display !== 'none';
  const btnPlan = document.getElementById('btnReadingPlan');
  const btnGuide = document.getElementById('btnReadingGuide');
  const btnStats = document.getElementById('btnBibleStats');
  if (btnPlan) { btnPlan.className = 'btn ' + (planOpen ? 'btn-primary' : 'btn-outline'); }
  if (btnGuide) { btnGuide.className = 'btn ' + (guideOpen ? 'btn-primary' : 'btn-outline'); }
  if (btnStats) { btnStats.className = 'btn ' + (statsOpen ? 'btn-primary' : 'btn-outline'); }
}

window.toggleReadingPlan = async function() {
  const panel = document.getElementById('readingPlanCard');
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? '' : 'none';
  if (isHidden) {
    const guide = document.getElementById('readingGuideCard');
    if (guide) guide.style.display = 'none';
    const stats = document.getElementById('bibleStatsAll');
    if (stats) stats.style.display = 'none';
    _readingPlanBefore = 1;
    _readingPlanAfter = 3;
    // Load Firestore data for the active plan
    const plan = getPlanData();
    if (plan.key === 'luke2444') {
      await loadLuke2444Progress();
    } else {
      await loadHamiltonProgress();
    }
    renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
  }
  updateBibleTabButtons();
};

window.showMoreReadings = function() {
  _readingPlanAfter = 7;
  renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
  const btn = document.getElementById('readingPlanNextBtn');
  if (btn) btn.style.display = 'none';
};

window.showPreviousWeek = function() {
  _readingPlanBefore += 7;
  renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
};

window.switchReadingPlan = async function(planKey) {
  localStorage.setItem('bible_reading_plan_choice', planKey);
  _readingPlanBefore = 1;
  _readingPlanAfter = 3;
  const btn = document.getElementById('readingPlanNextBtn');
  if (btn) btn.style.display = '';
  if (planKey === 'luke2444') {
    await loadLuke2444Progress();
  } else {
    await loadHamiltonProgress();
  }
  renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
};

function renderReadingPlan(daysBefore, daysAfter) {
  const container = document.getElementById('readingPlanList');
  if (!container) return;
  const plan = getPlanData();
  const readings = getPlanReadingsAround(daysBefore, daysAfter);

  // Get completed data (both plans use Firestore)
  let completed = {};
  if (plan.key === 'luke2444') {
    completed = (_readingPlanCache && _readingPlanCache.completed) || {};
  } else {
    completed = (_hamiltonCache && _hamiltonCache.completed) || {};
  }

  // Update header
  const titleEl = document.getElementById('readingPlanTitle');
  if (titleEl) {
    titleEl.textContent = plan.key === 'luke2444'
      ? 'Luke 24:44 Reading/Listening Plan'
      : "God's Glory in Salvation through Judgment Bible Reading Plan";
  }
  const dayEl = document.getElementById('readingPlanDayCount');
  if (dayEl) {
    if (plan.key === 'luke2444') {
      const currentDay = Math.min(getLuke2444CurrentDay(), plan.total);
      const doneCount = Object.keys(completed).length;
      dayEl.textContent = 'Day ' + currentDay + '+ of ' + plan.total + ' (✓' + doneCount + ')';
    } else {
      const dayOfYear = getDayOfYear(new Date());
      dayEl.textContent = 'Day ' + Math.min(dayOfYear, plan.total) + ' of ' + plan.total;
    }
  }
  const barEl = document.getElementById('readingPlanBar');
  if (barEl) {
    if (plan.key === 'luke2444') {
      const doneCount = Object.keys(completed).length;
      barEl.style.width = (doneCount / plan.total * 100).toFixed(1) + '%';
    } else {
      barEl.style.width = (getDayOfYear(new Date()) / plan.total * 100).toFixed(1) + '%';
    }
  }

  // Update plan selector
  const selBtns = document.querySelectorAll('.plan-select-btn');
  selBtns.forEach(b => {
    b.style.background = b.dataset.plan === plan.key ? 'var(--accent)' : 'var(--card-hover)';
    b.style.color = b.dataset.plan === plan.key ? '#fff' : 'var(--text)';
  });

  container.innerHTML = readings.map(r => {
    const isDone = completed[r.day];
    const todayStyle = r.isToday ? 'border:2px solid var(--accent);' : '';
    const pastStyle = r.isPast && !isDone ? 'opacity:0.5;' : '';
    const doneStyle = isDone ? 'text-decoration:line-through;opacity:0.6;' : '';

    if (plan.hasColumns) {
      // Luke 24:44 — 3-column layout, no calendar dates, just Day N+
      return `
        <div style="padding:10px 12px;margin-bottom:6px;background:var(--card-hover);border-radius:8px;${todayStyle}${pastStyle}cursor:pointer;touch-action:manipulation;"
             onclick="toggleReadingDone(${r.day})">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${isDone ? 'var(--green)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${isDone ? 'var(--green)' : 'transparent'};">
              ${isDone ? '<span style="color:#fff;font-size:12px;">✓</span>' : ''}
            </div>
            <div style="font-size:12px;font-weight:600;${r.isToday ? 'color:var(--accent);' : 'color:var(--text);'}">Day ${r.day}+${r.isToday ? ' — TODAY' : ''}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:3px;padding-left:28px;${doneStyle}">
            <div style="font-size:12px;"><span style="color:var(--accent);font-weight:700;font-size:10px;">OT</span> ${r.ot}</div>
            <div style="font-size:12px;"><span style="color:var(--green);font-weight:700;font-size:10px;">NT</span> ${r.nt}</div>
            ${r.prayer ? '<div style="font-size:12px;"><span style="color:var(--muted);font-weight:700;font-size:10px;">🙏</span> ' + r.prayer + '</div>' : ''}
          </div>
        </div>
      `;
    } else {
      // Hamilton — single reading with calendar dates
      const dateStr = r.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;background:var(--card-hover);border-radius:8px;${todayStyle}${pastStyle}cursor:pointer;touch-action:manipulation;"
             onclick="toggleReadingDone(${r.day})">
          <div style="width:24px;height:24px;border-radius:50%;border:2px solid ${isDone ? 'var(--green)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${isDone ? 'var(--green)' : 'transparent'};">
            ${isDone ? '<span style="color:#fff;font-size:14px;">✓</span>' : ''}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:11px;color:var(--muted);${r.isToday ? 'font-weight:700;color:var(--accent);' : ''}">${dateStr}${r.isToday ? ' — TODAY' : ''}</div>
            <div style="font-size:14px;font-weight:600;${doneStyle}">${r.reading}</div>
          </div>
          <div style="font-size:10px;color:var(--muted);flex-shrink:0;">Day ${r.day}</div>
        </div>
      `;
    }
  }).join('');
}

window.toggleReadingDone = async function(day) {
  const plan = getPlanData();
  if (plan.key === 'luke2444') {
    if (!_readingPlanCache) _readingPlanCache = { startDate: null, completed: {} };
    if (!_readingPlanCache.completed) _readingPlanCache.completed = {};
    if (_readingPlanCache.completed[day]) {
      delete _readingPlanCache.completed[day];
    } else {
      _readingPlanCache.completed[day] = true;
    }
    renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
    await saveLuke2444Progress(_readingPlanCache);
  } else {
    // Hamilton: Firestore sync
    if (!_hamiltonCache) _hamiltonCache = { completed: {} };
    if (!_hamiltonCache.completed) _hamiltonCache.completed = {};
    if (_hamiltonCache.completed[day]) {
      delete _hamiltonCache.completed[day];
    } else {
      _hamiltonCache.completed[day] = true;
    }
    renderReadingPlan(_readingPlanBefore, _readingPlanAfter);
    await saveHamiltonProgress(_hamiltonCache);
  }
};

window.toggleReadingGuide = function() {
  const guide = document.getElementById('readingGuideCard');
  if (!guide) return;
  const isHidden = guide.style.display === 'none';
  guide.style.display = isHidden ? '' : 'none';
  if (isHidden) {
    const stats = document.getElementById('bibleStatsAll');
    if (stats) stats.style.display = 'none';
    const plan = document.getElementById('readingPlanCard');
    if (plan) plan.style.display = 'none';
  }
  updateBibleTabButtons();
};

window.toggleBibleStats = function() {
  const allStats = document.getElementById('bibleStatsAll');
  if (!allStats) return;
  
  const isHidden = allStats.style.display === 'none';
  allStats.style.display = isHidden ? '' : 'none';
  
  if (isHidden) {
    // Close other panels
    const guide = document.getElementById('readingGuideCard');
    if (guide) guide.style.display = 'none';
    const planCard = document.getElementById('readingPlanCard');
    if (planCard) planCard.style.display = 'none';
    // Also show genre breakdown
    const panel = document.getElementById('bibleStatsPanel');
    if (panel) panel.style.display = 'block';
    
    // Update genre progress bars
    const genreStats = calculateGenreStats(_bibleCache);
    const statsHtml = genreStats.map(stat => `
      <div class="genre-row">
        <div class="genre-info">
          <span class="genre-name" style="color: ${stat.color};">${stat.name}</span>
          <span class="genre-numbers">${stat.readChapters}/${stat.totalChapters} (${stat.percentage}%)</span>
        </div>
        <div class="genre-bar">
          <div class="genre-fill" style="width: ${stat.percentage}%; background: ${stat.color};"></div>
        </div>
      </div>
    `).join('');
    
    const genreContainer = document.getElementById('genreProgressBars');
    if (genreContainer) {
      genreContainer.innerHTML = statsHtml;
    }
  }
  updateBibleTabButtons();
};

function getBookProgressSync(bookAbbr, data) {
  const book = BIBLE_BOOKS.find(b => b.abbr === bookAbbr);
  const read = data.chaptersRead[bookAbbr] || [];
  return {
    read: read.length,
    total: book.chapters,
    percent: Math.round((read.length / book.chapters) * 100)
  };
}

// Calculate books finished (all chapters read)
function getBooksFinished(data) {
  return BIBLE_BOOKS.filter(book => {
    const read = data.chaptersRead[book.abbr] || [];
    return read.length === book.chapters;
  }).length;
}

// Calculate chapters per day needed to finish by target date
function getChaptersPerDay(data) {
  const remaining = TOTAL_CHAPTERS - data.stats.totalChapters;
  if (remaining <= 0) return 0;
  const now = new Date();
  const targetDate = data.targetDate ? new Date(data.targetDate) : new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));
  return Math.ceil(remaining / daysLeft);
}

// Get target date (defaults to end of current year)
function getTargetDate(data) {
  if (data.targetDate) return data.targetDate;
  return new Date().getFullYear() + '-12-31';
}

// Get days remaining until target date
function getDaysRemaining(data) {
  const now = new Date();
  const target = data.targetDate ? new Date(data.targetDate) : new Date(now.getFullYear(), 11, 31);
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

// Get target year label
function getTargetYearLabel(data) {
  const target = data.targetDate ? new Date(data.targetDate) : new Date(new Date().getFullYear(), 11, 31);
  return target.getFullYear();
}

// Bible section definitions
const OT_SECTIONS = [
  { name: 'Law of Moses (Torah)', icon: '📜', books: ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy'] },
  { name: 'Psalms/Writings (Ketuvim)', icon: '🎵', books: ['Psalms','Proverbs','Job','Ruth','Song of Solomon','Ecclesiastes','Lamentations','Esther','Daniel','Ezra','Nehemiah','1 Chronicles','2 Chronicles'] },
  { name: 'Prophets (Nevai\'im)', icon: '🔥', books: ['Joshua','Judges','1 Samuel','2 Samuel','1 Kings','2 Kings','Isaiah','Jeremiah','Ezekiel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'] },
];

const NT_SECTIONS = [
  { name: 'Gospel Accounts and Acts', icon: '✝️', books: ['Matthew','Mark','Luke','John','Acts'] },
  { name: 'Letters from the Apostles', icon: '📜', books: ['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude'] },
  { name: 'The Revelation', icon: '💬', books: ['Revelation'] },
];

// Render a single book within a section
function renderBookEntry(book, data) {
  const progress = getBookProgressSync(book.abbr, data);
  const isLocked = _lockedBooks.has(book.abbr);
  return `
    <div class="bible-book-section ${isLocked ? 'locked' : ''}" data-book="${book.abbr}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:15px;">${book.name}</strong>
        <span class="bible-book-progress" style="color:var(--accent);font-weight:700;font-family:'JetBrains Mono',monospace;">${progress.read}/${progress.total}</span>
      </div>
      <div class="bible-book-bar"><div class="bible-book-bar-fill" style="width:${progress.percent}%;background:var(--gold-grad);"></div></div>
      <div style="display:flex;align-items:flex-start;gap:6px;">
        <button class="bible-lock-btn ${isLocked ? 'locked' : ''}" onclick="toggleBookLock('${book.abbr}')" title="Lock/unlock" style="margin-top:2px;flex-shrink:0;">🔒</button>
        <div class="bible-chapter-grid" style="flex:1;">
        ${Array.from({length: book.chapters}, (_, i) => {
          const chapterNum = i + 1;
          const read = (data.chaptersRead[book.abbr] || []).includes(chapterNum);
          return `<button class="chapter-btn ${read ? 'read' : ''}" data-book="${book.abbr}" data-chapter="${chapterNum}">${chapterNum}</button>`;
        }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Calculate section progress
function getSectionProgress(section, data) {
  let total = 0, read = 0;
  section.books.forEach(bookName => {
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (book) {
      total += book.chapters;
      read += (data.chaptersRead[book.abbr] || []).length;
    }
  });
  return { read, total, percent: total > 0 ? Math.round((read / total) * 100) : 0 };
}

// Render books grouped by sections with collapsible headers
function renderTestamentBooks(books, data, sections) {
  return sections.map((section, idx) => {
    const sectionBooks = section.books.map(name => BIBLE_BOOKS.find(b => b.name === name)).filter(Boolean);
    const sp = getSectionProgress(section, data);
    const sectionId = section.name.replace(/[^a-zA-Z]/g, '');
    const stored = localStorage.getItem(`bible_section_${sectionId}`);
    const collapsed = stored !== 'expanded'; // default: collapsed
    return `
      <div class="bible-section-group">
        <div class="bible-section-header" onclick="toggleBibleSection('${sectionId}')" data-section="${sectionId}">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;">${section.icon}</span>
            <span style="font-size:14px;font-weight:700;">${section.name}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span id="section-count-${sectionId}" style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;">${sp.read}/${sp.total}</span>
            <div style="width:60px;height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div id="section-bar-${sectionId}" style="width:${sp.percent}%;height:100%;background:var(--gold-grad);border-radius:3px;"></div>
            </div>
            <span class="bible-section-chevron" id="chevron-${sectionId}">${collapsed ? '▶' : '▼'}</span>
          </div>
        </div>
        <div class="bible-section-body" id="section-${sectionId}" style="${collapsed ? 'display:none;' : ''}">
          ${sectionBooks.map(book => renderBookEntry(book, data)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Render Bible page with testament cards
async function renderBiblePage() {
  const data = await loadBibleProgress();
  const overallPercent = Math.round((data.stats.totalChapters / TOTAL_CHAPTERS) * 100);
  const otRead = OT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const ntRead = NT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const otPct = Math.round((otRead / OT_CHAPTERS) * 100);
  const ntPct = Math.round((ntRead / NT_CHAPTERS) * 100);

  const daysRemaining = getDaysRemaining(data);
  const targetYear = getTargetYearLabel(data);
  const chaptersPerDay = getChaptersPerDay(data);

  return `
    <div class="page bible-page">
      <div class="page-sticky-banner">
        <h1 class="page-title">📖 Bible Reading</h1>
        <div class="btn-group">
          <button class="btn btn-outline" id="btnReadingPlan" onclick="toggleReadingPlan()">📅 Reading Plan</button>
          <button class="btn btn-outline" id="btnReadingGuide" onclick="toggleReadingGuide()">📖 Guide</button>
          <button class="btn btn-outline" id="btnBibleStats" onclick="toggleBibleStats()">📊 Stats</button>
        </div>
      </div>

      <!-- Reading Guide (toggled by Reading Guide button) -->
      <div id="readingGuideCard" style="display:none;margin:16px 0;">
        <div class="card" style="padding:20px;">
          <h2 style="font-size:18px;font-weight:700;color:var(--red,#e74c3c);margin-bottom:8px;">Listening to God Through Scripture</h2>
          <p style="font-style:italic;color:var(--muted);margin-bottom:12px;font-size:13px;">So faith comes from hearing, and hearing through the word of Christ. — Romans 10:17</p>
          <p style="font-size:13px;line-height:1.6;margin-bottom:16px;">One way to listen to God through Scripture is to engage a passage in four movements:</p>
          <div style="margin-bottom:14px;">
            <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--red,#e74c3c);margin-bottom:4px;">Read</h3>
            <p style="font-size:13px;line-height:1.6;">Invite the Holy Spirit to tune your heart to his voice then slowly read the passage two or three times. Pay close attention for a specific word or phrase that jumps out at you.</p>
          </div>
          <div style="margin-bottom:14px;">
            <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--red,#e74c3c);margin-bottom:4px;">Meditate</h3>
            <p style="font-size:13px;line-height:1.6;">Ponder the word or phrase that jumped out to you. Underline it or write it down, memorize it and slowly repeat it to yourself, allowing it to interact with your inner world of thoughts, memories and struggles.</p>
          </div>
          <div style="margin-bottom:14px;">
            <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--red,#e74c3c);margin-bottom:4px;">Pray</h3>
            <p style="font-size:13px;line-height:1.6;">Trusting that the word or phrase contains something God is saying to you, answer him in prayer. Talk with him as you would with someone who knows you and loves you and accepts you.</p>
          </div>
          <div>
            <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--red,#e74c3c);margin-bottom:4px;">Rest</h3>
            <p style="font-size:13px;line-height:1.6;">Rest in God's presence. Don't say anything. Just enjoy his company. Rejoice in knowing that God is with you.</p>
          </div>
        </div>
      </div>

      <!-- Reading Plan (toggled by Today's Reading button) -->
      <div id="readingPlanCard" style="display:none;margin:16px 0;">
        <div class="card" style="padding:16px;">
          <!-- Plan Selector -->
          <div style="display:flex;gap:4px;margin-bottom:12px;background:var(--border);border-radius:8px;padding:3px;">
            <button class="plan-select-btn" data-plan="hamilton" onclick="switchReadingPlan('hamilton')" style="flex:1;padding:6px 8px;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;touch-action:manipulation;transition:all 0.2s;">Hamilton (365d)</button>
            <button class="plan-select-btn" data-plan="luke2444" onclick="switchReadingPlan('luke2444')" style="flex:1;padding:6px 8px;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;touch-action:manipulation;transition:all 0.2s;">Luke 24:44 (262d)</button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h2 id="readingPlanTitle" style="font-size:14px;font-weight:700;margin:0;color:var(--text);line-height:1.3;"></h2>
            <span id="readingPlanDayCount" style="font-size:11px;color:var(--muted);white-space:nowrap;margin-left:8px;"></span>
          </div>
          <div style="background:var(--border);border-radius:8px;height:6px;margin-bottom:16px;overflow:hidden;">
            <div id="readingPlanBar" style="background:var(--accent);height:100%;border-radius:8px;transition:width 0.3s;"></div>
          </div>
          <div id="readingPlanList"></div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
            <button class="btn btn-outline" id="readingPlanPrevBtn" style="font-size:11px;padding:4px 12px;" onclick="showPreviousWeek()">◀ Previous Week</button>
            <button class="btn btn-outline" id="readingPlanNextBtn" style="font-size:11px;padding:4px 12px;" onclick="showMoreReadings()">📃 Full Week ▶</button>
          </div>
        </div>
      </div>

      <!-- All stats (toggled by Stats button) -->
      <div id="bibleStatsAll" style="display:none;">

      <!-- Progress Circles (top row, compact) -->
      <div class="bible-rings-row">
        <div class="bible-ring-compact">
          <div style="position:relative;width:72px;height:72px;">
            <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:72px;height:72px;">
              <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" stroke-width="9"/>
              <circle id="bible-ring-all" cx="70" cy="70" r="56" fill="none"
                      stroke="var(--red, #e74c3c)" stroke-width="9" stroke-linecap="round"
                      stroke-dasharray="${(overallPercent / 100) * 352} 352" stroke-dashoffset="0"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <span id="bible-pct-all" style="font-size:18px;font-weight:800;color:var(--red, #e74c3c);">${overallPercent}%</span>
            </div>
          </div>
          <span style="font-size:11px;color:var(--muted);font-weight:600;">Overall</span>
        </div>
        <div class="bible-ring-compact">
          <div style="position:relative;width:72px;height:72px;">
            <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:72px;height:72px;">
              <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" stroke-width="9"/>
              <circle id="bible-ring-ot" cx="70" cy="70" r="56" fill="none"
                      stroke="var(--purple, #7c3aed)" stroke-width="9" stroke-linecap="round"
                      stroke-dasharray="${(otPct / 100) * 352} 352" stroke-dashoffset="0"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:12px;font-weight:700;color:var(--purple, #7c3aed);" id="bible-ot-label">${otRead}/${OT_CHAPTERS}</span>
            </div>
          </div>
          <span style="font-size:11px;color:var(--muted);font-weight:600;">Old Test.</span>
        </div>
        <div class="bible-ring-compact">
          <div style="position:relative;width:72px;height:72px;">
            <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:72px;height:72px;">
              <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" stroke-width="9"/>
              <circle id="bible-ring-nt" cx="70" cy="70" r="56" fill="none"
                      stroke="var(--green)" stroke-width="9" stroke-linecap="round"
                      stroke-dasharray="${(ntPct / 100) * 352} 352" stroke-dashoffset="0"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:12px;font-weight:700;color:var(--green);" id="bible-nt-label">${ntRead}/${NT_CHAPTERS}</span>
            </div>
          </div>
          <span style="font-size:11px;color:var(--muted);font-weight:600;">New Test.</span>
        </div>
      </div>

      <!-- Chapter Progress Bar -->
      <div class="bible-overall-progress">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;"><span id="bible-read-count">${data.stats.totalChapters}</span> of ${TOTAL_CHAPTERS.toLocaleString()} chapters</span>
          <span style="font-size:13px;color:var(--muted);"><span id="bible-remaining-count">${TOTAL_CHAPTERS - data.stats.totalChapters}</span> remaining</span>
        </div>
        <div class="bible-overall-bar">
          <div class="bible-overall-bar-fill" style="width:${overallPercent}%;" id="bible-overall-fill"></div>
        </div>
      </div>

      <!-- Chapters Per Day + Target Card -->
      <div class="bible-cpd-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <div style="font-size:28px;font-weight:800;color:var(--accent);font-family:'JetBrains Mono',monospace;" id="bible-cpd">${chaptersPerDay}</div>
            <div style="font-size:12px;color:var(--muted);font-weight:600;">chapters/day to finish</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:var(--blue);font-family:'JetBrains Mono',monospace;" id="bible-days-remaining">${daysRemaining}</div>
            <div style="font-size:12px;color:var(--muted);font-weight:600;">days remaining</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--border);">
          <span style="font-size:12px;color:var(--muted);">🎯 Target:</span>
          <input type="date" class="form-input bible-target-input" id="bibleTargetDate" value="${getTargetDate(data)}" onchange="updateBibleTargetDate()" style="flex:1;">
        </div>
      </div>

      <!-- Genre breakdown (inside stats toggle) -->
      <div id="bibleStatsPanel" style="display:none;">
        <div class="card" style="padding:16px;margin-bottom:16px;">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">📊 Genre Breakdown</h3>
          <div id="genreProgressBars"></div>
        </div>
      </div>
      </div><!-- end bibleStatsAll -->

      <!-- Old Testament Card -->
      <div id="bible-ot-section">
        <h2 style="font-size:18px;font-weight:700;margin:20px 0 12px;display:flex;align-items:center;gap:8px;">📜 TaNaKH / Old Testament <span id="bible-ot-header-count" style="font-size:13px;color:var(--muted);font-weight:500;">${otRead}/${OT_CHAPTERS}</span></h2>
        <div class="card" style="margin-bottom:16px;padding:0;overflow:hidden;">
          ${renderTestamentBooks(OT_BOOKS, data, OT_SECTIONS)}
        </div>
      </div>

      <!-- New Testament Card -->
      <div id="bible-nt-section">
        <h2 style="font-size:18px;font-weight:700;margin:20px 0 12px;display:flex;align-items:center;gap:8px;">✝️ New Testament <span id="bible-nt-header-count" style="font-size:13px;color:var(--muted);font-weight:500;">${ntRead}/${NT_CHAPTERS}</span></h2>
        <div class="card" style="margin-bottom:16px;padding:0;overflow:hidden;">
          ${renderTestamentBooks(NT_BOOKS, data, NT_SECTIONS)}
        </div>
      </div>
    </div>
  `;
}

// Toggle collapsible Bible section
window.toggleBibleSection = function(sectionId) {
  const body = document.getElementById('section-' + sectionId);
  const chevron = document.getElementById('chevron-' + sectionId);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? '' : 'none';
  if (chevron) chevron.textContent = isHidden ? '▼' : '▶';
  localStorage.setItem(`bible_section_${sectionId}`, isHidden ? 'expanded' : 'collapsed');
};

// Update target date
window.updateBibleTargetDate = async function() {
  const input = document.getElementById('bibleTargetDate');
  if (!input || !_bibleCache) return;
  _bibleCache.targetDate = input.value;
  scheduleBibleSave();
  // Update chapters/day and days remaining
  const cpdEl = document.getElementById('bible-cpd');
  if (cpdEl) cpdEl.textContent = getChaptersPerDay(_bibleCache);
  const daysEl = document.getElementById('bible-days-remaining');
  if (daysEl) daysEl.textContent = getDaysRemaining(_bibleCache);
};

// Scroll to testament section
window.scrollToTestament = function(testament) {
  const el = document.getElementById(testament === 'OT' ? 'bible-ot-section' : 'bible-nt-section');
  if (el) {
    const banner = document.querySelector('.page-sticky-banner');
    const offset = banner ? banner.offsetHeight + 8 : 8;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

// Initialize Bible page
function initBiblePage() {
  // Chapter button clicks (for non-touch / single taps)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.chapter-btn');
    if (!btn) return;
    
    e.stopPropagation();
    // Skip if touch/drag handler already processed this
    if (_dragState || _touchHandledChapter) {
      _touchHandledChapter = false;
      return;
    }
    
    const bookAbbr = btn.dataset.book;
    // Skip if book is locked
    if (_lockedBooks.has(bookAbbr)) return;
    
    const chapterNum = parseInt(btn.dataset.chapter);
    toggleChapter(bookAbbr, chapterNum);
  });

  // Touch-drag chapter selection
  initChapterDragSelection();
}