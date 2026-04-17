/* ====================================
   TOOLS PAGE
   ==================================== */

function renderToolsPage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <div>
            <h1 class="page-title">🛠️ Tools</h1>
            <p class="page-subtitle">Handy utilities</p>
          </div>
        </div>
      </div>

      <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">

        <!-- Timer Card -->
        <div class="card" id="vote-card" style="cursor:pointer;" onclick="navigateTo('vote')">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;background:var(--gold-shine);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">🗳️</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:16px;margin-bottom:2px;">Voting</div>
              <div style="font-size:13px;color:var(--muted);">Vote on church decisions</div>
            </div>
            <div style="color:var(--muted);font-size:20px;">›</div>
          </div>
        </div>

        <!-- Timer Card -->
        <div class="card" id="timer-card" style="cursor:pointer;" onclick="openTimerOverlay()">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;background:var(--gold-shine);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">⏱️</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:16px;margin-bottom:2px;">Countdown Timer</div>
              <div style="font-size:13px;color:var(--muted);">Set a countdown for meetings or events</div>
            </div>
            <div style="color:var(--muted);font-size:20px;">›</div>
          </div>
        </div>

      </div>
    </div>

    <!-- Timer Overlay -->
    <div id="timer-overlay" style="display:none;position:fixed;inset:0;z-index:1000;flex-direction:column;align-items:center;justify-content:center;">
      <button id="timer-close-btn" onclick="closeTimerOverlay()" style="position:fixed;top:16px;right:16px;width:44px;height:44px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:rgba(255,255,255,0.5);z-index:1003;transition:opacity 0.3s;">
        ✕
      </button>
      <button id="timer-fs-btn" onclick="timerEnterFullscreen()" style="position:fixed;top:16px;left:16px;width:44px;height:44px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(255,255,255,0.5);z-index:1003;transition:opacity 0.3s;" title="Fullscreen">
        ⛶
      </button>
      <div id="timer-content" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        ${renderTimerDisplay()}
      </div>
      <div id="timer-done-screen" style="display:none;flex-direction:column;align-items:center;justify-content:center;position:fixed;inset:0;z-index:1002;opacity:0;transition:opacity 0.7s ease-out;">
        <div id="timer-done-title" style="font-size:clamp(2rem,10vw,5rem);color:#c9a84c;font-family:Georgia,serif;letter-spacing:0.05em;margin-bottom:0.3em;">Starting Now</div>
        <div id="timer-countup" style="font-size:clamp(1.2rem,6vw,3rem);color:#e84040;font-family:Georgia,serif;letter-spacing:0.1em;">+0:00</div>
      </div>
    </div>
  `;
}

function renderTimerDisplay() {
  return `
    <div id="timer-clock" style="display:flex;align-items:center;gap:4px;">
      <div class="timer-unit" id="timer-mt" onclick="timerTapDigit('mt', event)">0</div>
      <div class="timer-unit" id="timer-mo" onclick="timerTapDigit('mo', event)">0</div>
      <div class="timer-colon">:</div>
      <div class="timer-unit" id="timer-st" onclick="timerTapDigit('st', event)">0</div>
      <div class="timer-unit" id="timer-so" onclick="timerTapDigit('so', event)">0</div>
    </div>
    <div id="timer-keys-hint" style="margin-top:12px;font-size:12px;color:#444;letter-spacing:0.05em;text-align:center;">
      ↑↓ ±10s &nbsp;|&nbsp; ←→ ±1min &nbsp;|&nbsp; 1-9 set min &nbsp;|&nbsp; Space pause &nbsp;|&nbsp; R reset
    </div>
  `;
}

// ── Timer State ───────────────────────────────────────────────────────────────
var timerTotal = 5 * 60;
var timerInterval = null;
var timerCountup = null;
var timerCountupTotal = 0;
var timerParticles = [];
var timerRaf = null;
var timerDone = false; // tracks if countdown has finished

function timerGet() {
  return {
    mt: Math.floor(timerTotal / 600) % 6,
    mo: Math.floor(timerTotal / 60) % 10,
    st: Math.floor(timerTotal % 60 / 10),
    so: timerTotal % 10
  };
}

function timerSet(field, val) { document.getElementById('timer-' + field).textContent = val; }

function timerRender() {
  var v = timerGet();
  timerSet('mt', v.mt); timerSet('mo', v.mo); timerSet('st', v.st); timerSet('so', v.so);
}

function timerTick() {
  if (timerTotal <= 0) {
    clearInterval(timerInterval); timerInterval = null;
    timerBurst();
    return;
  }
  timerTotal--;
  timerRender();
}

function timerResetAndStart(newTotal) {
  // Stop everything
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (timerCountup) { clearInterval(timerCountup); timerCountup = null; timerCountupTotal = 0; }
  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }
  timerParticles = [];
  timerDone = false;

  // Reset total
  timerTotal = (newTotal !== undefined) ? newTotal : 5 * 60;

  // Hide done screen, show clock
  var doneScreen = document.getElementById('timer-done-screen');
  if (doneScreen) {
    doneScreen.style.display = 'none';
    doneScreen.classList.remove('fade-in');
  }
  var clock = document.getElementById('timer-clock');
  if (clock) { clock.style.display = 'flex'; clock.style.opacity = '1'; }

  // Restore digit opacity
  ['mt','mo','st','so'].forEach(function(id) {
    var el = document.getElementById('timer-' + id);
    if (el) el.style.opacity = '1';
  });
  var colon = document.querySelector('.timer-colon');
  if (colon) colon.style.opacity = '0.45';

  // Remove burst canvas
  var canvas = document.getElementById('timer-burst-canvas');
  if (canvas) canvas.remove();

  timerRender();
  timerInterval = setInterval(timerTick, 1000);
}

function timerTapDigit(field, e) {
  var el = document.getElementById('timer-' + field);
  var rect = el.getBoundingClientRect();
  var y = e.clientY || (e.touches && e.touches[0].clientY);
  var dir = y < rect.top + rect.height / 2 ? 1 : -1;
  if (field === 'mt' || field === 'mo') timerTotal += dir * 60;
  else timerTotal += dir * 10;
  timerTotal = Math.max(0, Math.min(5999, timerTotal));
  timerRender();
}

// ── Keyboard Controls ──────────────────────────────────────────────────────────
function timerOnKeyDown(e) {
  var key = e.key;

  if (key >= '1' && key <= '9') {
    timerResetAndStart(parseInt(key) * 60);
    return;
  }
  if (key === '0') {
    timerTotal += 10; timerTotal = Math.min(5999, timerTotal); timerRender(); return;
  }
  if (key === 'ArrowUp') { e.preventDefault(); timerTotal += 10; timerTotal = Math.min(5999, timerTotal); timerRender(); return; }
  if (key === 'ArrowDown') { e.preventDefault(); timerTotal -= 10; timerTotal = Math.max(0, timerTotal); timerRender(); return; }
  if (key === 'ArrowRight') { e.preventDefault(); timerTotal += 60; timerTotal = Math.min(5999, timerTotal); timerRender(); return; }
  if (key === 'ArrowLeft') { e.preventDefault(); timerTotal -= 60; timerTotal = Math.max(0, timerTotal); timerRender(); return; }
  if (key === ' ') {
    e.preventDefault();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    else if (timerTotal > 0 && !timerDone) { timerInterval = setInterval(timerTick, 1000); }
    return;
  }
  if (key === 'r' || key === 'R') {
    timerResetAndStart();
    return;
  }
}

// ── Fullscreen ────────────────────────────────────────────────────────────────
function timerEnterFullscreen() {
  var el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function timerUpdateFullscreenUI() {
  var isFS = !!document.fullscreenElement;
  var closeBtn = document.getElementById('timer-close-btn');
  var fsBtn = document.getElementById('timer-fs-btn');
  if (closeBtn) closeBtn.style.opacity = isFS ? '0' : '1';
  if (fsBtn) fsBtn.style.opacity = isFS ? '0' : '1';
}

// ── Canvas Burst ─────────────────────────────────────────────────────────────
function timerBurst() {
  timerDone = true;

  var ids = ['mt','mo','st','so'];
  ids.forEach(function(id) {
    var el = document.getElementById('timer-' + id);
    if (el) el.style.opacity = '0';
  });
  var colon = document.querySelector('.timer-colon');
  if (colon) colon.style.opacity = '0';

  // Canvas
  var canvas = document.createElement('canvas');
  canvas.id = 'timer-burst-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1001;';
  document.getElementById('timer-overlay').appendChild(canvas);
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var positions = ids.map(function(id) {
    var el = document.getElementById('timer-' + id);
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  var colonEl = document.querySelector('.timer-colon');
  if (colonEl) {
    var cr = colonEl.getBoundingClientRect();
    positions.push({ x: cr.left + cr.width / 2, y: cr.top + cr.height / 2 });
  }

  function Particle(x, y, vx, vy, len, rot, rotSpeed) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.len = len; this.rot = rot; this.rotSpeed = rotSpeed; this.alpha = 1;
  }
  var realParticles = [];
  for (var i = 0; i < 300; i++) {
    var pos = positions[i % positions.length];
    var angle = Math.random() * Math.PI * 2;
    var speed = 6 + Math.random() * 18;
    var len = 30 + Math.random() * 90;
    realParticles.push(new Particle(pos.x, pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, len, Math.random() * Math.PI, (Math.random() - 0.5) * 0.15));
  }

  function animateTimerParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    realParticles = realParticles.filter(function(p) { return p.alpha > 0; });
    realParticles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.985; p.alpha -= 0.012; p.rot += p.rotSpeed;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      var grad = ctx.createLinearGradient(-p.len / 2, 0, p.len / 2, 0);
      grad.addColorStop(0, 'rgba(201,168,76,0)');
      grad.addColorStop(0.3, 'rgba(232,208,144,0.9)');
      grad.addColorStop(0.7, 'rgba(201,168,76,1)');
      grad.addColorStop(1, 'rgba(201,168,76,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-p.len / 2, -1.2, p.len, 2.4, 1.2);
      ctx.fill();
      ctx.restore();
    });
    if (realParticles.length > 0) timerRaf = requestAnimationFrame(animateTimerParticles);
    else { cancelAnimationFrame(timerRaf); timerRaf = null; }
  }
  animateTimerParticles();

  // Show done screen with fade-in
  setTimeout(function() {
    var clock = document.getElementById('timer-clock');
    if (clock) clock.style.display = 'none';
    var doneScreen = document.getElementById('timer-done-screen');
    if (doneScreen) {
      doneScreen.style.display = 'flex';
      // Fade in
      requestAnimationFrame(function() {
        doneScreen.classList.add('fade-in');
      });
      timerCountup = setInterval(function() {
        timerCountupTotal++;
        var m = Math.floor(timerCountupTotal / 60);
        var s = timerCountupTotal % 60;
        document.getElementById('timer-countup').textContent = '+' + m + ':' + String(s).padStart(2, '0');
      }, 1000);
    }
  }, 1500);
}

// ── Overlay open/close ───────────────────────────────────────────────────────
function openTimerOverlay() {
  var overlay = document.getElementById('timer-overlay');
  overlay.style.display = 'flex';
  timerResetAndStart();
  document.addEventListener('keydown', timerOnKeyDown);
  document.addEventListener('fullscreenchange', timerUpdateFullscreenUI);
  timerUpdateFullscreenUI();
}

function closeTimerOverlay() {
  var overlay = document.getElementById('timer-overlay');
  overlay.style.display = 'none';
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (timerCountup) { clearInterval(timerCountup); timerCountup = null; timerCountupTotal = 0; }
  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }
  document.removeEventListener('keydown', timerOnKeyDown);
  document.removeEventListener('fullscreenchange', timerUpdateFullscreenUI);
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    var el = document.documentElement;
    if (el.exitFullscreen) el.exitFullscreen();
    else if (el.webkitExitFullscreen) el.webkitExitFullscreen();
  }
}
