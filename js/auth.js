/* ====================================
   AUTHENTICATION (Mock for now)
   ==================================== */

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
            <input type="password" class="form-input" id="loginPassword" placeholder="••••••••" required>
          </div>
          <div id="loginError" class="form-error" style="display:none;"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Sign In</button>
        </form>

        <p style="margin-top:20px;font-size:13px;color:var(--muted);">
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
              <input type="password" class="form-input" id="signupPassword" placeholder="••••••••" required>
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
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('ccr_users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      errorEl.textContent = 'No account found with this email.';
      errorEl.style.display = 'block';
      return;
    }

    if (user.password !== password) {
      errorEl.textContent = 'Incorrect password.';
      errorEl.style.display = 'block';
      return;
    }

    // Login successful
    const userSession = {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role
    };

    AppState.currentUser = userSession;
    localStorage.setItem('ccr_user', JSON.stringify(userSession));
    navigateTo('prayer');
  });

  // Signup form submit
  signupFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('ccr_users') || '[]');

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      errorEl.textContent = 'An account with this email already exists.';
      errorEl.style.display = 'block';
      return;
    }

    // Create new user
    const newUser = {
      uid: 'user_' + Date.now(),
      name,
      email,
      password,
      role: users.length === 0 ? 'admin' : 'member' // First user is admin
    };

    users.push(newUser);
    localStorage.setItem('ccr_users', JSON.stringify(users));

    // Auto-login
    const userSession = {
      uid: newUser.uid,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    AppState.currentUser = userSession;
    localStorage.setItem('ccr_user', JSON.stringify(userSession));
    navigateTo('prayer');
  });
}

function logout() {
  AppState.currentUser = null;
  localStorage.removeItem('ccr_user');
  navigateTo('login');
}
