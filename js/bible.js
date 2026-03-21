/* ====================================
   BIBLE READING TRACKER PAGE
   Port of Chapter by Chapter functionality
   ==================================== */

// Bible data structure (66 books, no deuterocanonical)
const BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis", abbr: "Gen", chapters: 50, genre: "Law" },
  { name: "Exodus", abbr: "Exo", chapters: 40, genre: "Law" },
  { name: "Leviticus", abbr: "Lev", chapters: 27, genre: "Law" },
  { name: "Numbers", abbr: "Num", chapters: 36, genre: "Law" },
  { name: "Deuteronomy", abbr: "Deu", chapters: 34, genre: "Law" },
  { name: "Joshua", abbr: "Jos", chapters: 24, genre: "History" },
  { name: "Judges", abbr: "Jdg", chapters: 21, genre: "History" },
  { name: "Ruth", abbr: "Rut", chapters: 4, genre: "History" },
  { name: "1 Samuel", abbr: "1Sa", chapters: 31, genre: "History" },
  { name: "2 Samuel", abbr: "2Sa", chapters: 24, genre: "History" },
  { name: "1 Kings", abbr: "1Ki", chapters: 22, genre: "History" },
  { name: "2 Kings", abbr: "2Ki", chapters: 25, genre: "History" },
  { name: "1 Chronicles", abbr: "1Ch", chapters: 29, genre: "History" },
  { name: "2 Chronicles", abbr: "2Ch", chapters: 36, genre: "History" },
  { name: "Ezra", abbr: "Ezr", chapters: 10, genre: "History" },
  { name: "Nehemiah", abbr: "Neh", chapters: 13, genre: "History" },
  { name: "Esther", abbr: "Est", chapters: 10, genre: "History" },
  { name: "Job", abbr: "Job", chapters: 42, genre: "Wisdom" },
  { name: "Psalms", abbr: "Psa", chapters: 150, genre: "Wisdom" },
  { name: "Proverbs", abbr: "Pro", chapters: 31, genre: "Wisdom" },
  { name: "Ecclesiastes", abbr: "Ecc", chapters: 12, genre: "Wisdom" },
  { name: "Song of Solomon", abbr: "Sol", chapters: 8, genre: "Wisdom" },
  { name: "Isaiah", abbr: "Isa", chapters: 66, genre: "Major Prophets" },
  { name: "Jeremiah", abbr: "Jer", chapters: 52, genre: "Major Prophets" },
  { name: "Lamentations", abbr: "Lam", chapters: 5, genre: "Major Prophets" },
  { name: "Ezekiel", abbr: "Eze", chapters: 48, genre: "Major Prophets" },
  { name: "Daniel", abbr: "Dan", chapters: 12, genre: "Major Prophets" },
  { name: "Hosea", abbr: "Hos", chapters: 14, genre: "Minor Prophets" },
  { name: "Joel", abbr: "Joe", chapters: 3, genre: "Minor Prophets" },
  { name: "Amos", abbr: "Amo", chapters: 9, genre: "Minor Prophets" },
  { name: "Obadiah", abbr: "Oba", chapters: 1, genre: "Minor Prophets" },
  { name: "Jonah", abbr: "Jon", chapters: 4, genre: "Minor Prophets" },
  { name: "Micah", abbr: "Mic", chapters: 7, genre: "Minor Prophets" },
  { name: "Nahum", abbr: "Nah", chapters: 3, genre: "Minor Prophets" },
  { name: "Habakkuk", abbr: "Hab", chapters: 3, genre: "Minor Prophets" },
  { name: "Zephaniah", abbr: "Zep", chapters: 3, genre: "Minor Prophets" },
  { name: "Haggai", abbr: "Hag", chapters: 2, genre: "Minor Prophets" },
  { name: "Zechariah", abbr: "Zec", chapters: 14, genre: "Minor Prophets" },
  { name: "Malachi", abbr: "Mal", chapters: 4, genre: "Minor Prophets" },
  // New Testament
  { name: "Matthew", abbr: "Mat", chapters: 28, genre: "Gospels" },
  { name: "Mark", abbr: "Mar", chapters: 16, genre: "Gospels" },
  { name: "Luke", abbr: "Luk", chapters: 24, genre: "Gospels" },
  { name: "John", abbr: "Joh", chapters: 21, genre: "Gospels" },
  { name: "Acts", abbr: "Act", chapters: 28, genre: "History" },
  { name: "Romans", abbr: "Rom", chapters: 16, genre: "Paul's Letters" },
  { name: "1 Corinthians", abbr: "1Co", chapters: 16, genre: "Paul's Letters" },
  { name: "2 Corinthians", abbr: "2Co", chapters: 13, genre: "Paul's Letters" },
  { name: "Galatians", abbr: "Gal", chapters: 6, genre: "Paul's Letters" },
  { name: "Ephesians", abbr: "Eph", chapters: 6, genre: "Paul's Letters" },
  { name: "Philippians", abbr: "Phi", chapters: 4, genre: "Paul's Letters" },
  { name: "Colossians", abbr: "Col", chapters: 4, genre: "Paul's Letters" },
  { name: "1 Thessalonians", abbr: "1Th", chapters: 5, genre: "Paul's Letters" },
  { name: "2 Thessalonians", abbr: "2Th", chapters: 3, genre: "Paul's Letters" },
  { name: "1 Timothy", abbr: "1Ti", chapters: 6, genre: "Paul's Letters" },
  { name: "2 Timothy", abbr: "2Ti", chapters: 4, genre: "Paul's Letters" },
  { name: "Titus", abbr: "Tit", chapters: 3, genre: "Paul's Letters" },
  { name: "Philemon", abbr: "Phm", chapters: 1, genre: "Paul's Letters" },
  { name: "Hebrews", abbr: "Heb", chapters: 13, genre: "General Letters" },
  { name: "James", abbr: "Jam", chapters: 5, genre: "General Letters" },
  { name: "1 Peter", abbr: "1Pe", chapters: 5, genre: "General Letters" },
  { name: "2 Peter", abbr: "2Pe", chapters: 3, genre: "General Letters" },
  { name: "1 John", abbr: "1Jo", chapters: 5, genre: "General Letters" },
  { name: "2 John", abbr: "2Jo", chapters: 1, genre: "General Letters" },
  { name: "3 John", abbr: "3Jo", chapters: 1, genre: "General Letters" },
  { name: "Jude", abbr: "Jud", chapters: 1, genre: "General Letters" },
  { name: "Revelation", abbr: "Rev", chapters: 22, genre: "Prophecy" }
];

// Total chapters in Bible
const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);

// Get user data key
function getBibleDataKey() {
  const user = getCurrentUser();
  return user ? `bible_data_${user.id}` : 'bible_data_mock';
}

// Load Bible progress from localStorage
function loadBibleProgress() {
  const key = getBibleDataKey();
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return {
    chaptersRead: {}, // { "Gen": [1, 2, 3], "Exo": [1, 5] }
    streak: { current: 0, best: 0, lastRead: null },
    stats: { totalChapters: 0, booksCompleted: 0 }
  };
}

// Save Bible progress
function saveBibleProgress(data) {
  const key = getBibleDataKey();
  localStorage.setItem(key, JSON.stringify(data));
}

// Toggle chapter read status
function toggleChapter(bookAbbr, chapterNum) {
  const data = loadBibleProgress();

  if (!data.chaptersRead[bookAbbr]) {
    data.chaptersRead[bookAbbr] = [];
  }

  const index = data.chaptersRead[bookAbbr].indexOf(chapterNum);
  if (index > -1) {
    // Unmark
    data.chaptersRead[bookAbbr].splice(index, 1);
  } else {
    // Mark as read
    data.chaptersRead[bookAbbr].push(chapterNum);

    // Update streak
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

  // Update stats
  data.stats.totalChapters = Object.values(data.chaptersRead).flat().length;
  data.stats.booksCompleted = BIBLE_BOOKS.filter(book => {
    const read = data.chaptersRead[book.abbr] || [];
    return read.length === book.chapters;
  }).length;

  saveBibleProgress(data);
  renderBiblePage();
  initBiblePage();
}

// Calculate book progress
function getBookProgress(bookAbbr) {
  const data = loadBibleProgress();
  const book = BIBLE_BOOKS.find(b => b.abbr === bookAbbr);
  const read = data.chaptersRead[bookAbbr] || [];
  return {
    read: read.length,
    total: book.chapters,
    percent: Math.round((read.length / book.chapters) * 100)
  };
}

// Render Bible page
function renderBiblePage() {
  const data = loadBibleProgress();
  const overallPercent = Math.round((data.stats.totalChapters / TOTAL_CHAPTERS) * 100);

  // Genre groupings
  const genres = {};
  BIBLE_BOOKS.forEach(book => {
    if (!genres[book.genre]) genres[book.genre] = [];
    genres[book.genre].push(book);
  });

  // Calculate genre progress
  const genreProgress = {};
  Object.keys(genres).forEach(genre => {
    const books = genres[genre];
    const totalChapters = books.reduce((sum, b) => sum + b.chapters, 0);
    const readChapters = books.reduce((sum, b) => {
      const read = data.chaptersRead[b.abbr] || [];
      return sum + read.length;
    }, 0);
    genreProgress[genre] = {
      read: readChapters,
      total: totalChapters,
      percent: Math.round((readChapters / totalChapters) * 100)
    };
  });

  return `
    <div class="page bible-page">
      <h1 class="page-title">Bible Reading Tracker</h1>

      <!-- Overall Stats -->
      <div class="bible-stats-card card">
        <div class="bible-overall-progress">
          <div class="progress-ring-wrapper">
            <svg class="progress-ring" width="120" height="120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="8"
                stroke-dasharray="${(overallPercent / 100) * 326.73} 326.73"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"/>
              <text x="60" y="60" text-anchor="middle" dy="8" font-size="28" font-weight="700" fill="var(--accent)">${overallPercent}%</text>
            </svg>
          </div>
          <div class="bible-stats-text">
            <div class="stat-item">
              <span class="stat-label">Chapters Read</span>
              <span class="stat-value">${data.stats.totalChapters} / ${TOTAL_CHAPTERS}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Books Completed</span>
              <span class="stat-value">${data.stats.booksCompleted} / 66</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Current Streak</span>
              <span class="stat-value">${data.streak.current} days</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Best Streak</span>
              <span class="stat-value">${data.streak.best} days</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Genre Progress Bars -->
      <div class="genre-progress-section">
        <h3>Progress by Genre</h3>
        ${Object.keys(genreProgress).map(genre => `
          <div class="genre-bar-item">
            <div class="genre-bar-header">
              <span class="genre-name">${genre}</span>
              <span class="genre-percent">${genreProgress[genre].percent}%</span>
            </div>
            <div class="genre-bar">
              <div class="genre-bar-fill" style="width: ${genreProgress[genre].percent}%"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Books Grid -->
      <div class="bible-books-grid">
        ${Object.keys(genres).map(genre => `
          <div class="genre-section">
            <h3 class="genre-heading">${genre}</h3>
            <div class="books-list">
              ${genres[genre].map(book => {
                const progress = getBookProgress(book.abbr);
                const isCompleted = progress.percent === 100;
                return `
                  <div class="book-card ${isCompleted ? 'completed' : ''}" data-book="${book.abbr}">
                    <div class="book-header">
                      <span class="book-name">${book.name}</span>
                      <span class="book-progress">${progress.read}/${progress.total}</span>
                    </div>
                    <div class="book-progress-bar">
                      <div class="book-progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                    <div class="chapter-grid" id="chapters-${book.abbr}" style="display: none;">
                      ${Array.from({length: book.chapters}, (_, i) => {
                        const chapterNum = i + 1;
                        const read = (data.chaptersRead[book.abbr] || []).includes(chapterNum);
                        return `
                          <button class="chapter-btn ${read ? 'read' : ''}"
                                  data-book="${book.abbr}"
                                  data-chapter="${chapterNum}">
                            ${chapterNum}
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Initialize Bible page
function initBiblePage() {
  // Book card expand/collapse
  document.querySelectorAll('.book-card').forEach(card => {
    const bookAbbr = card.dataset.book;
    const header = card.querySelector('.book-header');
    const chapterGrid = document.getElementById(`chapters-${bookAbbr}`);

    header.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = chapterGrid.style.display === 'grid';
      chapterGrid.style.display = isVisible ? 'none' : 'grid';
    });
  });

  // Chapter button clicks
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bookAbbr = btn.dataset.book;
      const chapterNum = parseInt(btn.dataset.chapter);
      toggleChapter(bookAbbr, chapterNum);
    });
  });
}
