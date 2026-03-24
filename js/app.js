/* ====================================
   CCR APP - MAIN ROUTER & FAB NAV
   ==================================== */

const APP_VERSION = '2.5.1';

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
    case 'vote':
      app.innerHTML = renderVotePage();
      initVotePage();
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
            role: userData.role || 'member'
          };
          console.log('User signed in:', AppState.currentUser);

          // Initialize seed data if this is the first user
          if (userData.role === 'admin') {
            const usersCount = await db.collection('users').get();
            if (usersCount.size === 1) {
              console.log('First user detected - initializing seed data');
              await initializeSeedData();
            }
          }

          // Request notification permission
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }

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
