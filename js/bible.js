/* ====================================
   BIBLE READING TRACKER PAGE
   Port of Chapter by Chapter functionality
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
    chaptersRead: {},
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
    data.chaptersRead[bookAbbr].splice(index, 1);
  } else {
    data.chaptersRead[bookAbbr].push(chapterNum);

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

  data.stats.totalChapters = Object.values(data.chaptersRead).flat().length;
  data.stats.booksCompleted = BIBLE_BOOKS.filter(book => {
    const read = data.chaptersRead[book.abbr] || [];
    return read.length === book.chapters;
  }).length;

  saveBibleProgress(data);

  // Re-render just the stats and the toggled button instead of full page
  updateBibleStats(data);
  const btn = document.querySelector(`.chapter-btn[data-book="${bookAbbr}"][data-chapter="${chapterNum}"]`);
  if (btn) btn.classList.toggle('read');

  // Update book progress bar
  const book = BIBLE_BOOKS.find(b => b.abbr === bookAbbr);
  const read = (data.chaptersRead[bookAbbr] || []).length;
  const pct = Math.round((read / book.chapters) * 100);
  const card = document.querySelector(`.book-card[data-book="${bookAbbr}"]`);
  if (card) {
    card.querySelector('.book-progress').textContent = `${read}/${book.chapters}`;
    const fill = card.querySelector('.book-progress-fill');
    if (fill) fill.style.width = pct + '%';
    card.classList.toggle('completed', pct === 100);
  }
}

function updateBibleStats(data) {
  const overallPercent = Math.round((data.stats.totalChapters / TOTAL_CHAPTERS) * 100);
  const otRead = OT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const ntRead = NT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const otPct = Math.round((otRead / OT_CHAPTERS) * 100);
  const ntPct = Math.round((ntRead / NT_CHAPTERS) * 100);

  // Main ring
  const mainRing = document.getElementById('bible-ring-all');
  if (mainRing) mainRing.setAttribute('stroke-dasharray', `${(overallPercent / 100) * 163.36} 163.36`);
  const mainPct = document.getElementById('bible-pct-all');
  if (mainPct) mainPct.textContent = overallPercent + '%';

  // OT ring
  const otRing = document.getElementById('bible-ring-ot');
  if (otRing) otRing.setAttribute('stroke-dasharray', `${(otPct / 100) * 131.9} 131.9`);
  const otSub = document.getElementById('bible-ot-sub');
  if (otSub) otSub.textContent = `${otRead} / ${OT_CHAPTERS}`;

  // NT ring
  const ntRing = document.getElementById('bible-ring-nt');
  if (ntRing) ntRing.setAttribute('stroke-dasharray', `${(ntPct / 100) * 131.9} 131.9`);
  const ntSub = document.getElementById('bible-nt-sub');
  if (ntSub) ntSub.textContent = `${ntRead} / ${NT_CHAPTERS}`;

  // Stat values
  const sRead = document.getElementById('bible-s-read');
  if (sRead) sRead.textContent = data.stats.totalChapters;
  const sLeft = document.getElementById('bible-s-left');
  if (sLeft) sLeft.textContent = (TOTAL_CHAPTERS - data.stats.totalChapters).toLocaleString();
  const sBooks = document.getElementById('bible-s-books');
  if (sBooks) sBooks.textContent = data.stats.booksCompleted;
  const sStreak = document.getElementById('bible-s-streak');
  if (sStreak) sStreak.textContent = data.streak.current || '—';
}

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

function renderBooksList(books, data) {
  return books.map(book => {
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
        <div class="chapter-grid" style="display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px;">
          ${Array.from({length: book.chapters}, (_, i) => {
            const chapterNum = i + 1;
            const read = (data.chaptersRead[book.abbr] || []).includes(chapterNum);
            return `<button class="chapter-btn ${read ? 'read' : ''}"
                            data-book="${book.abbr}"
                            data-chapter="${chapterNum}">${chapterNum}</button>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Render Bible page
function renderBiblePage() {
  const data = loadBibleProgress();
  const overallPercent = Math.round((data.stats.totalChapters / TOTAL_CHAPTERS) * 100);
  const otRead = OT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const ntRead = NT_BOOKS.reduce((s, b) => s + (data.chaptersRead[b.abbr] || []).length, 0);
  const otPct = Math.round((otRead / OT_CHAPTERS) * 100);
  const ntPct = Math.round((ntRead / NT_CHAPTERS) * 100);

  return `
    <div class="page bible-page">
      <h1 class="page-title">📖 Bible Reading</h1>

      <!-- Compact Summary -->
      <div class="bible-summary card" style="display:flex;gap:14px;padding:14px 16px;align-items:center;flex-wrap:wrap;margin-bottom:0;position:sticky;top:0;z-index:11;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <!-- Main ring -->
        <div style="display:flex;gap:12px;align-items:center;flex-shrink:0;">
          <div style="position:relative;width:72px;height:72px;flex-shrink:0;">
            <svg viewBox="0 0 140 140" style="transform:rotate(-90deg);width:72px;height:72px;">
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" stroke-width="11"/>
              <circle id="bible-ring-all" cx="70" cy="70" r="58" fill="none"
                      stroke="var(--accent)" stroke-width="11" stroke-linecap="round"
                      stroke-dasharray="${(overallPercent / 100) * 364.4} 364.4" stroke-dashoffset="0"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <span id="bible-pct-all" style="font-size:1em;font-weight:700;color:var(--accent);line-height:1;">${overallPercent}%</span>
              <span style="font-size:0.42em;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Complete</span>
            </div>
          </div>
          <!-- OT / NT mini rings -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <svg width="52" height="52" viewBox="0 0 52 52" style="transform:rotate(-90deg);flex-shrink:0;">
                <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border)" stroke-width="7"/>
                <circle id="bible-ring-ot" cx="26" cy="26" r="21" fill="none"
                        stroke="var(--purple)" stroke-width="7" stroke-linecap="round"
                        stroke-dasharray="${(otPct / 100) * 131.9} 131.9"/>
              </svg>
              <div>
                <div style="font-size:0.68em;font-weight:600;">Old Testament</div>
                <div id="bible-ot-sub" style="font-size:0.58em;color:var(--muted);">${otRead} / ${OT_CHAPTERS}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <svg width="52" height="52" viewBox="0 0 52 52" style="transform:rotate(-90deg);flex-shrink:0;">
                <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border)" stroke-width="7"/>
                <circle id="bible-ring-nt" cx="26" cy="26" r="21" fill="none"
                        stroke="var(--green)" stroke-width="7" stroke-linecap="round"
                        stroke-dasharray="${(ntPct / 100) * 131.9} 131.9"/>
              </svg>
              <div>
                <div style="font-size:0.68em;font-weight:600;">New Testament</div>
                <div id="bible-nt-sub" style="font-size:0.58em;color:var(--muted);">${ntRead} / ${NT_CHAPTERS}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Stat cards -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;flex:1;min-width:0;">
          <div style="background:var(--bg);border-radius:8px;padding:8px 6px;text-align:center;">
            <div id="bible-s-read" style="font-size:1.1em;font-weight:700;color:var(--accent);line-height:1.1;">${data.stats.totalChapters}</div>
            <div style="font-size:0.56em;color:var(--muted);margin-top:3px;">Chapters read</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:8px 6px;text-align:center;">
            <div id="bible-s-left" style="font-size:1.1em;font-weight:700;line-height:1.1;">${(TOTAL_CHAPTERS - data.stats.totalChapters).toLocaleString()}</div>
            <div style="font-size:0.56em;color:var(--muted);margin-top:3px;">To go</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:8px 6px;text-align:center;">
            <div id="bible-s-books" style="font-size:1.1em;font-weight:700;line-height:1.1;">${data.stats.booksCompleted}</div>
            <div style="font-size:0.56em;color:var(--muted);margin-top:3px;">Books done</div>
          </div>
          <div style="background:var(--bg);border-radius:8px;padding:8px 6px;text-align:center;">
            <div id="bible-s-streak" style="font-size:1.1em;font-weight:700;color:var(--accent);line-height:1.1;">${data.streak.current || '—'}</div>
            <div style="font-size:0.56em;color:var(--muted);margin-top:3px;">Day streak</div>
          </div>
        </div>
      </div>

      <!-- Sticky OT / NT scroll buttons -->
      <div class="bible-tab-bar" style="display:flex;gap:8px;margin-bottom:16px;position:sticky;top:120px;z-index:10;background:var(--bg);padding:8px 0 4px;">
        <button class="btn btn-primary bible-tab-btn active" data-testament="OT" onclick="scrollToTestament('OT')">Old Testament</button>
        <button class="btn btn-outline bible-tab-btn" data-testament="NT" onclick="scrollToTestament('NT')">New Testament</button>
      </div>

      <!-- All books listed in order, chapters auto-visible -->
      <div id="bible-ot-section">
        <h3 style="font-size:0.8em;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:12px;">Old Testament · ${OT_CHAPTERS} chapters</h3>
        <div class="books-list">
          ${renderBooksList(OT_BOOKS, data)}
        </div>
      </div>

      <div id="bible-nt-section" style="margin-top:24px;">
        <h3 style="font-size:0.8em;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:12px;">New Testament · ${NT_CHAPTERS} chapters</h3>
        <div class="books-list">
          ${renderBooksList(NT_BOOKS, data)}
        </div>
      </div>
    </div>
  `;
}

function scrollToTestament(testament) {
  const el = document.getElementById(testament === 'OT' ? 'bible-ot-section' : 'bible-nt-section');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.bible-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.testament === testament);
    b.classList.toggle('btn-primary', b.dataset.testament === testament);
    b.classList.toggle('btn-outline', b.dataset.testament !== testament);
  });
}

// Initialize Bible page
function initBiblePage() {
  // Chapter button clicks
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bookAbbr = btn.dataset.book;
      const chapterNum = parseInt(btn.dataset.chapter);
      toggleChapter(bookAbbr, chapterNum);
    });
  });

  // Position tab bar below sticky summary
  const summary = document.querySelector('.bible-summary');
  const tabBar = document.querySelector('.bible-tab-bar');
  if (summary && tabBar) {
    const updateTabBarTop = () => {
      tabBar.style.top = summary.offsetHeight + 'px';
    };
    updateTabBarTop();
    window.addEventListener('resize', updateTabBarTop);
  }

  // Scroll spy for OT/NT tab highlight
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const testament = entry.target.id === 'bible-nt-section' ? 'NT' : 'OT';
        document.querySelectorAll('.bible-tab-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.testament === testament);
          b.classList.toggle('btn-primary', b.dataset.testament === testament);
          b.classList.toggle('btn-outline', b.dataset.testament !== testament);
        });
      }
    });
  }, { rootMargin: '-100px 0px -80% 0px' });

  const otSection = document.getElementById('bible-ot-section');
  const ntSection = document.getElementById('bible-nt-section');
  if (otSection) observer.observe(otSection);
  if (ntSection) observer.observe(ntSection);
}
