/* ====================================
   CCR APP - MAIN ROUTER & FAB NAV
   ==================================== */

const APP_VERSION = '2.10.14';

// ====================================
// LAZY SCRIPT LOADER
// ====================================
const loadedScripts = new Set();
async function loadPageScript(src) {
    if (loadedScripts.has(src)) return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { loadedScripts.add(src); resolve(); };
        script.onerror = () => reject(new Error('Failed to load: ' + src));
        document.head.appendChild(script);
    });
}

// Page-to-script mapping for lazy loading
const PAGE_SCRIPTS = {
    schedule: ['js/schedule.js?v=' + APP_VERSION],
    library:  ['js/library.js?v=' + APP_VERSION],
    giving:   ['js/charities-data.js?v=' + APP_VERSION, 'js/giving.js?v=' + APP_VERSION],
    bible:    ['js/bible.js?v=' + APP_VERSION],
    sermons:  ['js/sermons.js?v=' + APP_VERSION],
    vote:     ['js/vote.js?v=' + APP_VERSION],
    settings: ['js/settings.js?v=' + APP_VERSION]
};

async function ensurePageScripts(page) {
    const scripts = PAGE_SCRIPTS[page];
    if (!scripts) return;
    for (const src of scripts) {
        await loadPageScript(src);
    }
}

// Global state
const AppState = {
  currentUser: null,
  currentPage: 'login'
};

// Page order for swipe navigation
const PAGE_ORDER = ['home','prayer','giving','library','bible','sermons','schedule','bulletin','documents','settings'];

// Router
function navigateTo(page, slideDirection) {
  const oldPage = AppState.currentPage;
  AppState.currentPage = page;
  window.currentPage = page;

  // Slide animation
  const appEl = document.getElementById('app');
  if (slideDirection && appEl) {
    appEl.classList.remove('slide-left', 'slide-right');
    void appEl.offsetWidth; // force reflow
    appEl.classList.add(slideDirection === 'left' ? 'slide-left' : 'slide-right');
    appEl.addEventListener('animationend', () => {
      appEl.classList.remove('slide-left', 'slide-right');
    }, { once: true });
  } else if (!slideDirection && oldPage !== page) {
    // Auto-detect direction for non-swipe navigations
    const oldIdx = PAGE_ORDER.indexOf(oldPage);
    const newIdx = PAGE_ORDER.indexOf(page);
    if (oldIdx !== -1 && newIdx !== -1 && appEl) {
      const dir = newIdx > oldIdx ? 'slide-left' : 'slide-right';
      appEl.classList.remove('slide-left', 'slide-right');
      void appEl.offsetWidth;
      appEl.classList.add(dir);
      appEl.addEventListener('animationend', () => {
        appEl.classList.remove('slide-left', 'slide-right');
      }, { once: true });
    }
  }

  render();
  updateFABHighlight(page);
  updatePageIndicator(page);

  // Close FAB menu after navigation
  const fabMenu = document.getElementById('fabMenu');
  const fabTrigger = document.getElementById('fabTrigger');
  if (fabMenu && fabTrigger) {
    fabMenu.classList.remove('active');
    fabTrigger.classList.remove('active');
  }
}

// Page indicator dots
function updatePageIndicator(page) {
  const indicator = document.getElementById('page-indicator');
  if (!indicator) return;
  const idx = PAGE_ORDER.indexOf(page);
  if (idx === -1 || page === 'login' || page === 'vote') {
    indicator.style.display = 'none';
    return;
  }
  indicator.style.display = 'flex';
  indicator.innerHTML = PAGE_ORDER.map((p, i) =>
    `<div class="dot${i === idx ? ' active' : ''}"></div>`
  ).join('');
}

function updateFABHighlight(page) {
  const fabItems = document.querySelectorAll('.fab-item');
  fabItems.forEach(item => {
    if (item.dataset.page === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Render current page
async function render() {
  const app = document.getElementById('app');
  const fabNav = document.getElementById('fab-nav');

  // Check auth
  if (!AppState.currentUser && AppState.currentPage !== 'login') {
    AppState.currentPage = 'login';
  }

  // Hide FAB on login page
  if (AppState.currentPage === 'login') {
    fabNav.style.display = 'none';
  } else {
    fabNav.style.display = 'block';
    // Check for new bulletin badge
    if (typeof checkBulletinBadge === 'function') {
      loadBulletins().then(() => checkBulletinBadge()).catch(() => {});
    }
    // Check for new prayer request badge
    if (typeof checkPrayerBadge === 'function' && typeof loadPrayers === 'function') {
      loadPrayers().then(() => checkPrayerBadge()).catch(() => {});
    }
  }

  // Lazy-load page scripts before rendering
  try {
    await ensurePageScripts(AppState.currentPage);
  } catch (e) {
    console.error('Failed to load page scripts:', e);
    app.innerHTML = '<div class="page"><h1>Loading Error</h1><p>Could not load page. Please check your connection and try again.</p></div>';
    return;
  }

  // Route to page renderer
  switch (AppState.currentPage) {
    case 'login':
      app.innerHTML = renderLoginPage();
      initLoginPage();
      break;
    case 'home':
      app.innerHTML = renderHomePage();
      initHomePage();
      break;
    case 'prayer':
      app.innerHTML = renderPrayerPage();
      await initPrayerPage();
      break;
    case 'giving':
      app.innerHTML = await renderGivingPage();
      initGivingPage();
      break;
    case 'library':
      app.innerHTML = renderLibraryPage();
      initLibraryPage();
      break;
    case 'bible':
      app.innerHTML = await renderBiblePage();
      initBiblePage();
      break;
    case 'sermons':
      app.innerHTML = renderSermonsPage();
      await initSermonsPage();
      break;
    case 'schedule':
      app.innerHTML = renderSchedulePage();
      await initSchedulePage();
      break;
    case 'bulletin':
      app.innerHTML = renderBulletinPage();
      await initBulletinPage();
      break;
    case 'documents':
      app.innerHTML = renderDocumentsPage();
      await initDocumentsPage();
      break;
    case 'vote':
      app.innerHTML = renderVotePage();
      await initVotePage();
      break;
    case 'settings':
      try {
        app.innerHTML = renderSettingsPage();
        initSettingsPage();
      } catch (e) {
        console.error('Settings page error:', e);
        app.innerHTML = '<div class="page"><h1>Settings Error</h1><p>' + e.message + '</p></div>';
      }
      break;
    default:
      app.innerHTML = '<div class="page"><h1>404 - Page Not Found</h1></div>';
  }
}

// FAB Navigation setup
function initFAB() {
  const fabTrigger = document.getElementById('fabTrigger');
  const fabMenu = document.getElementById('fabMenu');
  const fabItems = document.querySelectorAll('.fab-item');
  const moreMenuOverlay = document.getElementById('moreMenuOverlay');
  const moreMenuClose = document.getElementById('moreMenuClose');
  const moreMenuItems = document.querySelectorAll('.more-menu-item');

  // Toggle FAB menu
  fabTrigger.addEventListener('click', () => {
    const isActive = fabMenu.classList.toggle('active');
    fabTrigger.classList.toggle('active');
  });

  // Close FAB on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#fab-nav')) {
      fabMenu.classList.remove('active');
      fabTrigger.classList.remove('active');
    }
  });

  // FAB item clicks
  fabItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const page = item.dataset.page;

      if (page === 'more') {
        moreMenuOverlay.classList.add('active');
      } else {
        navigateTo(page);
      }
    });
  });

  // More menu
  moreMenuClose.addEventListener('click', () => {
    moreMenuOverlay.classList.remove('active');
  });

  moreMenuOverlay.addEventListener('click', (e) => {
    if (e.target === moreMenuOverlay) {
      moreMenuOverlay.classList.remove('active');
    }
  });

  moreMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      moreMenuOverlay.classList.remove('active');
      navigateTo(page);
    });
  });
}

// Initialize app
async function init() {
  // Initialize Firebase
  initFirebase();

  // Apply saved theme
  const theme = localStorage.getItem('ccr_theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  // Setup FAB
  initVersionModal();
  initFAB();

  // Set up Firebase auth state listener
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // User is signed in - fetch their profile from Firestore
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          AppState.currentUser = {
            uid: user.uid,
            name: userData.name || user.displayName || user.email,
            email: user.email,
            username: userData.username || user.email?.replace('@ccr.app', '') || '',
            role: userData.role || 'member'
          };
          console.log('User signed in:', AppState.currentUser);

          // Initialize seed data if this is the first user
          if (userData.role === 'admin') {
            const usersCount = await db.collection('users').get();
            if (usersCount.size === 1) {
              console.log('First user detected - initializing seed data');
              await loadPageScript('js/seed-data.js?v=' + APP_VERSION);
              await initializeSeedData();
            }
          }

          // Initialize push notifications (non-blocking — never prevent login)
          try { onUserLogin(); } catch(e) { console.warn('Push notification init failed (non-blocking):', e.message); }

          // Navigate to home page if on login page
          if (AppState.currentPage === 'login') {
            navigateTo('home');
          } else {
            render();
          }
        } else {
          console.error('User document not found in Firestore');
          AppState.currentUser = null;
          navigateTo('login');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        AppState.currentUser = null;
        navigateTo('login');
      }
    } else {
      // User is signed out
      AppState.currentUser = null;
      onUserLogout();
      if (AppState.currentPage !== 'login') {
        navigateTo('login');
      } else {
        render();
      }
    }
  });
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Utility functions
function getCurrentUser() {
  return AppState.currentUser;
}

function isAdmin() {
  return AppState.currentUser && AppState.currentUser.role === 'admin';
}

function isEditor() {
  return AppState.currentUser && (AppState.currentUser.role === 'editor' || AppState.currentUser.role === 'admin');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy text to clipboard with visual feedback on the button
function copyCardText(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.textContent;
    btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = orig; }, 1200);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const orig = btnEl.textContent;
    btnEl.textContent = '✅';
    setTimeout(() => { btnEl.textContent = orig; }, 1200);
  });
}

// Version modal
function initVersionModal() {
  const versionBadge = document.getElementById('fabVersionBadge');
  const versionModalOverlay = document.getElementById('versionModalOverlay');
  const versionModalClose = document.getElementById('versionModalClose');

  if (versionBadge) {
    // Set version dynamically
    versionBadge.textContent = 'v' + APP_VERSION;
    versionBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      versionModalOverlay.classList.add('active');
    });
  }

  if (versionModalClose) {
    versionModalClose.addEventListener('click', () => {
      versionModalOverlay.classList.remove('active');
    });
  }

  if (versionModalOverlay) {
    versionModalOverlay.addEventListener('click', (e) => {
      if (e.target === versionModalOverlay) {
        versionModalOverlay.classList.remove('active');
      }
    });
  }
}

// ====================================
// PULL-DOWN NAVIGATION
// ====================================
(function() {
  const pulldownNav = document.getElementById('pulldown-nav');
  if (!pulldownNav) return;

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'pulldown-backdrop';
  document.body.appendChild(backdrop);

  let touchStartY = 0;
  let touchStartX = 0;
  let isPulling = false;

  function openPulldown() {
    pulldownNav.classList.add('active');
    backdrop.classList.add('active');
    // Highlight current page
    const currentPage = window.currentPage || 'home';
    pulldownNav.querySelectorAll('.pulldown-item').forEach(btn => {
      btn.classList.toggle('current', btn.dataset.page === currentPage);
    });
  }

  function closePulldown() {
    pulldownNav.classList.remove('active');
    backdrop.classList.remove('active');
  }

  // Touch: pull down from top of page
  document.addEventListener('touchstart', function(e) {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    // Only trigger when near top of page and touching top 60px of screen
    isPulling = scrollTop < 10 && touchStartY < 60;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!isPulling) return;
    const dy = e.touches[0].clientY - touchStartY;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    // Must swipe more down than sideways, at least 40px
    if (dy > 40 && dy > dx * 1.5 && !pulldownNav.classList.contains('active')) {
      openPulldown();
      isPulling = false;
    }
  }, { passive: true });

  // Close on backdrop tap
  backdrop.addEventListener('click', closePulldown);

  // Close on swipe up within nav
  let navTouchStartY = 0;
  pulldownNav.addEventListener('touchstart', function(e) {
    navTouchStartY = e.touches[0].clientY;
  }, { passive: true });
  pulldownNav.addEventListener('touchmove', function(e) {
    const dy = e.touches[0].clientY - navTouchStartY;
    if (dy < -30) {
      closePulldown();
    }
  }, { passive: true });

  // Navigate on item click
  pulldownNav.addEventListener('click', function(e) {
    const btn = e.target.closest('.pulldown-item');
    if (!btn) return;
    const page = btn.dataset.page;
    closePulldown();
    if (typeof navigateTo === 'function') {
      navigateTo(page);
    }
  });
})();

// Listen for service worker navigation messages (from notification clicks)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate') {
      const url = event.data.url;
      // Extract page from URL (e.g., '/prayer' -> 'prayer')
      const page = url.replace('/', '').replace('#', '') || 'home';
      navigateTo(page);
    }
  });
}

// ====================================
// HORIZONTAL SWIPE NAVIGATION
// ====================================
(function() {
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swiping = false;

  document.addEventListener('touchstart', function(e) {
    // Skip if pulldown nav is open
    if (document.querySelector('.pulldown-nav.active')) return;
    // Skip login page
    if (!AppState.currentUser) return;
    // Skip if touch is inside a modal, form, or horizontally-scrollable container
    const el = e.target;
    if (el.closest('.charity-modal, .modal-overlay, .transaction-form, input, textarea, select')) return;
    if (el.closest('.vol-grid-scroll, .bible-chapter-grid')) return;

    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!swiping) return;
    const dy = Math.abs(e.touches[0].clientY - swipeStartY);
    const dx = Math.abs(e.touches[0].clientX - swipeStartX);

    // If scrolling vertically, cancel swipe detection
    if (dy > 30 && dy > dx) {
      swiping = false;
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!swiping) return;
    swiping = false;

    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY);
    const absDx = Math.abs(dx);

    // Need a clear horizontal swipe: >80px, more horizontal than vertical
    if (absDx < 80 || dy > absDx * 0.7) return;

    const currentPage = AppState.currentPage;
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (idx === -1) return;

    if (dx < 0 && idx < PAGE_ORDER.length - 1) {
      // Swipe left → next page
      navigateTo(PAGE_ORDER[idx + 1], 'left');
    } else if (dx > 0 && idx > 0) {
      // Swipe right → previous page
      navigateTo(PAGE_ORDER[idx - 1], 'right');
    }
  }, { passive: true });
})();
