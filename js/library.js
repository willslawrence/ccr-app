/* ====================================
   FRIENDS LIBRARY PAGE
   Fetches from Google Sheets CSV
   ==================================== */

const LIBRARY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1tarzoeTPmF7At2B5a0yJJ9NzcrjtnTuXUgr-71xVHfk/export?format=csv';

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

// Render Library page
function renderLibraryPage() {
  return `
    <div class="page library-page">
      <h1 class="page-title">Friends Library</h1>

      <!-- Tab Buttons -->
      <div class="tab-buttons">
        <button class="tab-btn ${currentLibraryTab === 'books' ? 'active' : ''}" data-tab="books">📚 Books</button>
        <button class="tab-btn ${currentLibraryTab === 'checkouts' ? 'active' : ''}" data-tab="checkouts">📤 Checked Out</button>
      </div>

      <!-- Books Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'books' ? 'active' : ''}" data-tab="books">

        <!-- Search Bar -->
        <div class="library-search-bar">
          <input type="text" id="librarySearch" placeholder="Search books or authors..." value="${libraryFilters.search}">
        </div>

        <!-- Filter Button -->
        <button class="btn-outline" id="toggleFilters">
          <span>🔍 Filters</span>
        </button>

        <!-- Filter Area (collapsible) -->
        <div class="library-filters" id="libraryFilters" style="display: none;">
          <div class="filter-row">
            <label>
              Category
              <select id="filterCategory">
                <option value="all">All Categories</option>
                ${getUniqueValues('Category').map(cat => `
                  <option value="${cat}" ${libraryFilters.category === cat ? 'selected' : ''}>${cat}</option>
                `).join('')}
              </select>
            </label>
            <label>
              Genre
              <select id="filterGenre">
                <option value="all">All Genres</option>
                ${getUniqueValues('Genre').map(genre => `
                  <option value="${genre}" ${libraryFilters.genre === genre ? 'selected' : ''}>${genre}</option>
                `).join('')}
              </select>
            </label>
          </div>
          <div class="filter-row">
            <label>
              Owner
              <select id="filterOwner">
                <option value="all">All Owners</option>
                ${getUniqueValues('Owner').map(owner => `
                  <option value="${owner}" ${libraryFilters.owner === owner ? 'selected' : ''}>${owner}</option>
                `).join('')}
              </select>
            </label>
            <label>
              Status
              <select id="filterStatus">
                <option value="all">All</option>
                ${getUniqueValues('Status').map(status => `
                  <option value="${status}" ${libraryFilters.status === status ? 'selected' : ''}>${status}</option>
                `).join('')}
              </select>
            </label>
          </div>
        </div>

        <!-- Books Grid (half-size cards) -->
        <div class="library-books-grid">
          ${getFilteredBooks().map(book => `
            <div class="library-book-card card" data-isbn="${book.ISBN || ''}">
              <div class="book-cover-small">
                <div class="book-cover-placeholder">📖</div>
              </div>
              <div class="book-info-compact">
                <h4 class="book-title-compact" title="${escapeHtml(book.Title)}">${escapeHtml(book.Title)}</h4>
                <p class="book-author-compact">${escapeHtml(book.Author)}</p>
                <div class="book-badges">
                  <span class="badge badge-${book.Status === 'Available' ? 'green' : 'orange'}">${book.Status}</span>
                  <span class="badge badge-muted">${book.Genre}</span>
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

  // Toggle filters
  const toggleFiltersBtn = document.getElementById('toggleFilters');
  const filtersDiv = document.getElementById('libraryFilters');
  if (toggleFiltersBtn && filtersDiv) {
    toggleFiltersBtn.addEventListener('click', () => {
      const isVisible = filtersDiv.style.display === 'block';
      filtersDiv.style.display = isVisible ? 'none' : 'block';
    });
  }

  // Filter dropdowns
  const filterCategory = document.getElementById('filterCategory');
  const filterGenre = document.getElementById('filterGenre');
  const filterOwner = document.getElementById('filterOwner');
  const filterStatus = document.getElementById('filterStatus');

  if (filterCategory) {
    filterCategory.addEventListener('change', (e) => {
      libraryFilters.category = e.target.value;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  }

  if (filterGenre) {
    filterGenre.addEventListener('change', (e) => {
      libraryFilters.genre = e.target.value;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  }

  if (filterOwner) {
    filterOwner.addEventListener('change', (e) => {
      libraryFilters.owner = e.target.value;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      libraryFilters.status = e.target.value;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  }

  // Book card clicks (future: expand to show details)
  document.querySelectorAll('.library-book-card').forEach(card => {
    card.addEventListener('click', () => {
      // Future: show modal with full book details
      console.log('Book clicked:', card.dataset.isbn);
    });
  });
}
