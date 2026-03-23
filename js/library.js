/* ====================================
   FRIENDS LIBRARY PAGE
   Fetches from Google Sheets CSV
   ==================================== */

// Migrated from Google Sheets to Firebase Firestore

// Apps Script web app for sending checkout notification emails
const CHECKOUT_EMAIL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPC9OEAOmQSI2ZW1CH_hnELwxJAMFob3Dwb9JYKCGbBDL-4uHYYx_Xdagh5P--ZYgO/exec';

async function sendCheckoutEmail(ownerEmail, ownerName, borrowerName, bookTitle, dueBack, action = 'checkout') {
  if (!CHECKOUT_EMAIL_SCRIPT_URL) {
    console.warn('No email script URL configured');
    return;
  }
  
  try {
    const resp = await fetch(CHECKOUT_EMAIL_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ ownerEmail, ownerName, borrowerName, bookTitle, dueBack, action })
    });
    // Apps Script redirects, so we may get an opaque response with no-cors
    console.log(`📧 Email notification sent (${action}) to ${ownerEmail} for "${bookTitle}"`);
  } catch (error) {
    console.warn('Email send failed (non-critical):', error);
    // Non-blocking — don't throw, checkout still succeeds
  }
}

let libraryBooks = [];
let libraryCheckouts = [];
let activeLibraryFilters = new Set();
let librarySearchQuery = '';
let libraryFiltersVisible = false;
let currentLibraryTab = 'books';

// ─── CHECKOUT LOG STORAGE (FIREBASE) ───
let libraryCheckoutLogs = []; // Cache for checkout logs

async function getCheckoutLogs() {
  try {
    if (typeof db !== 'undefined') {
      const snapshot = await db.collection('checkouts').orderBy('startDate', 'desc').get();
      const logs = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      libraryCheckoutLogs = logs;
      return logs;
    } else {
      // Fallback to localStorage if Firebase not available
      try {
        const stored = JSON.parse(localStorage.getItem('ccr_checkout_logs') || '[]');
        libraryCheckoutLogs = stored;
        return stored;
      } catch (e) { return []; }
    }
  } catch (error) {
    console.error('Error getting checkout logs:', error);
    return libraryCheckoutLogs; // Return cached version
  }
}

function saveCheckoutLogs(logs) {
  // Keep localStorage as backup
  localStorage.setItem('ccr_checkout_logs', JSON.stringify(logs));
}

async function addCheckoutLog(entry) {
  try {
    if (typeof db !== 'undefined') {
      const docRef = await db.collection('checkouts').add({
        ...entry,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      entry.id = docRef.id;
      
      // Also queue email notification
      await queueCheckoutEmail(entry);
      
      // Update local cache
      libraryCheckoutLogs.unshift(entry);
      saveCheckoutLogs(libraryCheckoutLogs); // Backup to localStorage
      
      return entry;
    } else {
      // Fallback to localStorage
      entry.id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const logs = await getCheckoutLogs();
      logs.push(entry);
      saveCheckoutLogs(logs);
      return entry;
    }
  } catch (error) {
    console.error('Error adding checkout log:', error);
    // Fallback to localStorage
    entry.id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const logs = await getCheckoutLogs();
    logs.push(entry);
    saveCheckoutLogs(logs);
    return entry;
  }
}

async function updateCheckoutLog(id, updates) {
  try {
    if (typeof db !== 'undefined') {
      await db.collection('checkouts').doc(id).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local cache
      const idx = libraryCheckoutLogs.findIndex(l => l.id === id);
      if (idx >= 0) {
        Object.assign(libraryCheckoutLogs[idx], updates);
        saveCheckoutLogs(libraryCheckoutLogs);
      }
    } else {
      // Fallback to localStorage  
      const logs = await getCheckoutLogs();
      const idx = logs.findIndex(l => l.id === id);
      if (idx >= 0) {
        Object.assign(logs[idx], updates);
        saveCheckoutLogs(logs);
      }
    }
  } catch (error) {
    console.error('Error updating checkout log:', error);
    // Try localStorage fallback
    const logs = await getCheckoutLogs();
    const idx = logs.findIndex(l => l.id === id);
    if (idx >= 0) {
      Object.assign(logs[idx], updates);
      saveCheckoutLogs(logs);
    }
  }
}

async function queueCheckoutEmail(checkoutEntry) {
  try {
    const book = libraryBooks.find(b => b.title === checkoutEntry.book);
    if (!book || !book.ownerEmail) {
      console.log('No owner email found for book:', checkoutEntry.book);
      return;
    }

    const emailData = {
      to: book.ownerEmail,
      subject: `📚 Book Checkout: ${checkoutEntry.book}`,
      body: `Hi ${book.owner || 'there'},

${checkoutEntry.name} has checked out your book "${checkoutEntry.book}" from the CCR Library.

Due back: ${checkoutEntry.dueBack || 'Not specified'}

Please coordinate with ${checkoutEntry.name} to arrange pickup.

Thanks!
CCR Church App`,
      bookTitle: checkoutEntry.book,
      borrowerName: checkoutEntry.name,
      ownerName: book.owner || '',
      dueBack: checkoutEntry.dueBack || '',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (typeof db !== 'undefined') {
      await db.collection('emailQueue').add(emailData);
      console.log('Email queued successfully');
    }
  } catch (error) {
    console.error('Error queueing email:', error);
  }
}

function getCheckoutsForBook(bookTitle) {
  return libraryCheckoutLogs.filter(l => l.book === bookTitle);
}

function getActiveCheckoutForBook(bookTitle) {
  return libraryCheckoutLogs.find(l => l.book === bookTitle && (l.status === 'reading' || l.status === 'requested'));
}

// ─── FETCH & PARSE ───

async function fetchLibraryData() {
  try {
    if (typeof db !== 'undefined') {
      console.log('Fetching library data from Firestore...');
      const snapshot = await db.collection('books').get();
      libraryBooks = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Map Firestore fields to expected format
        libraryBooks.push({
          Title: data.title || '',
          Author: data.author || '',
          CoverURL: data.coverUrl || '',
          Summary: data.summary || '',
          Rating: data.rating || 0,
          'Goodreads Rating': data.rating || 0,
          Genre: data.genre || '',
          Pages: data.pages || 0,
          'Total Pages': data.pages || 0,
          Category: data.category || '',
          Owner: data.owner || '',
          OwnerEmail: data.ownerEmail || '',
          'Owner Email': data.ownerEmail || '',
          OwnerFav: data.ownerFav || false,
          'Owner Fav': data.ownerFav || false,
          Status: 'Available' // Will be determined by checkout logs
        });
      });
      console.log(`Loaded ${libraryBooks.length} books from Firestore`);
    } else {
      console.warn('Firebase not available, using mock data');
      loadMockLibraryData();
    }
  } catch (error) {
    console.error('Error fetching library data:', error);
    loadMockLibraryData();
  }
}

// Auto-fetch missing covers from Google Books API (editor+ only, runs once per session)
let _coverFetchDone = false;

// Check if an image URL actually returns a valid cover (not a placeholder)
async function isValidCoverUrl(url) {
  if (!url || !url.trim()) return false;
  try {
    const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    // no-cors won't give us status, but at least checks reachability
    return true;
  } catch (e) { return false; }
}

// Check if a Google Books cover URL is likely a placeholder
// Uses <img> loading only (no fetch — Google Books blocks CORS)
async function isGoogleBooksPlaceholder(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Placeholders are typically very small (1x1 or tiny solid color images)
      resolve(img.naturalWidth < 10 || img.naturalHeight < 10);
    };
    img.onerror = () => resolve(true); // Can't load = treat as placeholder
    img.src = url;
  });
}

// Check if a Google Books result title roughly matches expected
function titleMatches(resultTitle, expectedTitle) {
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const result = normalize(resultTitle);
  const expected = normalize(expectedTitle);
  // Check if significant words overlap
  const expectedWords = expected.split(/\s+/).filter(w => w.length > 2);
  if (expectedWords.length === 0) return true;
  const matchCount = expectedWords.filter(w => result.includes(w)).length;
  return matchCount >= Math.ceil(expectedWords.length * 0.4);
}

// Try Google Books API for a cover (with title verification)
async function fetchGoogleBooksCover(title, author) {
  const queries = [
    `intitle:"${title}" inauthor:"${(author || '').split(/[,&(]/)[0].trim()}"`,
    `${title} ${(author || '').split(/[,&(]/)[0].trim()}`,
  ];
  for (const q of queries) {
    try {
      const resp = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`);
      const data = await resp.json();
      if (!data.items) continue;
      for (const item of data.items) {
        // Verify this result is actually for the right book
        const resultTitle = item.volumeInfo?.title || '';
        if (!titleMatches(resultTitle, title)) continue;

        const images = item.volumeInfo?.imageLinks;
        let coverUrl = images?.thumbnail || images?.smallThumbnail || '';
        if (!coverUrl) continue;

        // Upgrade http to https and remove edge=curl for cleaner images
        coverUrl = coverUrl.replace(/^http:/, 'https:').replace('&edge=curl', '');

        // Verify it's not a placeholder image
        const placeholder = await isGoogleBooksPlaceholder(coverUrl);
        if (placeholder) {
          console.log(`  Skipping placeholder for "${resultTitle}"`);
          continue;
        }

        return coverUrl;
      }
    } catch (e) { console.warn('Google Books API failed:', e); }
  }
  return null;
}

// Try Open Library for a cover (by title + author search)
async function fetchOpenLibraryCover(title, author, isbn) {
  try {
    // Try ISBN first if available
    if (isbn) {
      const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) return url;
    }
    // Search by title
    const q = encodeURIComponent(title);
    const resp = await fetch(`https://openlibrary.org/search.json?title=${q}&limit=1`);
    const data = await resp.json();
    if (data.docs && data.docs.length > 0) {
      const coverId = data.docs[0].cover_i;
      if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
      // Try ISBN from OL result
      const olIsbn = data.docs[0].isbn?.[0];
      if (olIsbn) return `https://covers.openlibrary.org/b/isbn/${olIsbn}-M.jpg`;
    }
  } catch (e) { console.warn('Open Library API failed:', e); }
  return null;
}

async function autoFetchMissingCovers() {
  if (_coverFetchDone || !isEditor()) return;
  _coverFetchDone = true;

  try {
    const snapshot = await db.collection('books').get();
    const needsCover = [];
    
    // Phase 1: Quick checks for obviously broken covers
    const toVerify = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const cover = data.coverUrl || '';
      // Obviously broken
      const isBroken = !cover.trim() || 
        cover.includes('no_cover') ||
        cover.startsWith('http://') ||  // Mixed content (blocked on HTTPS)
        (cover.includes('books.google') && cover.includes('img=0')); // Sometimes a placeholder
      if (isBroken) {
        needsCover.push({ id: doc.id, title: data.title, author: data.author, isbn: data.isbn || '', currentUrl: cover });
      } else if (cover.includes('books.google.com')) {
        // Google Books covers need deeper validation (might be placeholder or wrong book)
        toVerify.push({ id: doc.id, title: data.title, author: data.author, isbn: data.isbn || '', currentUrl: cover });
      }
    });

    // Phase 2: Verify Google Books covers aren't placeholders or wrong books
    // Do this in batches to avoid overwhelming the browser
    console.log(`Quick-broken: ${needsCover.length}, Google covers to verify: ${toVerify.length}`);
    for (const book of toVerify) {
      try {
        const isPlaceholder = await isGoogleBooksPlaceholder(book.currentUrl);
        if (isPlaceholder) {
          console.log(`🔍 Placeholder detected for "${book.title}"`);
          needsCover.push(book);
          continue;
        }
        // Check if the Google Books ID matches the actual book
        const idMatch = book.currentUrl.match(/id=([^&]+)/);
        if (idMatch) {
          const gbResp = await fetch(`https://www.googleapis.com/books/v1/volumes/${idMatch[1]}`);
          const gbData = await gbResp.json();
          const gbTitle = gbData.volumeInfo?.title || '';
          if (!titleMatches(gbTitle, book.title)) {
            console.log(`🔍 Wrong book cover for "${book.title}" (shows "${gbTitle}")`);
            needsCover.push(book);
          }
        }
      } catch (e) {
        console.warn(`Verify failed for "${book.title}":`, e);
      }
      await new Promise(r => setTimeout(r, 150));
    }

    if (needsCover.length === 0) {
      console.log('All book covers look good!');
      return;
    }
    console.log(`Fixing covers for ${needsCover.length} books...`);
    let fixed = 0;

    for (const book of needsCover) {
      // Try Google Books first (with title verification + placeholder check)
      let coverUrl = await fetchGoogleBooksCover(book.title, book.author);
      
      // If Google didn't work, try Open Library
      if (!coverUrl) {
        coverUrl = await fetchOpenLibraryCover(book.title, book.author, book.isbn);
      }

      if (coverUrl && coverUrl !== book.currentUrl) {
        await db.collection('books').doc(book.id).update({ coverUrl });
        console.log(`✅ Cover fixed for "${book.title}": ${coverUrl}`);
        const local = libraryBooks.find(b => b.Title === book.title);
        if (local) local.CoverURL = coverUrl;
        fixed++;
      } else if (!coverUrl) {
        console.log(`⚠️ No cover found for "${book.title}"`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`Cover fix complete: ${fixed}/${needsCover.length} updated`);

    // Re-render if any covers were updated
    if (fixed > 0 && AppState.currentPage === 'library') {
      const grid = document.getElementById('libraryGrid');
      if (grid) {
        grid.innerHTML = renderLibraryBooks();
        attachBookCardListeners();
      }
    }
  } catch (e) {
    console.warn('Auto-fetch covers failed:', e);
  }
}

// CSV parsing functions removed - now using Firestore

function loadMockLibraryData() {
  libraryBooks = [
    { Title: "Mere Christianity", Author: "C.S. Lewis", Category: "Religious", Genre: "Apologetics", Status: "Available", Owner: "Church", ISBN: "9780060652920", Pages: "227", Summary: "A classic work of Christian apologetics." },
    { Title: "The Cost of Discipleship", Author: "Dietrich Bonhoeffer", Category: "Religious", Genre: "Discipleship", Status: "Available", Owner: "Church", ISBN: "9780684815008", Pages: "316", Summary: "" },
    { Title: "Desiring God", Author: "John Piper", Category: "Theology", Genre: "Christian Hedonism", Status: "Checked Out", Owner: "Church", ISBN: "9781601423917", Pages: "368", Summary: "" },
    { Title: "Knowing God", Author: "J.I. Packer", Category: "Theology", Genre: "Doctrine", Status: "Available", Owner: "Will", ISBN: "9780830816507", Pages: "286", Summary: "" }
  ];
}

// ─── HELPERS ───

function isOwnerFav(book) {
  const val = (book.OwnerFav || book['Owner Fav'] || '').toString().toUpperCase();
  return val === 'TRUE' || val === 'YES' || val === '1';
}

function renderStarRating(book) {
  const rating = parseFloat(book['Goodreads Rating'] || book.Rating || 0);
  if (!rating) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  let s = '★'.repeat(full);
  if (half) s += '½';
  return `<span class="lib-stars">${s}</span> <span style="color:var(--muted);font-size:10px;">${rating.toFixed(1)}</span>`;
}

function getUniqueValues(field) {
  const values = new Set();
  libraryBooks.forEach(book => {
    if (book[field] && book[field] !== '') {
      values.add(book[field]);
    }
  });
  return Array.from(values).sort();
}

function bookMatchesFilters(book) {
  if (activeLibraryFilters.size === 0) return true;
  for (const filter of activeLibraryFilters) {
    const [type, ...rest] = filter.split(':');
    const val = rest.join(':');
    if (type === 'cat' && (book.Category || '').toLowerCase() === val) return true;
    if (type === 'genre' && (book.Genre || '').toLowerCase() === val) return true;
    if (type === 'owner' && (book.Owner || '').toLowerCase() === val) return true;
    if (type === 'status' && (book.Status || '').toLowerCase() === val) return true;
    if (filter === 'fav' && isOwnerFav(book)) return true;
  }
  return false;
}

function bookMatchesSearch(book) {
  if (!librarySearchQuery) return true;
  const q = librarySearchQuery.toLowerCase();
  return (book.Title || '').toLowerCase().includes(q) ||
         (book.Author || '').toLowerCase().includes(q) ||
         (book.Genre || '').toLowerCase().includes(q);
}

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

function getBookStatusFromLogs(book) {
  // Check localStorage logs first, then fall back to sheet Status field
  const active = getActiveCheckoutForBook(book.Title);
  if (active) return active.status === 'requested' ? 'Requested' : 'Checked Out';
  return book.Status || 'Available';
}

function renderBookCover(book, size) {
  const w = size === 'large' ? 120 : 60;
  const h = size === 'large' ? 175 : 88;
  const radius = size === 'large' ? 12 : 8;
  const fontSize = size === 'large' ? 48 : 24;
  let coverUrl = book.CoverURL || book['Cover URL'] || '';
  // Fix http:// URLs (mixed content blocked on HTTPS pages)
  if (coverUrl.startsWith('http://')) coverUrl = coverUrl.replace('http://', 'https://');
  const fallback = `<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;background:var(--gold-grad);color:white;font-weight:700;border-radius:${radius}px;\\'>${escapeHtml(book.Title)[0] || '?'}</div>`;
  if (coverUrl) {
    // onload: check if image is too small (likely a placeholder)
    return `<img src="${escapeHtml(coverUrl)}" style="width:100%;height:100%;object-fit:cover;" 
      onerror="this.parentElement.innerHTML='${fallback}'"
      onload="if(this.naturalWidth<10||this.naturalHeight<10)this.parentElement.innerHTML='${fallback}'">`;
  }
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;background:var(--gold-grad);color:white;font-weight:700;border-radius:${radius}px;">${escapeHtml(book.Title)[0] || '?'}</div>`;
}

// ─── RENDER PAGE ───

function renderLibraryPage() {
  const hasActiveFilters = activeLibraryFilters.size > 0;
  const isLoading = libraryBooks.length === 0;
  
  // Calculate counts for tab buttons
  const booksCount = libraryBooks.length > 0 ? libraryBooks.length : 0;
  const checkoutsCount = libraryCheckoutLogs.filter(l => l.status === 'reading' || l.status === 'requested').length;
  
  // Tab labels with counts
  const booksLabel = booksCount > 0 ? `📚 Books (${booksCount})` : '📚 Books';
  const checkoutsLabel = checkoutsCount > 0 ? `📋 Checked Out (${checkoutsCount})` : '📋 Checked Out';

  return `
    <div class="page library-page">
      <div class="page-sticky-banner">
        <h1 class="page-title">Friends Library</h1>

        <!-- Tab Buttons -->
        <div class="btn-group" style="margin-bottom:8px;">
          <button class="btn ${currentLibraryTab === 'books' ? 'btn-primary' : 'btn-outline'}" data-libtab="books">${booksLabel}</button>
          <button class="btn ${currentLibraryTab === 'checkouts' ? 'btn-primary' : 'btn-outline'}" data-libtab="checkouts">${checkoutsLabel}</button>
        </div>

        <!-- Search -->
        <div class="library-search-bar" style="margin-bottom:0;">
          <input type="text" id="librarySearch" placeholder="Search books or authors..." value="${escapeHtml(librarySearchQuery)}" style="padding:8px 12px;font-size:13px;min-height:36px;">
        </div>

      </div><!-- end page-sticky-banner -->

      <!-- Books Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'books' ? 'active' : ''}" data-libtab="books">

        ${isLoading ? `
          <div class="empty-state card">
            <p>📚 Loading library...</p>
          </div>
        ` : `
        <!-- Always-visible Owner + Fav filters -->
        <div class="library-pills" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
          <button class="library-pill ${!hasActiveFilters ? 'active' : ''}" data-filter="all" style="background:var(--accent-glow);color:var(--accent);border-color:var(--accent-light);">All</button>
          ${getUniqueValues('Owner').map(owner => `
            <button class="library-pill ${activeLibraryFilters.has('owner:' + owner.toLowerCase()) ? 'active' : ''}" data-filter="owner:${owner.toLowerCase()}" style="background:rgba(184,134,11,0.08);color:var(--accent);border-color:var(--accent-light);">👤 ${escapeHtml(owner)}</button>
          `).join('')}
          <button class="library-pill ${activeLibraryFilters.has('fav') ? 'active' : ''}" data-filter="fav" style="background:linear-gradient(135deg,rgba(212,168,75,0.18),rgba(184,134,11,0.10));border-color:var(--accent);color:var(--accent);">⭐ Owner Fav</button>
          <button class="library-pill" id="libraryFilterToggle" style="background:var(--surface);color:var(--muted);border-color:var(--border);">
            🔽 More${hasActiveFilters && (activeLibraryFilters.size - [...activeLibraryFilters].filter(f => f.startsWith('owner:') || f === 'fav').length) > 0 ? ' (' + (activeLibraryFilters.size - [...activeLibraryFilters].filter(f => f.startsWith('owner:') || f === 'fav').length) + ')' : ''}
          </button>
        </div>

        <!-- Expandable Category + Genre filters -->
        <div class="library-pills" id="libraryPills" style="display:${libraryFiltersVisible ? 'flex' : 'none'};flex-wrap:wrap;gap:6px;margin-bottom:8px;">
          ${getUniqueValues('Category').map(cat => `
            <button class="library-pill ${activeLibraryFilters.has('cat:' + cat.toLowerCase()) ? 'active' : ''}" data-filter="cat:${cat.toLowerCase()}" style="${getCategoryColor(cat)}">${escapeHtml(cat)}</button>
          `).join('')}
          ${getUniqueValues('Genre').map(genre => `
            <button class="library-pill ${activeLibraryFilters.has('genre:' + genre.toLowerCase()) ? 'active' : ''}" data-filter="genre:${genre.toLowerCase()}" style="background:rgba(74,122,181,0.10);color:var(--blue);border-color:#93c5fd;">${escapeHtml(genre)}</button>
          `).join('')}
        </div>

        <!-- Books Grid -->
        <div class="library-books-grid" id="libraryGrid">
          ${renderLibraryBooks()}
        </div>
        `}
      </div>

      <!-- Checkouts Tab -->
      <div class="library-tab-content ${currentLibraryTab === 'checkouts' ? 'active' : ''}" data-libtab="checkouts">
        ${renderCheckoutLogs()}
      </div>
    </div>
  `;
}

// ─── RENDER BOOK CARDS ───

function renderLibraryBooks() {
  const hasFilters = activeLibraryFilters.size > 0;

  const scored = libraryBooks.map((book, idx) => {
    const filterMatch = bookMatchesFilters(book);
    const searchMatch = bookMatchesSearch(book);
    return { book, idx, highlighted: filterMatch && searchMatch, visible: searchMatch };
  });

  scored.sort((a, b) => {
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;
    return a.idx - b.idx;
  });

  return scored.map(({ book, idx, highlighted, visible }) => {
    if (!visible) return '';
    const dimmed = hasFilters && !highlighted;
    const status = getBookStatusFromLogs(book);
    const statusClass = status === 'Available' ? 'green' : status === 'Requested' ? 'purple' : 'orange';
    const statusLabel = status === 'Available' ? '✅ Available' : status === 'Requested' ? '🔖 Requested' : '📤 Checked Out';
    const pages = book.Pages || book['Total Pages'] || '';

    const isFav = isOwnerFav(book);
    return `
      <div class="library-book-card card ${dimmed ? 'dimmed' : ''} ${isFav ? 'lib-fav-card' : ''}" data-index="${idx}" data-isbn="${escapeHtml(book.ISBN || '')}" style="position:relative;">
        <div class="lib-card-inner">
          <div class="lib-card-cover">
            ${renderBookCover(book, 'small')}
          </div>
          <div class="lib-card-info">
            <h4 class="lib-card-title" title="${escapeHtml(book.Title)}">${escapeHtml(book.Title)}</h4>
            <p class="lib-card-author">by ${escapeHtml(book.Author)}</p>
            ${renderStarRating(book) ? `<div style="margin-bottom:4px;">${renderStarRating(book)}</div>` : ''}
            <div class="lib-card-badges">
              <span class="badge badge-${statusClass}" style="font-size:9px;padding:2px 6px;">${statusLabel}</span>
              ${book.Owner ? `<span class="badge badge-gold" style="font-size:9px;padding:2px 6px;">👤 ${escapeHtml(book.Owner)}</span>` : ''}
            </div>
            <div class="lib-card-badges" style="margin-top:3px;">
              ${book.Genre ? `<span class="badge badge-muted" style="font-size:9px;padding:2px 6px;">${escapeHtml(book.Genre)}</span>` : ''}
              ${pages ? `<span style="font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;">${escapeHtml(pages)}p</span>` : ''}
            </div>
          </div>
        </div>
        ${isFav ? '<span class="lib-fav-badge">⭐ Owner Fav</span>' : ''}
      </div>
    `;
  }).join('');
}

// ─── CHECKOUT LOGS TAB ───

function renderCheckoutLogs() {
  const logs = libraryCheckoutLogs; // Use cached logs
  if (logs.length === 0) {
    return `
      <div class="empty-state card">
        <div class="empty-icon">📋</div>
        <div class="empty-text">No checkouts yet</div>
        <div class="empty-sub">Click on a book and check it out!</div>
      </div>
    `;
  }

  // Split into active and completed
  const active = logs.filter(l => l.status === 'reading' || l.status === 'requested')
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  const completed = logs.filter(l => l.status === 'returned')
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  let html = '<div class="checkout-log-cards">';

  if (active.length > 0) {
    html += `<h3 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text);">📖 Currently Checked Out</h3>`;
    html += active.map(log => renderCheckoutCard(log)).join('');
  }

  if (completed.length > 0) {
    html += `<h3 style="font-size:14px;font-weight:600;margin:${active.length > 0 ? '24px' : '0'} 0 12px;color:var(--muted);">✅ Completed</h3>`;
    html += completed.map(log => renderCheckoutCard(log)).join('');
  }

  html += '</div>';
  return html;
}

function renderCheckoutCard(log) {
  const isReturned = log.status === 'returned';
  const pct = log.totalPages ? Math.round((log.currentPage / log.totalPages) * 100) : 0;
  const clampedPct = Math.min(pct, 100);
  const isOverdue = log.dueBack && log.status === 'reading' && new Date(log.dueBack) < new Date();

  let statusBadge = '';
  if (isOverdue) {
    statusBadge = '<span class="badge badge-red" style="font-size:10px;padding:3px 8px;">⚠️ Overdue</span>';
  } else if (log.status === 'reading') {
    statusBadge = '<span class="badge badge-gold" style="font-size:10px;padding:3px 8px;">📖 Reading</span>';
  } else if (log.status === 'requested') {
    statusBadge = '<span class="badge badge-purple" style="font-size:10px;padding:3px 8px;">🔖 Requested</span>';
  } else {
    statusBadge = '<span class="badge badge-green" style="font-size:10px;padding:3px 8px;">✅ Returned</span>';
  }

  const isActive = log.status === 'reading' || log.status === 'requested';

  return `
    <div class="checkout-log-card ${isReturned ? 'returned' : ''}" data-log-id="${escapeHtml(log.id)}">
      <div class="checkout-log-top">
        <span class="checkout-log-reader">${escapeHtml(log.name)}</span>
        ${statusBadge}
      </div>
      <div class="checkout-log-book">📖 ${escapeHtml(log.book)}</div>
      <div class="checkout-log-row">
        <div class="checkout-log-dates">
          ${log.startDate ? 'Started ' + formatDate(log.startDate) : ''}
          ${log.dueBack ? '<br>Due <span style="color:' + (isOverdue ? 'var(--red)' : 'inherit') + ';">' + formatDate(log.dueBack) + '</span>' : ''}
        </div>
        ${log.status !== 'requested' && log.totalPages ? `
        <div class="checkout-log-progress">
          <div class="checkout-log-bar">
            <div class="checkout-log-bar-fill ${clampedPct >= 100 ? 'completed' : 'reading'}" style="width:${clampedPct}%"></div>
          </div>
          <div style="text-align:right;font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px;">${log.currentPage}/${log.totalPages} (${clampedPct}%)</div>
        </div>` : ''}
      </div>
      ${isActive ? `
      <div class="checkout-log-buttons">
        <button class="checkout-log-btn-progress" data-action="progress" data-log-id="${escapeHtml(log.id)}">📝 Update</button>
        <button class="checkout-log-btn-return" data-action="return" data-log-id="${escapeHtml(log.id)}">📥 Return</button>
      </div>
      <div class="checkout-log-edit" id="edit-${escapeHtml(log.id)}" style="display:none;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:12px;color:var(--muted);">Page</span>
          <input type="number" class="checkout-edit-input" id="page-${escapeHtml(log.id)}" value="${log.currentPage}" min="0" max="${log.totalPages}">
          <span style="font-size:12px;color:var(--muted);">of ${log.totalPages}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:12px;color:var(--muted);">Due</span>
          <input type="date" class="checkout-edit-input" id="due-${escapeHtml(log.id)}" value="${log.dueBack || ''}" style="flex:1;min-width:120px;">
        </div>
        <button class="checkout-edit-save" data-log-id="${escapeHtml(log.id)}">Save</button>
      </div>` : ''}
    </div>
  `;
}

// ─── BOOK DETAIL MODAL ───

function openBookModal(idx) {
  const book = libraryBooks[idx];
  if (!book) return;

  const modal = document.getElementById('bookDetailModal');
  if (!modal) return;

  const status = getBookStatusFromLogs(book);
  const statusClass = status === 'Available' ? 'green' : status === 'Requested' ? 'purple' : 'orange';
  const statusLabel = status === 'Available' ? '✅ Available' : status === 'Requested' ? '🔖 Requested' : '📤 Checked Out';
  const pages = book.Pages || book['Total Pages'] || '';
  const summary = book.Summary || 'No summary available.';
  const checkouts = getCheckoutsForBook(book.Title);
  const activeCheckout = getActiveCheckoutForBook(book.Title);

  // Cover
  document.getElementById('bookModalCover').innerHTML = renderBookCover(book, 'large');
  // Title & author
  document.getElementById('bookModalTitle').textContent = book.Title;
  document.getElementById('bookModalAuthor').textContent = 'by ' + book.Author;
  // Meta badges
  let metaHTML = `<span class="badge badge-${statusClass}" style="font-size:10px;padding:3px 8px;">${statusLabel}</span>`;
  if (book.Owner) metaHTML += `<span class="badge badge-gold" style="font-size:10px;padding:3px 8px;">👤 ${escapeHtml(book.Owner)}</span>`;
  if (book.Genre) metaHTML += `<span class="badge badge-muted" style="font-size:10px;padding:3px 8px;">${escapeHtml(book.Genre)}</span>`;
  if (pages) metaHTML += `<span style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;">${escapeHtml(pages)} pages</span>`;
  if (isOwnerFav(book)) metaHTML += `<span class="lib-fav-badge" style="position:static;font-size:10px;">⭐ Owner Fav</span>`;
  document.getElementById('bookModalMeta').innerHTML = metaHTML;
  // Stars
  const starsEl = document.getElementById('bookModalStars');
  if (starsEl) starsEl.innerHTML = renderStarRating(book);
  // Summary
  document.getElementById('bookModalSummary').textContent = summary;

  // Action buttons
  const actionsEl = document.getElementById('bookModalActions');
  const due30 = new Date();
  due30.setDate(due30.getDate() + 30);
  const dueVal = due30.toISOString().slice(0, 10);

  if (status === 'Available') {
    actionsEl.innerHTML = `
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">📤 Check Out This Book</h3>
      <div class="book-modal-form">
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input type="text" class="form-input" id="bookModalCheckoutName" placeholder="Enter your name...">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Due Back</label>
          <input type="date" class="form-input" id="bookModalCheckoutDue" value="${dueVal}">
          <button class="btn btn-primary" id="bookModalCheckoutBtn" data-book-idx="${idx}" style="margin-top:8px;">📤 Check Out</button>
        </div>
        <p style="margin-top:10px;font-size:11px;color:var(--muted);line-height:1.5;">Please coordinate with the owner to get the book. Update the site when you return it.</p>
      </div>
      <div class="book-modal-msg" id="bookModalMsg"></div>`;
  } else {
    const readerName = activeCheckout ? activeCheckout.name : 'someone';
    actionsEl.innerHTML = `
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">This book is with ${escapeHtml(readerName)}</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn" style="flex:1;min-width:120px;background:var(--green);color:white;" id="bookModalReturnBtn" data-book-idx="${idx}">📥 Return</button>
        <button class="btn" style="flex:1;min-width:120px;background:var(--purple);color:white;" id="bookModalRequestBtn" data-book-idx="${idx}">🔖 Request</button>
      </div>
      <div class="book-modal-form" id="bookModalInlineForm" style="display:none;margin-top:12px;"></div>
      <div class="book-modal-msg" id="bookModalMsg"></div>`;
  }

  // Checkout history
  const historyEl = document.getElementById('bookModalHistory');
  if (checkouts.length === 0) {
    historyEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0;">No one has checked out this book yet.</div>';
  } else {
    // Sort: active (reading/requested) first, then returned
    checkouts.sort((a, b) => {
      const aActive = a.status === 'reading' || a.status === 'requested' ? 0 : 1;
      const bActive = b.status === 'reading' || b.status === 'requested' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (b.startDate || '').localeCompare(a.startDate || '');
    });
    historyEl.innerHTML = checkouts.map(l => {
      const pct = l.totalPages ? Math.round((l.currentPage / l.totalPages) * 100) : 0;
      const cPct = Math.min(pct, 100);
      const statusText = l.status === 'reading' ? '📖 Reading' : l.status === 'requested' ? '🔖 Requested' : '✅ Returned';
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--accent);flex-shrink:0;">${escapeHtml(l.name)[0] || '?'}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">${escapeHtml(l.name)}</div>
            <div style="font-size:11px;color:var(--muted);">${statusText} · Started ${formatDate(l.startDate)}${l.dueBack ? ' · Due ' + formatDate(l.dueBack) : ''}</div>
          </div>
          ${l.status !== 'requested' && l.totalPages ? `
          <div style="width:80px;">
            <div class="checkout-log-bar" style="height:6px;"><div class="checkout-log-bar-fill ${cPct >= 100 ? 'completed' : 'reading'}" style="width:${cPct}%"></div></div>
            <div style="font-size:10px;color:var(--muted);text-align:right;font-family:'JetBrains Mono',monospace;">${cPct}%</div>
          </div>` : ''}
        </div>`;
    }).join('');
  }

  // Show modal
  modal.classList.add('active');

  // Attach action listeners
  setTimeout(() => initBookModalActions(idx), 0);
}

function closeBookModal() {
  const modal = document.getElementById('bookDetailModal');
  if (modal) modal.classList.remove('active');
}

function initBookModalActions(idx) {
  const book = libraryBooks[idx];
  if (!book) return;

  // Close handlers
  const closeBtn = document.getElementById('bookModalCloseBtn');
  const overlay = document.getElementById('bookDetailModal');
  if (closeBtn) closeBtn.onclick = closeBookModal;
  if (overlay) overlay.onclick = (e) => { if (e.target === overlay) closeBookModal(); };

  // Checkout button
  const checkoutBtn = document.getElementById('bookModalCheckoutBtn');
  if (checkoutBtn) {
    checkoutBtn.onclick = async () => {
      const name = (document.getElementById('bookModalCheckoutName').value || '').trim();
      const dueBack = document.getElementById('bookModalCheckoutDue').value;
      const msgEl = document.getElementById('bookModalMsg');
      if (!name) {
        msgEl.innerHTML = '<div class="badge badge-red" style="padding:8px 12px;font-size:12px;">Please enter your name.</div>';
        return;
      }
      const totalPages = parseInt(book.Pages || book['Total Pages'] || '0') || 0;
      await addCheckoutLog({
        name,
        book: book.Title,
        startDate: new Date().toISOString().slice(0, 10),
        dueBack,
        currentPage: 0,
        totalPages,
        status: 'reading'
      });

      // Notify the book owner via email (automatic via email queue + Cloud Functions)
      const ownerEmail = book.OwnerEmail || book['Owner Email'] || '';
      const ownerName = book.Owner || '';
      if (ownerEmail) {
        try {
          await sendCheckoutEmail(ownerEmail, ownerName, name, book.Title, dueBack);
          msgEl.innerHTML = '<div class="badge badge-green" style="padding:8px 12px;font-size:12px;">📚 Checked out! Due back ' + formatDate(dueBack) + '. Email notification sent.</div>';
        } catch (error) {
          console.error('Email send failed:', error);
          msgEl.innerHTML = '<div class="badge badge-green" style="padding:8px 12px;font-size:12px;">📚 Checked out! Due back ' + formatDate(dueBack) + '. (Email notification failed)</div>';
        }
      } else {
        msgEl.innerHTML = '<div class="badge badge-green" style="padding:8px 12px;font-size:12px;">📚 Checked out! Due back ' + formatDate(dueBack) + '.</div>';
      }

      setTimeout(async () => {
        closeBookModal();
        await getCheckoutLogs(); // Refresh checkout logs
        document.getElementById('app').innerHTML = renderLibraryPage();
        initLibraryPage();
      }, 1500);
    };
  }

  // Return button
  const returnBtn = document.getElementById('bookModalReturnBtn');
  if (returnBtn) {
    returnBtn.onclick = () => {
      const formArea = document.getElementById('bookModalInlineForm');
      const active = getActiveCheckoutForBook(book.Title);
      formArea.style.display = 'block';
      formArea.innerHTML = `
        <div class="form-group">
          <label class="form-label">Returning as</label>
          <input type="text" class="form-input" id="bookModalReturnName" value="${escapeHtml(active ? active.name : '')}" placeholder="Your name">
        </div>
        <button class="btn" style="width:100%;background:var(--green);color:white;" id="bookModalConfirmReturn">✅ Confirm Return</button>`;
      setTimeout(() => {
        const confirmBtn = document.getElementById('bookModalConfirmReturn');
        if (confirmBtn) {
          confirmBtn.onclick = async () => {
            const returnName = (document.getElementById('bookModalReturnName').value || '').trim() || (active ? active.name : '');
            if (active) {
              await updateCheckoutLog(active.id, { status: 'returned', currentPage: active.totalPages || active.currentPage });
            }
            // Notify book owner
            const ownerEmail = book.OwnerEmail || book['Owner Email'] || '';
            console.log(`Return: book="${book.Title}", owner="${book.Owner}", ownerEmail="${ownerEmail}"`);
            if (ownerEmail) {
              sendCheckoutEmail(ownerEmail, book.Owner || '', returnName, book.Title, '', 'return');
            } else {
              console.warn(`No owner email for "${book.Title}" — skipping notification`);
            }
            const msgEl = document.getElementById('bookModalMsg');
            msgEl.innerHTML = '<div class="badge badge-green" style="padding:8px 12px;font-size:12px;">✅ Book returned!</div>';
            setTimeout(async () => {
              closeBookModal();
              await getCheckoutLogs(); // Refresh checkout logs
              document.getElementById('app').innerHTML = renderLibraryPage();
              initLibraryPage();
            }, 1500);
          };
        }
      }, 0);
    };
  }

  // Request button
  const requestBtn = document.getElementById('bookModalRequestBtn');
  if (requestBtn) {
    requestBtn.onclick = () => {
      const formArea = document.getElementById('bookModalInlineForm');
      formArea.style.display = 'block';
      formArea.innerHTML = `
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input type="text" class="form-input" id="bookModalRequestName" placeholder="Enter your name...">
        </div>
        <button class="btn" style="width:100%;background:var(--purple);color:white;" id="bookModalConfirmRequest">🔖 Request Next in Line</button>`;
      setTimeout(() => {
        const confirmBtn = document.getElementById('bookModalConfirmRequest');
        if (confirmBtn) {
          confirmBtn.onclick = async () => {
            const name = (document.getElementById('bookModalRequestName').value || '').trim();
            const msgEl = document.getElementById('bookModalMsg');
            if (!name) {
              msgEl.innerHTML = '<div class="badge badge-red" style="padding:8px 12px;font-size:12px;">Please enter your name.</div>';
              return;
            }
            const totalPages = parseInt(book.Pages || book['Total Pages'] || '0') || 0;
            await addCheckoutLog({
              name,
              book: book.Title,
              startDate: new Date().toISOString().slice(0, 10),
              dueBack: '',
              currentPage: 0,
              totalPages,
              status: 'requested'
            });
            // Notify book owner
            const ownerEmail = book.OwnerEmail || book['Owner Email'] || '';
            if (ownerEmail) {
              sendCheckoutEmail(ownerEmail, book.Owner || '', name, book.Title, '', 'request');
            }
            msgEl.innerHTML = '<div class="badge badge-green" style="padding:8px 12px;font-size:12px;">🔖 You\'re next in line!</div>';
            setTimeout(async () => {
              closeBookModal();
              await getCheckoutLogs(); // Refresh checkout logs
              document.getElementById('app').innerHTML = renderLibraryPage();
              initLibraryPage();
            }, 1500);
          };
        }
      }, 0);
    };
  }
}

// ─── FILTERS ───

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

function applyLibraryFilters() {
  const grid = document.getElementById('libraryGrid');
  if (grid) {
    grid.innerHTML = renderLibraryBooks();
    // Re-attach card click listeners
    attachBookCardListeners();
  }

  const hasActiveFilters = activeLibraryFilters.size > 0;
  document.querySelectorAll('.library-pill').forEach(pill => {
    const f = pill.dataset.filter;
    if (f === 'all') {
      pill.classList.toggle('active', !hasActiveFilters);
    } else {
      pill.classList.toggle('active', activeLibraryFilters.has(f));
    }
  });

  const toggle = document.getElementById('libraryFilterToggle');
  if (toggle) {
    const catGenreCount = [...activeLibraryFilters].filter(f => f.startsWith('cat:') || f.startsWith('genre:')).length;
    toggle.textContent = `${libraryFiltersVisible ? '🔼' : '🔽'} More${catGenreCount > 0 ? ' (' + catGenreCount + ')' : ''}`;
  }
}

// ─── ATTACH LISTENERS ───

function attachBookCardListeners() {
  document.querySelectorAll('.library-book-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      if (!isNaN(idx)) openBookModal(idx);
    });
  });
}

function attachCheckoutLogListeners() {
  // Progress toggle buttons
  document.querySelectorAll('[data-action="progress"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const logId = btn.dataset.logId;
      const editEl = document.getElementById('edit-' + logId);
      if (editEl) editEl.style.display = editEl.style.display === 'none' ? 'block' : 'none';
    });
  });

  // Return buttons
  document.querySelectorAll('[data-action="return"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const logId = btn.dataset.logId;
      const log = libraryCheckoutLogs.find(l => l.id === logId);
      if (log) {
        await updateCheckoutLog(logId, { status: 'returned', currentPage: log.totalPages || log.currentPage });
        // Send return email to book owner
        const book = libraryBooks.find(b => b.Title === log.book);
        if (book) {
          const ownerEmail = book.OwnerEmail || book['Owner Email'] || '';
          console.log(`Return (log tab): book="${log.book}", owner="${book.Owner}", ownerEmail="${ownerEmail}"`);
          if (ownerEmail) {
            sendCheckoutEmail(ownerEmail, book.Owner || '', log.name, book.Title, '', 'return');
          } else {
            console.warn(`No owner email for "${log.book}" — skipping notification`);
          }
        } else {
          console.warn(`Book not found in libraryBooks for "${log.book}" — skipping notification`);
        }
        await getCheckoutLogs();
        document.getElementById('app').innerHTML = renderLibraryPage();
        initLibraryPage();
      }
    });
  });

  // Save progress buttons
  document.querySelectorAll('.checkout-edit-save').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const logId = btn.dataset.logId;
      const pageInput = document.getElementById('page-' + logId);
      const dueInput = document.getElementById('due-' + logId);
      const updates = { status: 'reading' };
      if (pageInput) updates.currentPage = parseInt(pageInput.value) || 0;
      if (dueInput) updates.dueBack = dueInput.value;
      await updateCheckoutLog(logId, updates);
      await getCheckoutLogs();
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  });
}

// ─── MIGRATE LOCALSTORAGE CHECKOUTS ───

async function migrateLocalStorageCheckouts() {
  try {
    if (typeof db === 'undefined') return;
    
    const localLogs = JSON.parse(localStorage.getItem('ccr_checkout_logs') || '[]');
    if (localLogs.length === 0) return;
    
    console.log(`Migrating ${localLogs.length} checkout logs to Firestore...`);
    
    // Check if we already have checkouts in Firestore
    const existingCheckouts = await db.collection('checkouts').limit(1).get();
    if (!existingCheckouts.empty) {
      console.log('Checkout logs already exist in Firestore, skipping migration');
      return;
    }
    
    // Migrate each log
    const batch = db.batch();
    localLogs.forEach(log => {
      const docRef = db.collection('checkouts').doc();
      const logData = {
        ...log,
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now()
      };
      delete logData.id; // Let Firestore generate the ID
      batch.set(docRef, logData);
    });
    
    await batch.commit();
    console.log('Successfully migrated checkout logs to Firestore');
    
    // Keep localStorage as backup but mark as migrated
    localStorage.setItem('ccr_checkout_logs_migrated', 'true');
    
  } catch (error) {
    console.error('Error migrating checkout logs:', error);
  }
}

// ─── INIT ───

async function initLibraryPage() {
  // Migrate localStorage data on first load
  if (typeof db !== 'undefined' && !localStorage.getItem('ccr_checkout_logs_migrated')) {
    await migrateLocalStorageCheckouts();
  }

  // Fetch checkout logs
  await getCheckoutLogs();

  if (libraryBooks.length === 0) {
    fetchLibraryData().then(() => {
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
      // Auto-fetch missing covers in background (editor+ only)
      autoFetchMissingCovers();
    });
    return;
  }

  // Tab switching
  document.querySelectorAll('button[data-libtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLibraryTab = btn.dataset.libtab;
      document.getElementById('app').innerHTML = renderLibraryPage();
      initLibraryPage();
    });
  });

  // Filter toggle
  const filterToggle = document.getElementById('libraryFilterToggle');
  const filterPills = document.getElementById('libraryPills');
  if (filterToggle && filterPills) {
    filterToggle.addEventListener('click', () => {
      libraryFiltersVisible = !libraryFiltersVisible;
      filterPills.style.display = libraryFiltersVisible ? 'flex' : 'none';
      const hasActive = activeLibraryFilters.size > 0;
      const catGenreCount = [...activeLibraryFilters].filter(f => f.startsWith('cat:') || f.startsWith('genre:')).length;
      filterToggle.textContent = `${libraryFiltersVisible ? '🔼' : '🔽'} More${catGenreCount > 0 ? ' (' + catGenreCount + ')' : ''}`;
    });
  }

  // Search
  const searchInput = document.getElementById('librarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      librarySearchQuery = e.target.value;
      applyLibraryFilters();
    });
    if (librarySearchQuery) {
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  // Pill filter clicks
  document.querySelectorAll('.library-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      toggleLibraryFilter(pill.dataset.filter);
    });
  });

  // Book card clicks → modal
  attachBookCardListeners();

  // Checkout log listeners
  attachCheckoutLogListeners();
}
