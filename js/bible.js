/* ====================================
   BIBLE READING TRACKER PAGE
   Testament Cards, Book Locks, Sticky Header
   ==================================== */

// Bible data structure (66 books, no deuterocanonical)
const BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis", abbr: "Gen", chapters: 50, genre: "Law", testament: "OT" },
  { name: "Exodus", abbr: "Exo", chapters: 40, genre: "Law", testament: "OT" },
  { name: "Leviticus", abbr: "Lev", chapters: 27, genre: "Law", testament: "OT" },
  { name: "Numbers", abbr: "Num", chapters: 36, genre: "Law", testament: "OT" },
  { name: "Deuteronomy", abbr: "Deu", chapters: 34, genre: "Law", testament: "OT" },
  { name: "Joshua", abbr: "Jos", chapters: 24, genre: "History", testament: "OT" },
  { name: "Judges", abbr: "Jdg", chapters: 21, genre: "History", testament: "OT" },
  { name: "Ruth", abbr: "Rut", chapters: 4, genre: "History", testament: "OT" },
  { name: "1 Samuel", abbr: "1Sa", chapters: 31, genre: "History", testament: "OT" },
  { name: "2 Samuel", abbr: "2Sa", chapters: 24, genre: "History", testament: "OT" },
  { name: "1 Kings", abbr: "1Ki", chapters: 22, genre: "History", testament: "OT" },
  { name: "2 Kings", abbr: "2Ki", chapters: 25, genre: "History", testament: "OT" },
  { name: "1 Chronicles", abbr: "1Ch", chapters: 29, genre: "History", testament: "OT" },
  { name: "2 Chronicles", abbr: "2Ch", chapters: 36, genre: "History", testament: "OT" },
  { name: "Ezra", abbr: "Ezr", chapters: 10, genre: "History", testament: "OT" },
  { name: "Nehemiah", abbr: "Neh", chapters: 13, genre: "History", testament: "OT" },
  { name: "Esther", abbr: "Est", chapters: 10, genre: "History", testament: "OT" },
  { name: "Job", abbr: "Job", chapters: 42, genre: "Wisdom", testament: "OT" },
  { name: "Psalms", abbr: "Psa", chapters: 150, genre: "Wisdom", testament: "OT" },
  { name: "Proverbs", abbr: "Pro", chapters: 31, genre: "Wisdom", testament: "OT" },
  { name: "Ecclesiastes", abbr: "Ecc", chapters: 12, genre: "Wisdom", testament: "OT" },
  { name: "Song of Solomon", abbr: "Sol", chapters: 8, genre: "Wisdom", testament: "OT" },
  { name: "Isaiah", abbr: "Isa", chapters: 66, genre: "Major Prophets", testament: "OT" },
  { name: "Jeremiah", abbr: "Jer", chapters: 52, genre: "Major Prophets", testament: "OT" },
  { name: "Lamentations", abbr: "Lam", chapters: 5, genre: "Major Prophets", testament: "OT" },
  { name: "Ezekiel", abbr: "Eze", chapters: 48, genre: "Major Prophets", testament: "OT" },
  { name: "Daniel", abbr: "Dan", chapters: 12, genre: "Major Prophets", testament: "OT" },
  { name: "Hosea", abbr: "Hos", chapters: 14, genre: "Minor Prophets", testament: "OT" },
  { name: "Joel", abbr: "Joe", chapters: 3, genre: "Minor Prophets", testament: "OT" },
  { name: "Amos", abbr: "Amo", chapters: 9, genre: "Minor Prophets", testament: "OT" },
  { name: "Obadiah", abbr: "Oba", chapters: 1, genre: "Minor Prophets", testament: "OT" },
  { name: "Jonah", abbr: "Jon", chapters: 4, genre: "Minor Prophets", testament: "OT" },
  { name: "Micah", abbr: "Mic", chapters: 7, genre: "Minor Prophets", testament: "OT" },
  { name: "Nahum", abbr: "Nah", chapters: 3, genre: "Minor Prophets", testament: "OT" },
  { name: "Habakkuk", abbr: "Hab", chapters: 3, genre: "Minor Prophets", testament: "OT" },
  { name: "Zephaniah", abbr: "Zep", chapters: 3, genre: "Minor Prophets", testament: "OT" },
  { name: "Haggai", abbr: "Hag", chapters: 2, genre: "Minor Prophets", testament: "OT" },
  { name: "Zechariah", abbr: "Zec", chapters: 14, genre: "Minor Prophets", testament: "OT" },
  { name: "Malachi", abbr: "Mal", chapters: 4, genre: "Minor Prophets", testament: "OT" },
  // New Testament
  { name: "Matthew", abbr: "Mat", chapters: 28, genre: "Gospels", testament: "NT" },
  { name: "Mark", abbr: "Mar", chapters: 16, genre: "Gospels", testament: "NT" },
  { name: "Luke", abbr: "Luk", chapters: 24, genre: "Gospels", testament: "NT" },
  { name: "John", abbr: "Joh", chapters: 21, genre: "Gospels", testament: "NT" },
  { name: "Acts", abbr: "Act", chapters: 28, genre: "History", testament: "NT" },
  { name: "Romans", abbr: "Rom", chapters: 16, genre: "Paul's Letters", testament: "NT" },
  { name: "1 Corinthians", abbr: "1Co", chapters: 16, genre: "Paul's Letters", testament: "NT" },
  { name: "2 Corinthians", abbr: "2Co", chapters: 13, genre: "Paul's Letters", testament: "NT" },
  { name: "Galatians", abbr: "Gal", chapters: 6, genre: "Paul's Letters", testament: "NT" },
  { name: "Ephesians", abbr: "Eph", chapters: 6, genre: "Paul's Letters", testament: "NT" },
  { name: "Philippians", abbr: "Phi", chapters: 4, genre: "Paul's Letters", testament: "NT" },
  { name: "Colossians", abbr: "Col", chapters: 4, genre: "Paul's Letters", testament: "NT" },
  { name: "1 Thessalonians", abbr: "1Th", chapters: 5, genre: "Paul's Letters", testament: "NT" },
  { name: "2 Thessalonians", abbr: "2Th", chapters: 3, genre: "Paul's Letters", testament: "NT" },
  { name: "1 Timothy", abbr: "1Ti", chapters: 6, genre: "Paul's Letters", testament: "NT" },
  { name: "2 Timothy", abbr: "2Ti", chapters: 4, genre: "Paul's Letters", testament: "NT" },
  { name: "Titus", abbr: "Tit", chapters: 3, genre: "Paul's Letters", testament: "NT" },
  { name: "Philemon", abbr: "Phm", chapters: 1, genre: "Paul's Letters", testament: "NT" },
  { name: "Hebrews", abbr: "Heb", chapters: 13, genre: "General Letters", testament: "NT" },
  { name: "James", abbr: "Jam", chapters: 5, genre: "General Letters", testament: "NT" },
  { name: "1 Peter", abbr: "1Pe", chapters: 5, genre: "General Letters", testament: "NT" },
  { name: "2 Peter", abbr: "2Pe", chapters: 3, genre: "General Letters", testament: "NT" },
  { name: "1 John", abbr: "1Jo", chapters: 5, genre: "General Letters", testament: "NT" },
  { name: "2 John", abbr: "2Jo", chapters: 1, genre: "General Letters", testament: "NT" },
  { name: "3 John", abbr: "3Jo", chapters: 1, genre: "General Letters", testament: "NT" },
  { name: "Jude", abbr: "Jud", chapters: 1, genre: "General Letters", testament: "NT" },
  { name: "Revelation", abbr: "Rev", chapters: 22, genre: "Prophecy", testament: "NT" }
];

const OT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'OT');
const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT');
const OT_CHAPTERS = OT_BOOKS.reduce((s, b) => s + b.chapters, 0);
const NT_CHAPTERS = NT_BOOKS.reduce((s, b) => s + b.chapters, 0);
const TOTAL_CHAPTERS = OT_CHAPTERS + NT_CHAPTERS;

// Genre definitions for stats panel
const BIBLE_GENRES = [
  { name: 'Pentateuch', color: '#C05535', books: ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy'] },
  { name: 'History', color: '#6B62A8', books: ['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther'] },
  { name: 'Poetry & Wisdom', color: '#A83878', books: ['Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon'] },
  { name: 'Major Prophets', color: '#28827A', books: ['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel'] },
  { name: 'Minor Prophets', color: '#9A6228', books: ['Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'] },
  { name: 'Gospels & Acts', color: '#38885A', books: ['Matthew','Mark','Luke','John','Acts'] },
  { name: "Paul's Letters", color: '#3E68B8', books: ['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon'] },
  { name: 'General Epistles', color: '#AA3A3A', books: ['Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude'] },
  { name: 'Revelation', color: '#6A42A8', books: ['Revelation'] },
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
    data.chaptersRead[bookAbbr].splice(index, 1);
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
    data.chaptersRead[bookAbbr].splice(index, 1);
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

  // Main ring (overall)
  const mainRing = document.getElementById('bible-ring-all');
  if (mainRing) mainRing.setAttribute('stroke-dasharray', `${(overallPercent / 100) * 327} 327`);
  const mainPct = document.getElementById('bible-pct-all');
  if (mainPct) mainPct.textContent = overallPercent + '%';

  // OT ring
  const otRing = document.getElementById('bible-ring-ot');
  if (otRing) otRing.setAttribute('stroke-dasharray', `${(otPct / 100) * 327} 327`);
  const otPct2 = document.getElementById('bible-pct-ot');
  if (otPct2) otPct2.textContent = otPct + '%';

  // NT ring
  const ntRing = document.getElementById('bible-ring-nt');
  if (ntRing) ntRing.setAttribute('stroke-dasharray', `${(ntPct / 100) * 327} 327`);
  const ntPct2 = document.getElementById('bible-pct-nt');
  if (ntPct2) ntPct2.textContent = ntPct + '%';

  // Update any legacy stat displays that might exist
  const sRead = document.getElementById('bible-s-read');
  if (sRead) sRead.textContent = data.stats.totalChapters;
  const sLeft = document.getElementById('bible-s-left');
  if (sLeft) sLeft.textContent = (TOTAL_CHAPTERS - data.stats.totalChapters).toLocaleString();
  const sBooks = document.getElementById('bible-s-books');
  if (sBooks) sBooks.textContent = data.stats.booksCompleted;
  const sStreak = document.getElementById('bible-s-streak');
  if (sStreak) sStreak.textContent = data.streak.current || '—';
}

// Calculate genre stats
function calculateGenreStats(data) {
  // Create mapping from BIBLE_GENRES names to BIBLE_BOOKS genre field
  const genreMapping = {
    'Pentateuch': ['Law'],
    'History': ['History'],
    'Poetry & Wisdom': ['Wisdom'],
    'Major Prophets': ['Major Prophets'],
    'Minor Prophets': ['Minor Prophets'],
    'Gospels & Acts': ['Gospels', 'History'], // Acts is in History genre
    "Paul's Letters": ["Paul's Letters"],
    'General Epistles': ['General Letters'],
    'Revelation': ['Prophecy']
  };
  
  return BIBLE_GENRES.map(genre => {
    let totalChapters = 0;
    let readChapters = 0;
    
    // Find books by genre mapping or by explicit book name
    const relevantGenres = genreMapping[genre.name] || [];
    
    // Filter books by genre or by name
    const booksInGenre = BIBLE_BOOKS.filter(book => {
      // For Gospels & Acts, we need special handling since Acts is in History but should count as Gospels & Acts
      if (genre.name === 'Gospels & Acts') {
        return book.genre === 'Gospels' || book.name === 'Acts';
      }
      return relevantGenres.includes(book.genre);
    });
    
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
window.toggleBibleStats = function() {
  const panel = document.getElementById('bibleStatsPanel');
  
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
    
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
  } else {
    panel.style.display = 'none';
  }
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

// Calculate chapters per day needed to finish this year
function getChaptersPerDay(data) {
  const remaining = TOTAL_CHAPTERS - data.stats.totalChapters;
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysLeft = Math.max(1, Math.ceil((endOfYear - now) / (1000 * 60 * 60 * 24)));
  return Math.ceil(remaining / daysLeft);
}

// Render books in testament card format
function renderTestamentBooks(books, data) {
  return books.map(book => {
    const progress = getBookProgressSync(book.abbr, data);
    const isLocked = _lockedBooks.has(book.abbr);
    return `
      <div class="bible-book-section ${isLocked ? 'locked' : ''}" data-book="${book.abbr}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:15px;">${book.name}</strong>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="bible-book-progress" style="color:var(--accent);font-weight:700;font-family:'JetBrains Mono',monospace;">${progress.read}/${progress.total}</span>
            <button class="bible-lock-btn ${isLocked ? 'locked' : ''}" onclick="toggleBookLock('${book.abbr}')" title="Lock/unlock">🔒</button>
          </div>
        </div>
        <div class="bible-book-bar"><div class="bible-book-bar-fill" style="width:${progress.percent}%;background:var(--gold-grad);"></div></div>
        <div class="bible-chapter-grid">
          ${Array.from({length: book.chapters}, (_, i) => {
            const chapterNum = i + 1;
            const read = (data.chaptersRead[book.abbr] || []).includes(chapterNum);
            return `<button class="chapter-btn ${read ? 'read' : ''}" data-book="${book.abbr}" data-chapter="${chapterNum}">${chapterNum}</button>`;
          }).join('')}
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

  return `
    <div class="page bible-page">
      <div class="page-sticky-banner">
        <h1 class="page-title">📖 Bible Reading</h1>
        <div class="btn-group">
          <button class="btn btn-outline" onclick="scrollToTestament('OT')">Old Testament</button>
          <button class="btn btn-outline" onclick="scrollToTestament('NT')">New Testament</button>
          <button class="btn btn-primary" onclick="toggleBibleStats()">📊 Stats</button>
        </div>
      </div>

      <!-- Stats panel (hidden by default) -->
      <div id="bibleStatsPanel" style="display:none;">
        <!-- Three circular progress indicators -->
        <div class="bible-progress-circles">
          <div class="bible-progress-circle">
            <div style="position:relative;width:80px;height:80px;">
              <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:80px;height:80px;">
                <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
                <circle id="bible-ring-all" cx="70" cy="70" r="52" fill="none"
                        stroke="var(--accent)" stroke-width="8" stroke-linecap="round"
                        stroke-dasharray="${(overallPercent / 100) * 327} 327" stroke-dashoffset="0"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <span id="bible-pct-all" style="font-size:1em;font-weight:700;color:var(--accent);line-height:1;">${overallPercent}%</span>
                <span style="font-size:0.4em;color:var(--muted);font-weight:600;text-transform:uppercase;">Overall</span>
              </div>
            </div>
          </div>
          <div class="bible-progress-circle">
            <div style="position:relative;width:80px;height:80px;">
              <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:80px;height:80px;">
                <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
                <circle id="bible-ring-ot" cx="70" cy="70" r="52" fill="none"
                        stroke="var(--blue)" stroke-width="8" stroke-linecap="round"
                        stroke-dasharray="${(otPct / 100) * 327} 327" stroke-dashoffset="0"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <span id="bible-pct-ot" style="font-size:1em;font-weight:700;color:var(--blue);line-height:1;">${otPct}%</span>
                <span style="font-size:0.4em;color:var(--muted);font-weight:600;text-transform:uppercase;">Old Test.</span>
              </div>
            </div>
          </div>
          <div class="bible-progress-circle">
            <div style="position:relative;width:80px;height:80px;">
              <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:80px;height:80px;">
                <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
                <circle id="bible-ring-nt" cx="70" cy="70" r="52" fill="none"
                        stroke="var(--green)" stroke-width="8" stroke-linecap="round"
                        stroke-dasharray="${(ntPct / 100) * 327} 327" stroke-dashoffset="0"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <span id="bible-pct-nt" style="font-size:1em;font-weight:700;color:var(--green);line-height:1;">${ntPct}%</span>
                <span style="font-size:0.4em;color:var(--muted);font-weight:600;text-transform:uppercase;">New Test.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reading Stats Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-top:16px;">
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--accent);font-family:'JetBrains Mono',monospace;">${data.stats.totalChapters}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Chapters Read</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--muted);font-family:'JetBrains Mono',monospace;">${TOTAL_CHAPTERS - data.stats.totalChapters}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Chapters To Go</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--green);font-family:'JetBrains Mono',monospace;">${getBooksFinished(data)}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Books Finished</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--blue);font-family:'JetBrains Mono',monospace;">${getChaptersPerDay(data)}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Chapters/Day</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--orange);font-family:'JetBrains Mono',monospace;">${data.streak || 0}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Day Streak</div>
          </div>
          ${data.bestStreak ? `
          <div style="text-align:center;padding:12px;background:var(--surface);border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:var(--purple);font-family:'JetBrains Mono',monospace;">${data.bestStreak}</div>
            <div style="font-size:11px;color:var(--muted);font-weight:600;">Best Streak</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Old Testament Card -->
      <div id="bible-ot-section">
        <div class="card" style="margin-bottom:16px;">
          ${renderTestamentBooks(OT_BOOKS, data)}
        </div>
      </div>

      <!-- New Testament Card -->
      <div id="bible-nt-section">
        <div class="card" style="margin-bottom:16px;">
          ${renderTestamentBooks(NT_BOOKS, data)}
        </div>
      </div>
    </div>
  `;
}

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