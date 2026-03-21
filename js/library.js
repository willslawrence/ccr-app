/* ====================================
   FRIENDS LIBRARY PAGE
   Fetches from Google Sheets CSV
   ==================================== */

const LIBRARY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1tarzoeTPmF7At2B5a0yJJ9NzcrjtnTuXUgr-71xVHfk/gviz/tq?tqx=out:csv';

let libraryBooks = [];
let libraryCheckouts = [];
let activeLibraryFilters = new Set();
let librarySearchQuery = '';
let libraryFiltersVisible = false;
let currentLibraryTab = 'books';

// Fetch library data
async function fetchLibraryData() {
  try {
    const response = await fetch(LIBRARY_SHEET_URL);
    const csvText = await response.text();
    parseLibraryCSV(csvText);
  } catch (error) {
    console.error('Error fetching library data:', error);
    loadMockLibraryData();
  }
}

// Parse CSV
function parseLibraryCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  libraryBooks = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const book = {};
    headers.forEach((header, idx) => {
      book[header] = values[idx] ? values[idx].trim() : '';
    });

    if (book.Title && book.Title !== '') {
      libraryBooks.push(book);
    }
  }
}

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.replace(/^"|"$/g, ''));
}

// Mock data fallback
function loadMockLibraryData() {
  libraryBooks = [
    { Title: "Mere Christianity", Author: "C.S. Lewis", Category: "Religious", Genre: "Apologetics", Status: "Available", Owner: "Church", ISBN: "9780060652920" },
    { Title: "The Cost of Discipleship", Author: "Dietrich Bonhoeffer", Category: "Religious", Genre: "Discipleship", Status: "Available", Owner: "Church", ISBN: "9780684815008" },
    { Title: "Desiring God", Author: "John Piper", Category: "Theology", Genre: "Christian Hedonism", Status: "Checked Out", Owner: "Church", ISBN: "9781601423917" },
    { Title: "Knowing God", Author: "J.I. Packer", Category: "Theology", Genre: "Doctrine", Status: "Available", Owner: "Will", ISBN: "9780830816507" }
  ];
}

// Get unique values for filters
function getUniqueValues(field) {
  const values = new Set();
  libraryBooks.forEach(book => {
    if (book[field] && book[field] !== '') {
      values.add(book[field]);
    }
  });
  return Array.from(values).sort();
}

// Check if a book matches active filters (OR logic — match ANY active filter)
function bookMatchesFilters(book) {
  if (activeLibraryFilters.size === 0) return true;
  for (const filter of activeLibraryFilters) {
    const [type, ...rest] = filter.split(':');
    const val = rest.join(':');
    if (type === 'cat' && (book.Category || '').toLowerCase() === val) return true;
    if (type === 'genre' && (book.Genre || '').toLowerCase() === val) return true;
    if (type === 'owner' && (book.Owner || '').toLowerCase() === val) return true;
    if (type === 'status' && (book.Status || '').toLowerCase() === val) return true;
  }
  return false;
}

// Check if book matches search
function bookMatchesSearch(book) {
  if (!librarySearchQuery) return true;
  const q = librarySearchQuery.toLowerCase();
  return (book.Title || '').toLowerCase().includes(q) ||
         (book.Author || '').toLowerCase().includes(q) ||
         (book.Genre || '').toLowerCase().includes(q);
}

// Get category pill color
function getCategoryColor(cat) {
  const colors = {
    'Religious': 'background:rgba(167,139,250,0.12);color:#7c3aed;border-color:#c4b5fd;',
    'Thinking': 'background:rgba(96,165,250,0.12);color:#2563eb;border-color:#93c5fd;',
    'Fiction': 'background:rgba(249,115,22,0.12);color:#c2410c;border-color:#fdba74;',
    'Reference': 'background:rgba(20,184,166,0.12);color:#0f766e;border-color:#5eead4;',
    'Kids': 'background:rgba(217,119,6,0.12);color:#b45309;border-color:#d97706;',
    'Digital PDF': 'background:rgba(13,148,136,0.12);color:#0f766e;border-color:#0d9488;',
    'Theology': 'background:rgba(124,58,237,0.12);color:#7c3aed;border-color:#a78bfa;',
    'Christian Living': 'background:rgba(52,211,153,0.12);color:#047857;border-color:#6ee7b7;',
  };
  return colors[cat] || 'background:rgba(184,134,11,0.12);color:var(--accent);border-color:var(--accent-light);';
}

// Render Library page
function renderLibraryPage() {
  const hasActiveFilters = activeLibraryFilters.size > 0;

  return `
    <div class="page library-page">
      <h1 class="page-title">Friends Library</h1>

      <!-- Tab Buttons -->
      <div class="btn-group">
        <button class="btn ${currentLibraryTab === 'books' ? 'btn-primary' : 'btn-outline'}" data-libtab="books">📚 Books</button>
        <button class="btn ${currentLibraryTab === 'checkouts' ? 'btn-primary' : 'btn-outline'}" data-libtab="checkouts">📤 Checked Out</button>
      </div>

      <!-- Books Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'books' ? 'active' : ''}" data-libtab="books">

        <!-- Search Bar -->
        <div class="library-search-bar">
          <input type="text" id="librarySearch" placeholder="Search books or authors..." value="${escapeHtml(librarySearchQuery)}">
        </div>

        <!-- Filter Toggle Button -->
        <button class="btn btn-outline" id="libraryFilterToggle" style="margin-bottom:12px;font-size:12px;padding:8px 16px;min-height:36px;">
          ${libraryFiltersVisible ? '🔼' : '🔽'} Filter${hasActiveFilters ? ' (' + activeLibraryFilters.size + ' active)' : ''}
        </button>

        <!-- Filter Pills (toggle visibility) -->
        <div class="library-pills" id="libraryPills" style="display:${libraryFiltersVisible ? 'flex' : 'none'};flex-wrap:wrap;gap:6px;padding-bottom:4px;margin-bottom:16px;">
          <button class="library-pill ${!hasActiveFilters ? 'active' : ''}" data-filter="all" style="background:var(--accent-glow);color:var(--accent);border-color:var(--accent-light);">All</button>
          ${getUniqueValues('Category').map(cat => `
            <button class="library-pill ${activeLibraryFilters.has('cat:' + cat.toLowerCase()) ? 'active' : ''}" data-filter="cat:${cat.toLowerCase()}" style="${getCategoryColor(cat)}">${escapeHtml(cat)}</button>
          `).join('')}
          ${getUniqueValues('Genre').map(genre => `
            <button class="library-pill ${activeLibraryFilters.has('genre:' + genre.toLowerCase()) ? 'active' : ''}" data-filter="genre:${genre.toLowerCase()}" style="background:rgba(74,122,181,0.10);color:var(--blue);border-color:#93c5fd;">${escapeHtml(genre)}</button>
          `).join('')}
          ${getUniqueValues('Owner').map(owner => `
            <button class="library-pill ${activeLibraryFilters.has('owner:' + owner.toLowerCase()) ? 'active' : ''}" data-filter="owner:${owner.toLowerCase()}" style="background:rgba(184,134,11,0.08);color:var(--accent);border-color:var(--accent-light);">👤 ${escapeHtml(owner)}</button>
          `).join('')}
        </div>

        <!-- Books Grid -->
        <div class="library-books-grid" id="libraryGrid">
          ${renderLibraryBooks()}
        </div>

        ${libraryBooks.length === 0 ? `
          <div class="empty-state card">
            <p>Loading library...</p>
          </div>
        ` : ''}
      </div>

      <!-- Checkouts Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'checkouts' ? 'active' : ''}" data-libtab="checkouts">
        <div class="card">
          <h3>Checkout Log</h3>
          <p style="color: var(--muted); margin-top: 8px;">Coming soon - track who has checked out books and when they're due back.</p>
        </div>
      </div>
    </div>
  `;
}

function renderLibraryBooks() {
  const hasFilters = activeLibraryFilters.size > 0;

  // Score each book: matched + search-visible
  const scored = libraryBooks.map((book, idx) => {
    const filterMatch = bookMatchesFilters(book);
    const searchMatch = bookMatchesSearch(book);
    return { book, idx, highlighted: filterMatch && searchMatch, visible: searchMatch };
  });

  // Sort: highlighted first, then original order
  scored.sort((a, b) => {
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;
    return a.idx - b.idx;
  });

  return scored.map(({ book, idx, highlighted, visible }) => {
    if (!visible) return '';
    const dimmed = hasFilters && !highlighted;
    return `
      <div class="library-book-card card ${dimmed ? 'dimmed' : ''}" data-index="${idx}" data-isbn="${book.ISBN || ''}">
        <div style="display:flex;gap:10px;">
          <div style="width:50px;height:72px;border-radius:6px;overflow:hidden;flex-shrink:0;background:var(--surface);display:flex;align-items:center;justify-content:center;">
            ${book['Cover URL'] ? `<img src="${escapeHtml(book['Cover URL'])}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='📖'">` : '<span style="font-size:20px;">📖</span>'}
          </div>
          <div class="book-info-compact" style="flex:1;min-width:0;">
            <h4 class="book-title-compact" title="${escapeHtml(book.Title)}">${escapeHtml(book.Title)}</h4>
            <p class="book-author-compact">${escapeHtml(book.Author)}</p>
            <div class="book-badges">
              <span class="badge badge-${book.Status === 'Available' ? 'green' : 'orange'}" style="font-size:9px;padding:2px 6px;">${book.Status || 'Available'}</span>
              ${book.Genre ? `<span class="badge badge-muted" style="font-size:9px;padding:2px 6px;">${book.Genre}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle a filter (multi-select)
function toggleLibraryFilter(filter) {
  if (filter === 'all') {
    activeLibraryFilters.clear();
  } else {
    if (activeLibraryFilters.has(filter)) {
      activeLibraryFilters.delete(filter);
    } else {
      activeLibraryFilters.add(filter);
    }
  }
  applyLibraryFilters();
}

// Apply filters without full re-render (just update grid + pill states)
function applyLibraryFilters() {
  const grid = document.getElementById('libraryGrid');
  if (grid) {
    grid.innerHTML = renderLibraryBooks();
  }

  // Update pill active states
  const hasActiveFilters = activeLibraryFilters.size > 0;
  document.querySelectorAll('.library-pill').forEach(pill => {
    const f = pill.dataset.filter;
    if (f === 'all') {
      pill.classList.toggle('active', !hasActiveFilters);
    } else {
      pill.classList.toggle('active', activeLibraryFilters.has(f));
    }
  });

  // Update toggle button text
  const toggle = document.getElementById('libraryFilterToggle');
  if (toggle) {
    toggle.textContent = `${libraryFiltersVisible ? '🔼' : '🔽'} Filter${hasActiveFilters ? ' (' + activeLibraryFilters.size + ' active)' : ''}`;
  }
}

// Initialize Library page
function initLibraryPage() {
  if (libraryBooks.length === 0) {
    fetchLibraryData().then(() => {
      // Re-render full page now that we have data (pills need book categories)
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
    return; // Don't attach listeners until data loads
  }

  // Tab switching
  document.querySelectorAll('button[data-libtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLibraryTab = btn.dataset.libtab;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  });

  // Filter toggle (expand/collapse)
  const filterToggle = document.getElementById('libraryFilterToggle');
  const filterPills = document.getElementById('libraryPills');
  if (filterToggle && filterPills) {
    filterToggle.addEventListener('click', () => {
      libraryFiltersVisible = !libraryFiltersVisible;
      filterPills.style.display = libraryFiltersVisible ? 'flex' : 'none';
      const hasActive = activeLibraryFilters.size > 0;
      filterToggle.textContent = `${libraryFiltersVisible ? '🔼' : '🔽'} Filter${hasActive ? ' (' + activeLibraryFilters.size + ' active)' : ''}`;
    });
  }

  // Search
  const searchInput = document.getElementById('librarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      librarySearchQuery = e.target.value;
      applyLibraryFilters();
    });
    // Restore focus position
    if (librarySearchQuery) {
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  // Pill filter clicks (multi-select toggle)
  document.querySelectorAll('.library-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      toggleLibraryFilter(pill.dataset.filter);
    });
  });
}
