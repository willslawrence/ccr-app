/* ====================================
   AUTHENTICATION with Firebase Auth
   ==================================== */

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

function renderLoginPage() {
  return `
    <div class="page" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div style="max-width:400px;width:100%;text-align:center;">
        <h1 class="page-title" style="font-size:48px;margin-bottom:8px;">CCR</h1>
        <p class="page-subtitle" style="margin-bottom:40px;">Christ Church R</p>

        <form id="loginForm" style="text-align:left;">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" id="loginUsername" placeholder="username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div style="position:relative;">
              <input type="password" class="form-input" id="loginPassword" placeholder="••••••••" required style="padding-right:48px;" autocomplete="current-password">
              <button type="button" class="show-pw-btn" onclick="togglePassword('loginPassword', this)">Show</button>
            </div>
          </div>
          <div id="loginError" class="form-error" style="display:none;"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Sign In</button>
        </form>

        <p style="margin-top:12px;font-size:13px;color:var(--muted);">
          <a href="#" id="forgotPassword" style="color:var(--accent);">Forgot password?</a>
        </p>
        <p style="margin-top:12px;font-size:13px;color:var(--muted);">
          Don't have an account? <a href="#" id="showSignup" style="color:var(--accent);font-weight:600;">Create one</a>
        </p>
        <p style="margin-top:12px;font-size:13px;color:var(--muted);">
          <a href="#" id="showPhoneLogin" style="color:var(--accent);">Sign in with phone number</a>
        </p>

        <div id="phoneLoginForm" style="display:none;margin-top:40px;text-align:left;">
          <h2 style="font-size:20px;margin-bottom:20px;">Sign In with Phone</h2>
          <form id="phoneLoginFormElement">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" id="phoneLoginNumber" placeholder="+966512345678" required>
            </div>
            <div id="phoneLoginRecaptcha"></div>
            <div id="phoneLoginError" class="form-error" style="display:none;"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Send Code</button>
            <button type="button" class="btn btn-outline" id="backToLoginFromPhone" style="width:100%;margin-top:12px;">Back to Login</button>
          </form>
          <div id="phoneVerificationSection" style="display:none;margin-top:20px;">
            <div class="form-group">
              <label class="form-label">Verification Code</label>
              <input type="text" class="form-input" id="phoneVerificationCode" placeholder="123456" required>
            </div>
            <button class="btn btn-primary" id="verifyPhoneCodeBtn" style="width:100%;">Verify Code</button>
          </div>
        </div>

        <div id="signupForm" style="display:none;margin-top:40px;text-align:left;">
          <h2 style="font-size:20px;margin-bottom:20px;">Create Account</h2>
          <form id="signupFormElement">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="signupUsername" placeholder="username" required autocomplete="username">
              <p style="font-size:11px;color:var(--muted);margin-top:4px;">Must be pre-approved by admin</p>
            </div>
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="signupName" placeholder="Your Name" required autocomplete="name">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div style="position:relative;">
                <input type="password" class="form-input" id="signupPassword" placeholder="••••••••" required style="padding-right:48px;" autocomplete="new-password">
                <button type="button" class="show-pw-btn" onclick="togglePassword('signupPassword', this)">Show</button>
              </div>
            </div>
            <div id="signupError" class="form-error" style="display:none;"></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Create Account</button>
            <button type="button" class="btn btn-outline" id="backToLogin" style="width:100%;margin-top:12px;">Back to Login</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const signupFormElement = document.getElementById('signupFormElement');
  const showSignup = document.getElementById('showSignup');
  const backToLogin = document.getElementById('backToLogin');
  const signupFormDiv = document.getElementById('signupForm');
  const phoneLoginFormDiv = document.getElementById('phoneLoginForm');
  const showPhoneLogin = document.getElementById('showPhoneLogin');
  const backToLoginFromPhone = document.getElementById('backToLoginFromPhone');

  let phoneLoginRecaptchaVerifier = null;
  let phoneConfirmationResult = null;

  // Forgot password
  document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = 'Contact admin or use phone number to reset password.';
    errorEl.style.display = 'block';
    errorEl.style.color = 'var(--accent)';
  });

  // Show signup form
  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    showSignup.parentElement.style.display = 'none';
    showSignup.parentElement.previousElementSibling.style.display = 'none'; // Hide phone login link
    signupFormDiv.style.display = 'block';
  });

  // Back to login from signup
  backToLogin.addEventListener('click', () => {
    signupFormDiv.style.display = 'none';
    loginForm.style.display = 'block';
    showSignup.parentElement.style.display = 'block';
    showSignup.parentElement.previousElementSibling.style.display = 'block';
  });

  // Show phone login form
  showPhoneLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    showSignup.parentElement.style.display = 'none';
    showSignup.parentElement.previousElementSibling.style.display = 'none';
    showPhoneLogin.parentElement.style.display = 'none';
    phoneLoginFormDiv.style.display = 'block';

    // Initialize reCAPTCHA for phone login
    if (!phoneLoginRecaptchaVerifier) {
      phoneLoginRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('phoneLoginRecaptcha', {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA verified');
        }
      });
      phoneLoginRecaptchaVerifier.render();
    }
  });

  // Back to login from phone login
  backToLoginFromPhone.addEventListener('click', () => {
    phoneLoginFormDiv.style.display = 'none';
    document.getElementById('phoneVerificationSection').style.display = 'none';
    loginForm.style.display = 'block';
    showSignup.parentElement.style.display = 'block';
    showSignup.parentElement.previousElementSibling.style.display = 'block';
    showPhoneLogin.parentElement.style.display = 'block';
  });

  // Login form submit (username-based)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    // Append @ccr.app domain to username
    const email = username + '@ccr.app';

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Login error:', error);
      errorEl.textContent = 'Invalid username or password.';
      errorEl.style.display = 'block';
      errorEl.style.color = 'var(--red)';
    }
  });

  // Phone login form submit
  document.getElementById('phoneLoginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phoneNumber = document.getElementById('phoneLoginNumber').value.trim();
    const errorEl = document.getElementById('phoneLoginError');

    try {
      phoneConfirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, phoneLoginRecaptchaVerifier);
      document.getElementById('phoneVerificationSection').style.display = 'block';
      errorEl.style.display = 'none';
    } catch (error) {
      console.error('Phone login error:', error);
      errorEl.textContent = error.message || 'Failed to send verification code.';
      errorEl.style.display = 'block';
    }
  });

  // Verify phone code
  document.getElementById('verifyPhoneCodeBtn').addEventListener('click', async () => {
    const code = document.getElementById('phoneVerificationCode').value.trim();
    const errorEl = document.getElementById('phoneLoginError');

    try {
      await phoneConfirmationResult.confirm(code);
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Phone verification error:', error);
      errorEl.textContent = 'Invalid verification code.';
      errorEl.style.display = 'block';
    }
  });

  // Signup form submit (username whitelist)
  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim().toLowerCase();
    const name = document.getElementById('signupName').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');

    try {
      // Check if username is in the approvedMembers collection
      const approvedMemberDoc = await db.collection('approvedMembers').doc(username).get();

      if (!approvedMemberDoc.exists) {
        errorEl.textContent = 'Username not approved. Contact admin.';
        errorEl.style.display = 'block';
        return;
      }

      const approvedMember = approvedMemberDoc.data();
      const email = username + '@ccr.app';

      // Create Firebase Auth account
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile with displayName
      await user.updateProfile({ displayName: name });

      // Create Firestore user document with role from approvedMembers
      await db.collection('users').doc(user.uid).set({
        name: name,
        username: username,
        email: email,
        role: approvedMember.role,
        createdAt: firebase.firestore.Timestamp.now()
      });

      console.log('User created:', user.uid, 'Username:', username, 'Role:', approvedMember.role);
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        errorEl.textContent = 'This username is already registered. Try logging in.';
      } else {
        errorEl.textContent = error.message || 'Signup failed. Please try again.';
      }
      errorEl.style.display = 'block';
    }
  });
}

async function logout() {
  try {
    await firebase.auth().signOut();
    AppState.currentUser = null;
    navigateTo('login');
  } catch (error) {
    console.error('Logout error:', error);
    alert('Failed to sign out. Please try again.');
  }
}
