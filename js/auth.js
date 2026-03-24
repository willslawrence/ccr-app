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
        <p class="page-subtitle" style="margin-bottom:40px;">Community Church App</p>

        <form id="loginForm" style="text-align:left;">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="loginEmail" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div style="position:relative;">
              <input type="password" class="form-input" id="loginPassword" placeholder="••••••••" required style="padding-right:48px;">
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

        <div id="signupForm" style="display:none;margin-top:40px;text-align:left;">
          <h2 style="font-size:20px;margin-bottom:20px;">Create Account</h2>
          <form id="signupFormElement">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="signupName" placeholder="Your Name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="signupEmail" placeholder="your@email.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div style="position:relative;">
                <input type="password" class="form-input" id="signupPassword" placeholder="••••••••" required style="padding-right:48px;">
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

  // Forgot password
  document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const errorEl = document.getElementById('loginError');
    if (!email) {
      errorEl.textContent = 'Enter your email above, then tap "Forgot password?"';
      errorEl.style.display = 'block';
      return;
    }
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      errorEl.style.display = 'none';
      alert('Password reset email sent to ' + email + '. Check your inbox.');
    } catch (error) {
      errorEl.textContent = error.message || 'Failed to send reset email.';
      errorEl.style.display = 'block';
    }
  });

  // Show signup form
  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    showSignup.parentElement.style.display = 'none';
    signupFormDiv.style.display = 'block';
  });

  // Back to login
  backToLogin.addEventListener('click', () => {
    signupFormDiv.style.display = 'none';
    loginForm.style.display = 'block';
    showSignup.parentElement.style.display = 'block';
  });

  // Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Login error:', error);
      errorEl.textContent = error.message || 'Login failed. Please try again.';
      errorEl.style.display = 'block';
    }
  });

  // Signup form submit
  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');

    try {
      // Create Firebase Auth account first (so we're authenticated for Firestore reads)
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Now check if this is the first user (admin) — requires auth
      const usersSnapshot = await db.collection('users').limit(1).get();
      const isFirstUser = usersSnapshot.empty;
      const role = isFirstUser ? 'admin' : 'member';

      // Update Firebase Auth profile with displayName
      await user.updateProfile({ displayName: name });

      // Create Firestore user document
      await db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        role: role,
        createdAt: firebase.firestore.Timestamp.now()
      });

      console.log('User created:', user.uid, 'Role:', role);
      // Auth state change will handle navigation
    } catch (error) {
      console.error('Signup error:', error);
      errorEl.textContent = error.message || 'Signup failed. Please try again.';
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
