/* ====================================
   CCR APP - MAIN ROUTER & FAB NAV
   ==================================== */

// Global state
const AppState = {
  currentUser: null,
  currentPage: 'login'
};

// Router
function navigateTo(page) {
  AppState.currentPage = page;
  render();
  updateFABHighlight(page);

  // Close FAB menu after navigation
  const fabMenu = document.getElementById('fabMenu');
  const fabTrigger = document.getElementById('fabTrigger');
  if (fabMenu && fabTrigger) {
    fabMenu.classList.remove('active');
    fabTrigger.classList.remove('active');
  }
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
function render() {
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
  }

  // Route to page renderer
  switch (AppState.currentPage) {
    case 'login':
      app.innerHTML = renderLoginPage();
      initLoginPage();
      break;
    case 'prayer':
      app.innerHTML = renderPrayerPage();
      initPrayerPage();
      break;
    case 'giving':
      app.innerHTML = renderGivingPage();
      initGivingPage();
      break;
    case 'library':
      app.innerHTML = renderLibraryPage();
      initLibraryPage();
      break;
    case 'bible':
      app.innerHTML = renderBiblePage();
      initBiblePage();
      break;
    case 'sermons':
      app.innerHTML = renderSermonsPage();
      initSermonsPage();
      break;
    case 'schedule':
      app.innerHTML = renderSchedulePage();
      initSchedulePage();
      break;
    case 'bulletin':
      app.innerHTML = renderBulletinPage();
      initBulletinPage();
      break;
    case 'vote':
      app.innerHTML = renderVotePage();
      initVotePage();
      break;
    case 'settings':
      app.innerHTML = renderSettingsPage();
      initSettingsPage();
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
function init() {
  // Check for saved user
  const savedUser = localStorage.getItem('ccr_user');
  if (savedUser) {
    AppState.currentUser = JSON.parse(savedUser);
    AppState.currentPage = 'prayer'; // Default home page
  }

  // Apply saved theme
  const theme = localStorage.getItem('ccr_theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  // Setup FAB
  initVersionModal();
  initFAB();

  // Initial render
  render();
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

// Version modal
function initVersionModal() {
  const versionBadge = document.getElementById('fabVersionBadge');
  const versionModalOverlay = document.getElementById('versionModalOverlay');
  const versionModalClose = document.getElementById('versionModalClose');

  if (versionBadge) {
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
