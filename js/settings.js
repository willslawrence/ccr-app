/* ====================================
   SETTINGS PAGE
   ==================================== */

function renderSettingsPage() {
  const user = getCurrentUser();

  return `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">⚙️ Settings</h1>
        <p class="page-subtitle">Manage your preferences and account</p>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;">Profile</h3>
        <div style="display:grid;gap:12px;">
          <div>
            <div class="text-muted" style="font-size:13px;margin-bottom:4px;">Name</div>
            <div style="font-weight:500;">${escapeHtml(user.name)}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:13px;margin-bottom:4px;">Email</div>
            <div style="font-weight:500;">${escapeHtml(user.email)}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size:13px;margin-bottom:4px;">Role</div>
            <div>
              ${user.role === 'admin' ? '<span class="badge" style="background:var(--purple);color:white;">Admin</span>' : ''}
              ${user.role === 'editor' ? '<span class="badge" style="background:var(--blue);color:white;">Editor</span>' : ''}
              ${user.role === 'member' ? '<span class="badge" style="background:var(--green);color:white;">Member</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;">Appearance</h3>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:500;margin-bottom:4px;">Dark Mode</div>
            <div class="text-muted" style="font-size:13px;">Toggle between light and dark theme</div>
          </div>
          <label class="theme-toggle">
            <input type="checkbox" id="themeToggle">
            <span class="theme-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;">About</h3>
        <div style="display:grid;gap:8px;font-size:14px;">
          <div><strong>App Name:</strong> CCR Church App</div>
          <div><strong>Version:</strong> 1.0.0</div>
          <div><strong>Build:</strong> ${new Date().getFullYear()}.03</div>
        </div>
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
}

function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('ccr_theme') || 'light';

  // Set initial state
  toggle.checked = currentTheme === 'dark';

  // Listen for changes
  toggle.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
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
