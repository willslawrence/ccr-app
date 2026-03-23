/* ====================================
   VOTING PAGE
   General-purpose polling system
   Supports multiple active polls, Firestore-backed
   ==================================== */

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let votePolls = [];          // All polls from Firestore
let voteMyVotes = {};        // { pollId: Set of selected option indices }
let voteRefreshInterval = null;
let voteLastPollCount = 0;   // For new-poll notification detection

// ═══════════════════════════════════════
// FIRESTORE HELPERS
// ═══════════════════════════════════════
function votePollsRef() {
  return db.collection('polls');
}

async function voteLoadPolls() {
  try {
    const snap = await votePollsRef().orderBy('createdAt', 'desc').get();
    votePolls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Detect new polls for notification
    const activeCount = votePolls.filter(p => p.status === 'active').length;
    if (voteLastPollCount > 0 && activeCount > voteLastPollCount) {
      voteShowToast('🗳️ New poll available!');
    }
    voteLastPollCount = activeCount;

    voteRenderContent();
  } catch (err) {
    console.error('Failed to load polls:', err);
  }
}

async function voteSubmitVote(pollId) {
  const poll = votePolls.find(p => p.id === pollId);
  if (!poll || poll.status !== 'active') return;

  const nameInput = document.getElementById(`voterName-${pollId}`);
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--red)';
    setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
    return;
  }

  const selections = voteMyVotes[pollId] || new Set();
  if (selections.size === 0) {
    voteShowToast('⚠️ Select at least one option');
    return;
  }

  const btn = document.getElementById(`voteSubmitBtn-${pollId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

  try {
    // Record vote as sub-document
    await db.collection('polls').doc(pollId).collection('votes').add({
      name,
      selections: Array.from(selections),
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update aggregate counts on the poll doc
    const updates = {};
    selections.forEach(idx => {
      updates[`results.${idx}`] = firebase.firestore.FieldValue.increment(1);
    });
    updates.totalVoters = firebase.firestore.FieldValue.increment(1);
    await db.collection('polls').doc(pollId).update(updates);

    voteMyVotes[pollId] = new Set();
    nameInput.value = '';
    voteShowToast('✅ Vote Recorded!');
    await voteLoadPolls();
  } catch (err) {
    console.error('Vote submit error:', err);
    alert('Error submitting vote. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Vote'; }
  }
}

async function voteArchivePoll(pollId) {
  if (!confirm('Archive this poll? No further votes will be accepted.')) return;
  try {
    await db.collection('polls').doc(pollId).update({ status: 'archived' });
    voteShowToast('📦 Poll archived');
    await voteLoadPolls();
  } catch (err) {
    console.error('Archive error:', err);
    alert('Failed to archive poll.');
  }
}

async function voteCreatePoll(title, description, options) {
  try {
    const results = {};
    options.forEach((_, i) => { results[i] = 0; });

    await votePollsRef().add({
      title,
      description,
      options,
      results,
      totalVoters: 0,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: AppState.currentUser ? AppState.currentUser.name : 'Unknown'
    });
    voteShowToast('🗳️ Poll created!');
    await voteLoadPolls();
  } catch (err) {
    console.error('Create poll error:', err);
    alert('Failed to create poll.');
  }
}

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
function renderVotePage() {
  return `
    <div class="page vote-page">
      <div class="page-sticky-banner">
        <h1 class="page-title">Voting</h1>
        <p class="page-subtitle">Church polls &amp; decisions</p>

        <div class="btn-group" style="margin-bottom:0;">
          <button class="btn btn-primary" data-votetab="current">🗳️ Current Polls</button>
          <button class="btn btn-outline" data-votetab="past">📊 Past Polls</button>
          ${isAdmin() ? '<button class="btn btn-outline" data-votetab="new">+ New Poll</button>' : ''}
        </div>
      </div>

      <div id="voteContent"></div>

      <!-- Toast -->
      <div class="vote-toast" id="voteToast">✅</div>
    </div>
  `;
}

function voteRenderContent() {
  const content = document.getElementById('voteContent');
  if (!content) return;

  const activeTab = document.querySelector('[data-votetab].btn-primary');
  const tab = activeTab ? activeTab.dataset.votetab : 'current';

  if (tab === 'current') {
    content.innerHTML = voteRenderCurrentPolls();
    voteBindPollEvents();
  } else if (tab === 'past') {
    content.innerHTML = voteRenderPastPolls();
  } else if (tab === 'new') {
    content.innerHTML = voteRenderNewPollForm();
    voteBindNewPollForm();
  }
}

function voteRenderCurrentPolls() {
  const active = votePolls.filter(p => p.status === 'active');
  if (active.length === 0) {
    return `
      <div class="card coming-soon-card" style="text-align:center;padding:40px 20px;">
        <div style="font-size:48px;margin-bottom:12px;">🗳️</div>
        <h3 style="margin-bottom:8px;">No Current Polls</h3>
        <p style="color:var(--muted);font-size:14px;">There are no active polls right now. Check back later!</p>
      </div>
    `;
  }

  return active.map(poll => voteRenderPollCard(poll, false)).join('');
}

function voteRenderPastPolls() {
  const archived = votePolls.filter(p => p.status === 'archived');
  if (archived.length === 0) {
    return `
      <div class="card coming-soon-card" style="text-align:center;padding:40px 20px;">
        <div style="font-size:48px;margin-bottom:12px;">📊</div>
        <h3 style="margin-bottom:8px;">No Past Polls</h3>
        <p style="color:var(--muted);font-size:14px;">Archived polls will appear here.</p>
      </div>
    `;
  }

  return archived.map(poll => voteRenderPollCard(poll, true)).join('');
}

function voteRenderPollCard(poll, isArchived) {
  const options = poll.options || [];
  const results = poll.results || {};
  const totalVoters = poll.totalVoters || 0;
  const maxVotes = Math.max(...Object.values(results).map(Number), 1);

  let optionsHtml = options.map((opt, i) => {
    const votes = Number(results[i] || 0);
    const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
    const selected = voteMyVotes[poll.id] && voteMyVotes[poll.id].has(i);

    return `
      <div class="vote-opt-row ${selected ? 'selected' : ''} ${isArchived ? 'vote-locked' : ''}"
           data-pollid="${escapeHtml(poll.id)}" data-optidx="${i}">
        <div class="vote-opt-top">
          ${!isArchived ? '<div class="vote-checkmark"></div>' : ''}
          <div class="vote-opt-info">
            <div class="vote-opt-name">${escapeHtml(opt)}</div>
          </div>
          <div class="vote-opt-stats">
            <div class="vote-opt-votes">${votes}</div>
          </div>
        </div>
        <div class="vote-bar-bg"><div class="vote-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');

  const createdDate = poll.createdAt ? new Date(poll.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return `
    <div class="card vote-poll-card">
      <div class="vote-poll-header">
        <h3 class="vote-poll-title">${escapeHtml(poll.title)}</h3>
        ${isArchived ? '<span class="vote-badge vote-badge-archived">Archived</span>' : '<span class="vote-badge vote-badge-active">Active</span>'}
      </div>
      ${poll.description ? `<p class="vote-poll-desc">${escapeHtml(poll.description)}</p>` : ''}
      <div class="vote-poll-meta">
        ${createdDate ? `<span>${createdDate}</span>` : ''}
        <span>·</span>
        <span>${totalVoters} vote${totalVoters !== 1 ? 's' : ''}</span>
      </div>

      ${optionsHtml}

      ${!isArchived ? `
        <div class="vote-name-section" style="margin-top:12px;">
          <input type="text" class="form-input vote-name-input" id="voterName-${escapeHtml(poll.id)}" placeholder="Your name or pseudonym" autocomplete="name">
        </div>
        <button class="btn vote-submit-btn" id="voteSubmitBtn-${escapeHtml(poll.id)}" data-pollid="${escapeHtml(poll.id)}">Submit Vote</button>
      ` : ''}

      ${!isArchived && isAdmin() ? `
        <button class="btn btn-outline vote-archive-btn" data-archiveid="${escapeHtml(poll.id)}" style="margin-top:8px;width:100%;color:var(--muted);border-color:var(--border);">📦 Archive Poll</button>
      ` : ''}
    </div>
  `;
}

function voteRenderNewPollForm() {
  return `
    <div class="card" style="padding:20px;">
      <h3 style="margin-bottom:16px;">Create New Poll</h3>
      <div style="margin-bottom:12px;">
        <label class="form-label">Poll Title</label>
        <input type="text" class="form-input" id="newPollTitle" placeholder="e.g. Charity Allocation Q2 2026">
      </div>
      <div style="margin-bottom:12px;">
        <label class="form-label">Description (optional)</label>
        <input type="text" class="form-input" id="newPollDesc" placeholder="Brief description of the poll">
      </div>
      <div style="margin-bottom:12px;">
        <label class="form-label">Options</label>
        <div id="newPollOptions">
          <div class="vote-option-input-row">
            <input type="text" class="form-input" placeholder="Option 1" data-optnum="1">
          </div>
          <div class="vote-option-input-row">
            <input type="text" class="form-input" placeholder="Option 2" data-optnum="2">
          </div>
        </div>
        <button class="btn btn-outline" id="addPollOption" style="margin-top:8px;font-size:13px;">+ Add Option</button>
      </div>
      <button class="btn btn-primary" id="createPollBtn" style="width:100%;margin-top:8px;">Create Poll</button>
    </div>
  `;
}

// ═══════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════
function voteBindPollEvents() {
  // Option toggle
  document.querySelectorAll('.vote-opt-row:not(.vote-locked)').forEach(row => {
    row.addEventListener('click', () => {
      const pollId = row.dataset.pollid;
      const idx = parseInt(row.dataset.optidx);
      if (!voteMyVotes[pollId]) voteMyVotes[pollId] = new Set();
      if (voteMyVotes[pollId].has(idx)) {
        voteMyVotes[pollId].delete(idx);
        row.classList.remove('selected');
      } else {
        voteMyVotes[pollId].add(idx);
        row.classList.add('selected');
      }
    });
  });

  // Submit buttons
  document.querySelectorAll('.vote-submit-btn[data-pollid]').forEach(btn => {
    btn.addEventListener('click', () => voteSubmitVote(btn.dataset.pollid));
  });

  // Archive buttons
  document.querySelectorAll('.vote-archive-btn').forEach(btn => {
    btn.addEventListener('click', () => voteArchivePoll(btn.dataset.archiveid));
  });
}

function voteBindNewPollForm() {
  let optCount = 2;

  const addBtn = document.getElementById('addPollOption');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      optCount++;
      const container = document.getElementById('newPollOptions');
      const row = document.createElement('div');
      row.className = 'vote-option-input-row';
      row.innerHTML = `<input type="text" class="form-input" placeholder="Option ${optCount}" data-optnum="${optCount}">`;
      container.appendChild(row);
    });
  }

  const createBtn = document.getElementById('createPollBtn');
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const title = document.getElementById('newPollTitle').value.trim();
      const desc = document.getElementById('newPollDesc').value.trim();
      const opts = [];
      document.querySelectorAll('#newPollOptions input').forEach(inp => {
        const v = inp.value.trim();
        if (v) opts.push(v);
      });

      if (!title) {
        document.getElementById('newPollTitle').focus();
        return;
      }
      if (opts.length < 2) {
        voteShowToast('⚠️ Add at least 2 options');
        return;
      }

      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      await voteCreatePoll(title, desc, opts);

      // Switch to current tab
      document.querySelectorAll('[data-votetab]').forEach(b => {
        b.className = 'btn ' + (b.dataset.votetab === 'current' ? 'btn-primary' : 'btn-outline');
      });
      voteRenderContent();
      createBtn.disabled = false;
      createBtn.textContent = 'Create Poll';
    });
  }
}

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
function voteShowToast(msg) {
  const toast = document.getElementById('voteToast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
function initVotePage() {
  // Tab switching
  document.querySelectorAll('[data-votetab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.votetab;
      document.querySelectorAll('[data-votetab]').forEach(b => {
        b.className = 'btn ' + (b.dataset.votetab === tab ? 'btn-primary' : 'btn-outline');
      });
      voteRenderContent();
    });
  });

  // Load polls
  voteMyVotes = {};
  voteLoadPolls();

  // Auto-refresh every 30s
  if (voteRefreshInterval) clearInterval(voteRefreshInterval);
  voteRefreshInterval = setInterval(voteLoadPolls, 30000);
}
