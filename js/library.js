/* ====================================
   FRIENDS LIBRARY PAGE
   Fetches from Google Sheets CSV
   ==================================== */

const LIBRARY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1tarzoeTPmF7At2B5a0yJJ9NzcrjtnTuXUgr-71xVHfk/gviz/tq?tqx=out:csv';

let libraryBooks = [];
let libraryCheckouts = [];
let libraryFilters = {
  search: '',
  category: 'all',
  genre: 'all',
  owner: 'all',
  status: 'all'
};
let currentLibraryTab = 'books';

// Fetch library data
async function fetchLibraryData() {
  try {
    const response = await fetch(LIBRARY_SHEET_URL);
    const csvText = await response.text();
    parseLibraryCSV(csvText);
  } catch (error) {
    console.error('Error fetching library data:', error);
    // Use mock data as fallback
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

    // Only add if it has a title
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
    {
      Title: "Mere Christianity",
      Author: "C.S. Lewis",
      Category: "Christian Living",
      Genre: "Apologetics",
      Status: "Available",
      Owner: "Church",
      ISBN: "9780060652920"
    },
    {
      Title: "The Cost of Discipleship",
      Author: "Dietrich Bonhoeffer",
      Category: "Christian Living",
      Genre: "Discipleship",
      Status: "Available",
      Owner: "Church",
      ISBN: "9780684815008"
    },
    {
      Title: "Desiring God",
      Author: "John Piper",
      Category: "Theology",
      Genre: "Christian Hedonism",
      Status: "Checked Out",
      Owner: "Church",
      ISBN: "9781601423917"
    },
    {
      Title: "Knowing God",
      Author: "J.I. Packer",
      Category: "Theology",
      Genre: "Doctrine",
      Status: "Available",
      Owner: "Will",
      ISBN: "9780830816507"
    }
  ];
}

// Filter books
function getFilteredBooks() {
  return libraryBooks.filter(book => {
    // Search
    if (libraryFilters.search) {
      const search = libraryFilters.search.toLowerCase();
      const title = (book.Title || '').toLowerCase();
      const author = (book.Author || '').toLowerCase();
      if (!title.includes(search) && !author.includes(search)) {
        return false;
      }
    }

    // Category
    if (libraryFilters.category !== 'all' && book.Category !== libraryFilters.category) {
      return false;
    }

    // Genre
    if (libraryFilters.genre !== 'all' && book.Genre !== libraryFilters.genre) {
      return false;
    }

    // Owner
    if (libraryFilters.owner !== 'all' && book.Owner !== libraryFilters.owner) {
      return false;
    }

    // Status
    if (libraryFilters.status !== 'all' && book.Status !== libraryFilters.status) {
      return false;
    }

    return true;
  });
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

// Get category color
function getCategoryColor(cat) {
  const colors = {
    'Religious': 'background:rgba(167,139,250,0.12);color:#7c3aed;border-color:#c4b5fd;',
    'Thinking': 'background:rgba(96,165,250,0.12);color:#2563eb;border-color:#93c5fd;',
    'Fiction': 'background:rgba(249,115,22,0.12);color:#c2410c;border-color:#fdba74;',
    'Reference': 'background:rgba(20,184,166,0.12);color:#0f766e;border-color:#5eead4;',
    'Kids': 'background:rgba(217,119,6,0.12);color:#b45309;border-color:#d97706;',
    'Digital PDF': 'background:rgba(13,148,136,0.12);color:#0f766e;border-color:#0d9488;'
  };
  return colors[cat] || 'background:rgba(184,134,11,0.12);color:var(--accent);border-color:var(--accent-light);';
}

// Render Library page
function renderLibraryPage() {
  return `
    <div class="page library-page">
      <h1 class="page-title">Friends Library</h1>

      <!-- Tab Buttons -->
      <div class="btn-group">
        <button class="btn ${currentLibraryTab === 'books' ? 'btn-primary' : 'btn-outline'}" data-tab="books">📚 Books</button>
        <button class="btn ${currentLibraryTab === 'checkouts' ? 'btn-primary' : 'btn-outline'}" data-tab="checkouts">📤 Checked Out</button>
      </div>

      <!-- Books Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'books' ? 'active' : ''}" data-tab="books">

        <!-- Search Bar -->
        <div class="library-search-bar">
          <input type="text" id="librarySearch" placeholder="Search books or authors..." value="${libraryFilters.search}">
        </div>

        <!-- Category Pills -->
        <div class="library-pills" id="libraryPills" style="display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;margin-bottom:16px;">
          <button class="library-pill ${libraryFilters.category === 'all' && libraryFilters.genre === 'all' && libraryFilters.owner === 'all' ? 'active' : ''}" data-filter-type="all" data-filter-value="all" style="background:var(--accent-glow);color:var(--accent);border-color:var(--accent-light);">All</button>
          ${getUniqueValues('Category').map(cat => `
            <button class="library-pill ${libraryFilters.category === cat ? 'active' : ''}" data-filter-type="category" data-filter-value="${cat}" style="${getCategoryColor(cat)}">${cat}</button>
          `).join('')}
          ${getUniqueValues('Genre').map(genre => `
            <button class="library-pill ${libraryFilters.genre === genre ? 'active' : ''}" data-filter-type="genre" data-filter-value="${genre}" style="background:rgba(74,122,181,0.10);color:var(--blue);border-color:#93c5fd;">${genre}</button>
          `).join('')}
        </div>

        <!-- Books Grid (half-size cards) -->
        <div class="library-books-grid">
          ${getFilteredBooks().map(book => `
            <div class="library-book-card card" data-isbn="${book.ISBN || ''}">
              <div class="book-info-compact">
                <h4 class="book-title-compact" title="${escapeHtml(book.Title)}">${escapeHtml(book.Title)}</h4>
                <p class="book-author-compact">${escapeHtml(book.Author)}</p>
                <div class="book-badges">
                  <span class="badge badge-${book.Status === 'Available' ? 'green' : 'orange'}" style="font-size:9px;padding:2px 6px;">${book.Status}</span>
                  ${book.Genre ? `<span class="badge badge-muted" style="font-size:9px;padding:2px 6px;">${book.Genre}</span>` : ''}
                  ${book.Owner ? `<span class="badge badge-muted" style="font-size:9px;padding:2px 6px;">${book.Owner}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${getFilteredBooks().length === 0 ? `
          <div class="empty-state card">
            <p>No books found matching your filters.</p>
          </div>
        ` : ''}
      </div>

      <!-- Checkouts Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'checkouts' ? 'active' : ''}" data-tab="checkouts">
        <div class="card">
          <h3>Checkout Log</h3>
          <p style="color: var(--muted); margin-top: 8px;">Coming soon - track who has checked out books and when they're due back.</p>
        </div>
      </div>
    </div>
  `;
}

// Initialize Library page
function initLibraryPage() {
  // Fetch data if not already loaded
  if (libraryBooks.length === 0) {
    fetchLibraryData().then(() => {
      renderLibraryPageContent();
    });
  }

  renderLibraryPageContent();
}

function renderLibraryPageContent() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLibraryTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  });

  // Search
  const searchInput = document.getElementById('librarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      libraryFilters.search = e.target.value;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  }

  // Pill filters
  document.querySelectorAll('.library-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const filterType = e.target.dataset.filterType;
      const filterValue = e.target.dataset.filterValue;

      if (filterType === 'all') {
        libraryFilters.category = 'all';
        libraryFilters.genre = 'all';
        libraryFilters.owner = 'all';
        libraryFilters.status = 'all';
      } else if (filterType === 'category') {
        libraryFilters.category = filterValue;
        libraryFilters.genre = 'all';
        libraryFilters.owner = 'all';
      } else if (filterType === 'genre') {
        libraryFilters.genre = filterValue;
        libraryFilters.category = 'all';
        libraryFilters.owner = 'all';
      }

      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  });

  // Book card clicks (future: expand to show details)
  document.querySelectorAll('.library-book-card').forEach(card => {
    card.addEventListener('click', () => {
      // Future: show modal with full book details
      console.log('Book clicked:', card.dataset.isbn);
    });
  });
}
