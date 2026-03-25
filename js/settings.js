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
              <div class="text-muted" style="font-size:12px;margin-bottom:2px;">Username</div>
              <div style="font-weight:500;font-size:14px;">${escapeHtml(user.username || user.email?.replace('@ccr.app', '') || '')}</div>
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

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;font-size:16px;">📱 Phone Number</h3>
        <div id="phoneNumberStatus" style="margin-bottom:12px;"></div>
        <div id="phoneLinkSection" style="display:none;">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-input" id="linkPhoneNumber" placeholder="+966512345678" style="margin-bottom:8px;">
            <p style="font-size:11px;color:var(--muted);margin-top:4px;">Include country code (e.g., +966)</p>
          </div>
          <div id="linkPhoneRecaptcha"></div>
          <div id="phoneError" class="form-error" style="display:none;"></div>
          <button class="btn btn-primary" id="sendPhoneCodeBtn" style="width:100%;">Send Verification Code</button>

          <div id="phoneVerifySection" style="display:none;margin-top:16px;">
            <div class="form-group">
              <label class="form-label">Verification Code</label>
              <input type="text" class="form-input" id="phoneVerificationCode" placeholder="123456">
            </div>
            <button class="btn btn-primary" id="verifyPhoneLinkBtn" style="width:100%;">Verify & Link</button>
          </div>
        </div>
        <div id="phoneResetSection" style="display:none;">
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">Reset your password using your linked phone number</p>
          <div id="resetPhoneRecaptcha"></div>
          <button class="btn btn-outline" id="resetPasswordViaPhoneBtn" style="width:100%;">Reset Password via Phone</button>

          <div id="resetVerifySection" style="display:none;margin-top:16px;">
            <div class="form-group">
              <label class="form-label">Verification Code</label>
              <input type="text" class="form-input" id="resetVerificationCode" placeholder="123456">
            </div>
            <button class="btn btn-primary" id="verifyResetCodeBtn" style="width:100%;">Verify Code</button>
          </div>

          <div id="newPasswordSection" style="display:none;margin-top:16px;">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" class="form-input" id="newPasswordInput" placeholder="••••••••">
            </div>
            <button class="btn btn-primary" id="updatePasswordBtn" style="width:100%;">Update Password</button>
          </div>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-top:8px;">
          Link your phone number to enable sign-in and password reset via SMS
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
  setupPhoneNumberLinking();
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

/* ====================================
   PHONE NUMBER LINKING
   ==================================== */

function setupPhoneNumberLinking() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const phoneStatusEl = document.getElementById('phoneNumberStatus');
  const phoneLinkSection = document.getElementById('phoneLinkSection');
  const phoneResetSection = document.getElementById('phoneResetSection');
  const sendCodeBtn = document.getElementById('sendPhoneCodeBtn');
  const verifyLinkBtn = document.getElementById('verifyPhoneLinkBtn');
  const phoneVerifySection = document.getElementById('phoneVerifySection');
  const phoneErrorEl = document.getElementById('phoneError');

  let phoneLinkRecaptchaVerifier = null;
  let phoneConfirmationResult = null;

  // Check if user has phone number linked
  function checkPhoneLinked() {
    const hasPhone = user.providerData.some(provider => provider.providerId === 'phone');

    if (hasPhone) {
      const phoneNumber = user.providerData.find(p => p.providerId === 'phone')?.phoneNumber || 'Unknown';
      phoneStatusEl.innerHTML = `<span style="color:var(--green);font-weight:500;">✅ Phone linked: ${phoneNumber}</span>`;
      phoneLinkSection.style.display = 'none';
      phoneResetSection.style.display = 'block';
    } else {
      phoneStatusEl.innerHTML = '<span style="color:var(--muted);font-weight:500;">📱 No phone number linked</span>';
      phoneLinkSection.style.display = 'block';
      phoneResetSection.style.display = 'none';

      // Initialize reCAPTCHA for phone linking
      if (!phoneLinkRecaptchaVerifier) {
        try {
          phoneLinkRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('linkPhoneRecaptcha', {
            size: 'normal',
            callback: () => {
              console.log('reCAPTCHA verified for phone linking');
            }
          });
          phoneLinkRecaptchaVerifier.render();
        } catch (e) {
          console.error('reCAPTCHA initialization error:', e);
        }
      }
    }
  }

  checkPhoneLinked();

  // Send verification code
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async () => {
      const phoneNumber = document.getElementById('linkPhoneNumber').value.trim();

      if (!phoneNumber) {
        phoneErrorEl.textContent = 'Please enter a phone number';
        phoneErrorEl.style.display = 'block';
        return;
      }

      try {
        const provider = new firebase.auth.PhoneAuthProvider();
        const verificationId = await provider.verifyPhoneNumber(phoneNumber, phoneLinkRecaptchaVerifier);
        phoneConfirmationResult = verificationId;
        phoneVerifySection.style.display = 'block';
        phoneErrorEl.style.display = 'none';
        sendCodeBtn.textContent = 'Code Sent!';
        sendCodeBtn.disabled = true;
      } catch (error) {
        console.error('Phone verification error:', error);
        phoneErrorEl.textContent = error.message || 'Failed to send verification code';
        phoneErrorEl.style.display = 'block';
      }
    });
  }

  // Verify and link phone
  if (verifyLinkBtn) {
    verifyLinkBtn.addEventListener('click', async () => {
      const code = document.getElementById('phoneVerificationCode').value.trim();

      if (!code) {
        phoneErrorEl.textContent = 'Please enter the verification code';
        phoneErrorEl.style.display = 'block';
        return;
      }

      try {
        const credential = firebase.auth.PhoneAuthProvider.credential(phoneConfirmationResult, code);
        await user.linkWithCredential(credential);
        phoneErrorEl.style.display = 'none';
        alert('Phone number linked successfully!');
        checkPhoneLinked(); // Refresh UI
      } catch (error) {
        console.error('Phone linking error:', error);
        phoneErrorEl.textContent = error.message || 'Invalid verification code';
        phoneErrorEl.style.display = 'block';
      }
    });
  }

  // Password reset via phone
  setupPasswordResetViaPhone();
}

function setupPasswordResetViaPhone() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const resetBtn = document.getElementById('resetPasswordViaPhoneBtn');
  const resetVerifySection = document.getElementById('resetVerifySection');
  const newPasswordSection = document.getElementById('newPasswordSection');
  const verifyResetCodeBtn = document.getElementById('verifyResetCodeBtn');
  const updatePasswordBtn = document.getElementById('updatePasswordBtn');
  const phoneErrorEl = document.getElementById('phoneError');

  let resetRecaptchaVerifier = null;
  let resetConfirmationResult = null;

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const phoneNumber = user.providerData.find(p => p.providerId === 'phone')?.phoneNumber;

      if (!phoneNumber) {
        alert('No phone number linked to this account.');
        return;
      }

      try {
        // Initialize reCAPTCHA for reset
        if (!resetRecaptchaVerifier) {
          resetRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('resetPhoneRecaptcha', {
            size: 'normal',
            callback: () => {
              console.log('reCAPTCHA verified for password reset');
            }
          });
          resetRecaptchaVerifier.render();
        }

        const provider = new firebase.auth.PhoneAuthProvider();
        const verificationId = await provider.verifyPhoneNumber(phoneNumber, resetRecaptchaVerifier);
        resetConfirmationResult = verificationId;
        resetVerifySection.style.display = 'block';
        phoneErrorEl.style.display = 'none';
        resetBtn.textContent = 'Code Sent!';
        resetBtn.disabled = true;
      } catch (error) {
        console.error('Password reset error:', error);
        phoneErrorEl.textContent = error.message || 'Failed to send verification code';
        phoneErrorEl.style.display = 'block';
      }
    });
  }

  if (verifyResetCodeBtn) {
    verifyResetCodeBtn.addEventListener('click', async () => {
      const code = document.getElementById('resetVerificationCode').value.trim();

      if (!code) {
        phoneErrorEl.textContent = 'Please enter the verification code';
        phoneErrorEl.style.display = 'block';
        return;
      }

      try {
        const credential = firebase.auth.PhoneAuthProvider.credential(resetConfirmationResult, code);
        await user.reauthenticateWithCredential(credential);
        phoneErrorEl.style.display = 'none';
        newPasswordSection.style.display = 'block';
        resetVerifySection.style.display = 'none';
      } catch (error) {
        console.error('Verification error:', error);
        phoneErrorEl.textContent = 'Invalid verification code';
        phoneErrorEl.style.display = 'block';
      }
    });
  }

  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
      const newPassword = document.getElementById('newPasswordInput').value;

      if (!newPassword || newPassword.length < 6) {
        phoneErrorEl.textContent = 'Password must be at least 6 characters';
        phoneErrorEl.style.display = 'block';
        return;
      }

      try {
        await user.updatePassword(newPassword);
        phoneErrorEl.style.display = 'none';
        alert('Password updated successfully!');
        newPasswordSection.style.display = 'none';
        // Reset UI
        document.getElementById('resetPasswordViaPhoneBtn').disabled = false;
        document.getElementById('resetPasswordViaPhoneBtn').textContent = 'Reset Password via Phone';
      } catch (error) {
        console.error('Password update error:', error);
        phoneErrorEl.textContent = error.message || 'Failed to update password';
        phoneErrorEl.style.display = 'block';
      }
    });
  }
}
