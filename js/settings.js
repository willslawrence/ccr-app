/* ====================================
   SETTINGS PAGE
   ==================================== */

function renderSettingsPage() {
  const user = getCurrentUser() || { name: 'User', email: '', role: 'member' };

  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 class="page-title">⚙️ Settings</h1>
            <p class="page-subtitle">Manage your preferences and account</p>
          </div>
          <button id="themeToggle" style="width:44px;height:44px;border:none;border-radius:12px;background:var(--surface);color:var(--muted);font-size:20px;cursor:pointer;transition:all 0.2s;">🌙</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="card" style="padding:12px;">
          <h3 style="margin-bottom:12px;font-size:16px;">Profile</h3>
          <div style="display:grid;gap:8px;">
            <div>
              <div class="text-muted" style="font-size:12px;margin-bottom:2px;">Name</div>
              <div style="font-weight:500;font-size:14px;">${escapeHtml(user.name)}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:12px;margin-bottom:2px;">Email</div>
              <div style="font-weight:500;font-size:14px;">${escapeHtml(user.email)}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:12px;margin-bottom:2px;">Role</div>
              <div>
                ${user.role === 'admin' ? '<span class="badge" style="background:var(--purple);color:white;font-size:11px;">Admin</span>' : ''}
                ${user.role === 'editor' ? '<span class="badge" style="background:var(--blue);color:white;font-size:11px;">Editor</span>' : ''}
                ${user.role === 'member' ? '<span class="badge" style="background:var(--green);color:white;font-size:11px;">Member</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;">
          <h3 style="margin-bottom:12px;font-size:16px;">About</h3>
          <div style="display:grid;gap:6px;font-size:13px;">
            <div><strong>App Name:</strong> CCR Church App</div>
            <div><strong>Version:</strong> ${APP_VERSION}</div>
            <div><strong>Build:</strong> ${new Date().getFullYear()}.03</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;font-size:16px;">🔔 Notifications</h3>
        <div id="notificationStatus" style="margin-bottom:12px;"></div>
        <div class="btn-group">
          <button class="btn btn-primary" id="enableNotificationsBtn" style="display:none;">Enable Notifications</button>
          <button class="btn btn-outline" id="testNotificationBtn" style="display:none;">Test Notification</button>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:8px;">
          Get notified about prayer requests, bulletins, and schedule updates
        </p>
      </div>

      <div class="btn-group">
        <button class="btn btn-outline" id="signOutBtn" style="color:var(--red);border-color:var(--red);">
          Sign Out
        </button>
      </div>

      <div style="margin-top:32px;text-align:center;color:var(--muted);font-size:13px;">
        <p>Made with ♥ for CCR Church</p>
      </div>
    </div>
  `;
}

function initSettingsPage() {
  setupThemeToggle();
  setupSignOut();
  setupNotificationSettings();
}

function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');

  function updateToggleUI() {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      toggle.textContent = '☀️';
      toggle.style.background = 'var(--accent)';
      toggle.style.color = 'white';
    } else {
      toggle.textContent = '🌙';
      toggle.style.background = 'var(--surface)';
      toggle.style.color = 'var(--muted)';
    }
  }

  // Set initial state
  updateToggleUI();

  // Listen for changes
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    updateToggleUI();
  });
}

function setTheme(theme) {
  localStorage.setItem('ccr_theme', theme);

  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

function setupSignOut() {
  const signOutBtn = document.getElementById('signOutBtn');

  signOutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
    }
  });
}

async function signOut() {
  try {
    await firebase.auth().signOut();
    // Firebase auth state listener will handle the rest
  } catch (error) {
    console.error('Sign out error:', error);
    alert('Failed to sign out. Please try again.');
  }
}

function setupNotificationSettings() {
  const statusEl = document.getElementById('notificationStatus');
  const enableBtn = document.getElementById('enableNotificationsBtn');
  const testBtn = document.getElementById('testNotificationBtn');
  
  if (!statusEl) return;

  // Update status display
  function updateNotificationUI() {
    const status = getNotificationStatus();
    
    switch (status.status) {
      case 'enabled':
        statusEl.innerHTML = '<span style="color:var(--green);font-weight:500;">✅ Notifications enabled</span>';
        enableBtn.style.display = 'none';
        testBtn.style.display = 'inline-block';
        break;
        
      case 'blocked':
        statusEl.innerHTML = '<span style="color:var(--red);font-weight:500;">🚫 Notifications blocked</span><br><span style="font-size:12px;color:var(--muted);">Enable in browser settings</span>';
        enableBtn.style.display = 'none';
        testBtn.style.display = 'none';
        break;
        
      case 'prompt':
        statusEl.innerHTML = '<span style="color:var(--muted);font-weight:500;">🔕 Notifications disabled</span>';
        enableBtn.style.display = 'inline-block';
        testBtn.style.display = 'none';
        break;
        
      default:
        statusEl.innerHTML = '<span style="color:var(--muted);font-weight:500;">📱 Notifications not supported</span>';
        enableBtn.style.display = 'none';
        testBtn.style.display = 'none';
        break;
    }
  }

  // Initial update
  updateNotificationUI();

  // Enable button click
  if (enableBtn) {
    enableBtn.addEventListener('click', async () => {
      const success = await enableNotifications();
      if (success) {
        updateNotificationUI();
      }
    });
  }

  // Test button click
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      if (areNotificationsEnabled()) {
        new Notification('CCR Church App', {
          body: 'Test notification - everything is working! 🎉',
          icon: '/ccr-app/icon-192.svg',
          tag: 'test-notification'
        });
      }
    });
  }
}

/* ====================================
   THEME TOGGLE STYLES
   These would typically be in CSS, but including here for completeness
   ==================================== */

// Add this CSS to your app.css file:
/*
.theme-toggle {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.theme-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--border);
  border-radius: 28px;
  transition: background 0.3s;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.5);
}

.theme-toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.theme-toggle input:checked + .theme-toggle-slider {
  background: var(--accent);
}

.theme-toggle input:checked + .theme-toggle-slider:before {
  transform: translateX(24px);
}

.theme-toggle-slider:hover {
  opacity: 0.9;
}

// Dark theme variables
body.dark-theme {
  --bg: #1a1a1a;
  --card: #2d2d2d;
  --border: rgba(255,255,255,0.1);
  --text: #f0f0f0;
  --muted: #a0a0a0;
  --accent: #d4a84b;
  --accent-light: #f5e6b8;
  --gold-grad: linear-gradient(135deg, #f5e6b8, #d4a84b, #b8860b, #d4a84b);
  --gold-shine: linear-gradient(135deg, #d4a84b, #b8860b, #8b6914, #b8860b, #d4a84b);
  --shadow-neu: 6px 6px 12px rgba(0,0,0,0.4), -4px -4px 10px rgba(255,255,255,0.05);
}

body.dark-theme .card {
  background: var(--card);
}

body.dark-theme .form-input,
body.dark-theme .form-textarea {
  background: var(--bg);
  color: var(--text);
  border-color: var(--border);
}

body.dark-theme .btn-outline {
  border-color: var(--border);
  color: var(--text);
}

body.dark-theme .btn-outline:hover {
  background: rgba(255,255,255,0.05);
}
*/
