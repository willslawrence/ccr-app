/* ====================================
   VOTING PAGE - Firestore Dynamic Polls
   ==================================== */

// Legacy Q1 2026 poll data (Google Sheets)
const LEGACY_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLQa5a5OpGCuTRRa6Q6T3mL3EFS1-0iLrmE3BsgucdFUWkv2oW43ZZUWfigtHOFXnykQ/exec";
const LEGACY_MIN_VOTES = 6;
const LEGACY_FIXED_COSTS = { "Ridgy Vibrating Ball": 280, "Joyful Joseph": 5626, "Stan and Tasha": 750 };

const LEGACY_POLL = {
  title: "Q1 2026 Giving Allocation",
  closedDate: "March 2026",
  scriptUrl: LEGACY_SCRIPT_URL,
  minVotes: 6,
  fixedCosts: { "Ridgy Vibrating Ball": 280, "Joyful Joseph": 5626, "Stan and Tasha": 750 },
  categories: [
    { key: "cat1", name: "Church Planting", budget: 6140,
      options: ["Hope Village","Stan and Tasha","Radical","Save for Future Giving"] },
    { key: "cat2", name: "Orphans, Widows & Sojourners", budget: 6140,
      options: ["Crisis Aid International","Lifesong for Orphans","Send Relief","Save for Future Giving"] },
    { key: "cat3", name: "Persecuted Church", budget: 6140,
      options: ["Open Doors International","Global Christian Relief","Save for Future Giving"] },
    { key: "cat4", name: "Ministry of the Word & Global Church Needs", budget: 9210,
      options: ["Joyful Joseph","Ridgy Vibrating Ball","Save for Future Giving"] }
  ]
};

// State
let voteState = {
  activePolls: [],
  closedPolls: [],
  showNewPollForm: false,
  editingPollId: null,
  dataLoaded: false
};

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════
function voteSlugify(s) {
  return s.replace(/[^a-zA-Z0-9]/g, '_');
}

function voteAllocate(counts, budget) {
  const passing = {};
  const eliminated = {};
  for (const [name, votes] of Object.entries(counts)) {
    if (votes < LEGACY_MIN_VOTES) eliminated[name] = votes;
    else passing[name] = votes;
  }
  const totalPV = Object.values(passing).reduce((a, b) => a + b, 0);
  if (totalPV === 0) return { results: {}, eliminated };

  let results = {};
  for (const [name, votes] of Object.entries(passing)) {
    results[name] = { votes, amount: (votes / totalPV) * budget, capped: false };
  }

  // Iteratively cap fixed-cost items and redistribute surplus
  let changed = true;
  while (changed) {
    changed = false;
    let surplus = 0;
    for (const [name, r] of Object.entries(results)) {
      if (LEGACY_FIXED_COSTS[name] && !r.capped && r.amount > LEGACY_FIXED_COSTS[name]) {
        surplus += r.amount - LEGACY_FIXED_COSTS[name];
        r.amount = LEGACY_FIXED_COSTS[name];
        r.capped = true;
        changed = true;
      }
    }
    if (surplus > 0) {
      const uncapped = Object.entries(results).filter(([, r]) => !r.capped);
      const uv = uncapped.reduce((a, [, r]) => a + r.votes, 0);
      if (uv > 0) {
        uncapped.forEach(([name, r]) => { r.amount += (r.votes / uv) * surplus; });
      }
    }
  }
  for (const r of Object.values(results)) r.amount = Math.round(r.amount);
  return { results, eliminated };
}

function isPollActive(poll) {
  if (poll.status === 'closed') return false;
  const now = new Date();
  const start = poll.startDate ? poll.startDate.toDate() : null;
  const close = poll.closeDate ? poll.closeDate.toDate() : null;
  if (start && now < start) return false;
  if (close && now > close) return false;
  return true;
}

function isPollVotable(poll) {
  if (poll.status === 'closed') return false;
  const now = new Date();
  const start = poll.startDate ? poll.startDate.toDate() : null;
  const close = poll.closeDate ? poll.closeDate.toDate() : null;
  if (start && now < start) return false;
  if (close && now > close) return false;
  return true;
}

function getPollStatusText(poll) {
  if (poll.status === 'closed') return 'Closed';
  const now = new Date();
  const start = poll.startDate ? poll.startDate.toDate() : null;
  const close = poll.closeDate ? poll.closeDate.toDate() : null;
  if (start && now < start) return `Opens ${formatDate(start)}`;
  if (close && now > close) return 'Ended';
  if (close) return `Closes ${formatDate(close)}`;
  return 'Active';
}

// ═══════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════
async function loadPolls(forceRefresh = false) {
  if (voteState.dataLoaded && !forceRefresh) return;
  try {
    const snapshot = await db.collection('polls')
      .orderBy('createdAt', 'desc')
      .get();

    const polls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      startDate: doc.data().startDate?.toDate ? doc.data().startDate : null,
      closeDate: doc.data().closeDate?.toDate ? doc.data().closeDate : null
    }));

    // Separate active and closed polls
    voteState.activePolls = polls.filter(p => isPollActive(p));
    voteState.closedPolls = polls.filter(p => !isPollActive(p));
    voteState.dataLoaded = true;
  } catch (error) {
    console.error('Error loading polls:', error);
    voteState.activePolls = [];
    voteState.closedPolls = [];
  }
}

async function getUserVote(pollId) {
  const user = getCurrentUser();
  try {
    const doc = await db.collection('polls').doc(pollId).collection('votes').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error loading user vote:', error);
    return null;
  }
}

async function getVoteCounts(pollId) {
  try {
    const snapshot = await db.collection('polls').doc(pollId).collection('votes').get();
    const counts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      (data.selections || []).forEach(idx => {
        counts[idx] = (counts[idx] || 0) + 1;
      });
    });
    return { counts, totalVoters: snapshot.size };
  } catch (error) {
    console.error('Error loading vote counts:', error);
    return { counts: {}, totalVoters: 0 };
  }
}

// ═══════════════════════════════════════
// RENDER MAIN PAGE
// ═══════════════════════════════════════
function renderVotePage() {
  const user = getCurrentUser();
  const editor = isEditor();

  return `
    <div class="page vote-page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">🗳️ Voting</h1>
          <p class="page-subtitle">Vote on church matters · Finances, nominations, elections & more</p>
        </div>

        <div class="btn-group">
          <button class="btn btn-primary" data-votetab="active">🗳️ Active Polls</button>
          <button class="btn btn-outline" data-votetab="closed">📊 Past Polls</button>
          ${editor ? '<button class="btn btn-outline" data-votetab="legacy">📜 Legacy</button>' : ''}
        </div>

        ${editor ? '<button class="btn btn-primary" id="newPollBtn" style="margin-top:12px;width:100%;">+ New Poll</button>' : ''}
      </div>

      <!-- New Poll Form -->
      <div id="newPollForm" style="display:none;"></div>

      <!-- Active Polls Tab -->
      <div class="vote-tab-content" id="voteTabActive">
        <div id="activePollsList"></div>
      </div>

      <!-- Closed Polls Tab -->
      <div class="vote-tab-content hidden" id="voteTabClosed">
        <div id="closedPollsList"></div>
      </div>

      <!-- Legacy Poll Tab -->
      ${editor ? '<div class="vote-tab-content hidden" id="voteTabLegacy"><div id="legacyPollContent"></div></div>' : ''}

      <!-- Toast -->
      <div class="vote-toast" id="voteToast">✅ Vote Recorded!</div>
    </div>
  `;
}

// ═══════════════════════════════════════
// RENDER NEW POLL FORM
// ═══════════════════════════════════════
function renderNewPollForm() {
  const editing = voteState.editingPollId;
  const poll = editing ? [...voteState.activePolls, ...voteState.closedPolls].find(p => p.id === editing) : null;

  const title = poll ? poll.title : '';
  const options = poll ? poll.options : ['', ''];
  const multiChoice = poll ? poll.multiChoice : false;
  const passThreshold = poll ? poll.passThreshold : 50;
  const startDate = poll && poll.startDate ? (poll.startDate.toDate ? poll.startDate.toDate() : new Date(poll.startDate)).toISOString().slice(0, 16) : '';
  const closeDate = poll && poll.closeDate ? (poll.closeDate.toDate ? poll.closeDate.toDate() : new Date(poll.closeDate)).toISOString().slice(0, 16) : '';

  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-bottom:16px;">${editing ? 'Edit Poll' : 'Create New Poll'}</h3>
      <form id="pollFormElement">
        <div class="form-group">
          <label class="form-label">Poll Title *</label>
          <input type="text" class="form-input" id="pollTitle" placeholder="e.g., Board Member Election 2026" value="${escapeHtml(title)}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Options *</label>
          <div id="pollOptionsContainer">
            ${options.map((opt, i) => `
              <div class="poll-option-row" data-idx="${i}">
                <input type="text" class="form-input" placeholder="Option ${i + 1}" value="${escapeHtml(opt)}" data-option-idx="${i}">
                ${options.length > 2 ? `<button type="button" class="btn btn-outline poll-remove-opt" data-idx="${i}">×</button>` : ''}
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-outline" id="addOptionBtn" style="margin-top:8px;">+ Add Option</button>
        </div>

        <div class="form-checkbox">
          <input type="checkbox" id="pollMultiChoice" ${multiChoice ? 'checked' : ''}>
          <label>Allow multiple selections</label>
        </div>

        <div class="form-group">
          <label class="form-label">Pass Threshold (%) *</label>
          <input type="number" class="form-input" id="pollThreshold" min="0" max="100" value="${passThreshold}" required>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">Minimum percentage of votes needed to pass</div>
        </div>

        <div class="form-group">
          <label class="form-label">Start Date & Time</label>
          <input type="datetime-local" class="form-input" id="pollStartDate" value="${startDate}">
        </div>

        <div class="form-group">
          <label class="form-label">Close Date & Time</label>
          <input type="datetime-local" class="form-input" id="pollCloseDate" value="${closeDate}">
        </div>

        <div class="btn-group" style="margin-top:20px;">
          <button type="submit" class="btn btn-primary">${editing ? 'Save Changes' : 'Create Poll'}</button>
          <button type="button" class="btn btn-outline" id="cancelPollBtn">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// ═══════════════════════════════════════
// RENDER ACTIVE POLLS
// ═══════════════════════════════════════
async function renderActivePolls() {
  const container = document.getElementById('activePollsList');
  if (!container) return;

  if (voteState.activePolls.length === 0) {
    container.innerHTML = `
      <div class="card coming-soon-card">
        <div class="coming-soon-icon">🗳️</div>
        <h3>No Active Polls</h3>
        <p style="color: var(--muted); margin-top: 8px;">There are no polls open right now. Check Past Polls for previous results.</p>
      </div>`;
    return;
  }

  // Sort active polls by start date (newest first)
  const toMs = d => d ? (d.toDate ? d.toDate().getTime() : new Date(d).getTime()) : 0;
  const sorted = [...voteState.activePolls].sort((a, b) =>
    toMs(b.startDate || b.createdAt) - toMs(a.startDate || a.createdAt)
  );

  let html = '';
  for (const poll of sorted) {
    html += await renderPollCard(poll, true);
  }
  container.innerHTML = html;
}

// ═══════════════════════════════════════
// RENDER CLOSED POLLS
// ═══════════════════════════════════════
async function renderClosedPolls() {
  const container = document.getElementById('closedPollsList');
  if (!container) return;

  if (voteState.closedPolls.length === 0) {
    container.innerHTML = `
      <div class="card coming-soon-card">
        <div class="coming-soon-icon">📊</div>
        <h3>No Past Polls</h3>
        <p style="color: var(--muted); margin-top: 8px;">Past poll results will appear here when a poll is closed.</p>
      </div>`;
    return;
  }

  // Sort closed polls by close date (newest first)
  const toMs = d => d ? (d.toDate ? d.toDate().getTime() : new Date(d).getTime()) : 0;
  const sorted = [...voteState.closedPolls].sort((a, b) =>
    toMs(b.closeDate || b.createdAt) - toMs(a.closeDate || a.createdAt)
  );

  let html = '';
  for (const poll of sorted) {
    html += await renderPollCard(poll, false);
  }
  container.innerHTML = html;
}

// ═══════════════════════════════════════
// RENDER INDIVIDUAL POLL CARD
// ═══════════════════════════════════════
async function renderPollCard(poll, isActive) {
  const user = getCurrentUser();
  const editor = isEditor();
  const votable = isPollVotable(poll);
  const statusText = getPollStatusText(poll);

  // Load vote data
  const { counts, totalVoters } = await getVoteCounts(poll.id);
  const userVote = votable ? await getUserVote(poll.id) : null;
  const userSelections = userVote ? new Set(userVote.selections) : new Set();

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(counts), 1);

  let optionsHtml = '';
  poll.options.forEach((option, idx) => {
    const voteCount = counts[idx] || 0;
    const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
    const barWidth = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
    const meetsThreshold = parseFloat(percentage) >= poll.passThreshold;
    const isSelected = userSelections.has(idx);

    const canVote = votable && isActive;
    optionsHtml += `
      <div class="vote-poll-option ${!canVote ? 'vote-readonly' : ''} ${isSelected ? 'selected' : ''}"
           data-poll-id="${poll.id}"
           data-option-idx="${idx}"
           ${canVote ? `onclick="togglePollOption('${poll.id}', ${idx}, ${poll.multiChoice})"` : ''}>
        <div class="vote-opt-top">
          ${canVote ? '<div class="vote-checkmark"></div>' : ''}
          <div class="vote-opt-info">
            <div class="vote-opt-name">
              ${escapeHtml(option)}
              ${meetsThreshold ? '<span class="vote-tag vote-tag-passed">✓ Passed</span>' : ''}
            </div>
          </div>
          <div class="vote-opt-stats">
            <div class="vote-opt-votes">${voteCount}</div>
            <div class="vote-opt-percentage" style="font-size:11px;color:var(--muted);">${percentage}%</div>
          </div>
        </div>
        <div class="vote-bar-bg">
          <div class="vote-bar-fill ${meetsThreshold ? '' : 'below-threshold'}" style="width:${barWidth}%"></div>
          ${poll.passThreshold > 0 ? `<div class="vote-threshold-line" style="left:${poll.passThreshold}%"></div>` : ''}
        </div>
      </div>
    `;
  });

  const editorControls = editor ? `
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="btn btn-outline" style="font-size:11px;padding:6px 12px;" onclick="togglePollStatus('${poll.id}')">${poll.status === 'active' ? '🔒 Close' : '🔓 Reopen'}</button>
      <button class="btn btn-outline" style="font-size:11px;padding:6px 12px;" onclick="editPoll('${poll.id}')">✏️ Edit</button>
      <button class="btn btn-outline" style="font-size:11px;padding:6px 12px;color:var(--red);" onclick="deletePoll('${poll.id}')">🗑️ Delete</button>
    </div>
  ` : '';

  return `
    <div class="card vote-poll-card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
        <div style="flex:1;">
          <h3 style="margin:0;font-size:16px;color:var(--gold);">${escapeHtml(poll.title)}</h3>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">
            ${statusText} · ${totalVoters} ${totalVoters === 1 ? 'vote' : 'votes'}
          </div>
        </div>
        ${!isActive ? '<span class="vote-tag vote-tag-closed">🔒 Closed</span>' : ''}
      </div>

      ${userVote && isActive ? '<div class="vote-user-voted">✓ You voted</div>' : ''}

      ${optionsHtml}

      ${userVote && votable && isActive ? `
        <button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="changeVote('${poll.id}')">Change Vote</button>
      ` : ''}

      ${!userVote && votable && isActive ? `
        <button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="submitVote('${poll.id}', ${poll.multiChoice})">Submit Vote</button>
      ` : ''}

      ${editorControls}
    </div>
  `;
}

// ═══════════════════════════════════════
// LEGACY POLL RENDERING
// ═══════════════════════════════════════
function renderLegacyPoll() {
  const container = document.getElementById('legacyPollContent');
  if (!container) return;

  const catCards = renderVoteCategoryCards(LEGACY_POLL.categories, LEGACY_POLL.fixedCosts, 'legacy-', true);
  container.innerHTML = `
    <div class="card vote-past-header">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; color:var(--gold);">${escapeHtml(LEGACY_POLL.title)}</h3>
          <div style="color:var(--muted); font-size:0.85rem; margin-top:4px;">Closed · ${escapeHtml(LEGACY_POLL.closedDate)}</div>
        </div>
        <span class="vote-tag vote-tag-closed">🔒 Closed</span>
      </div>
    </div>
    <div class="vote-voter-count card">
      Total votes submitted: <strong id="voteLegacyTotal">—</strong>
    </div>
    ${catCards}
  `;

  loadLegacyPollData();
}

function renderVoteCategoryCards(categories, fixedCosts, prefix, readOnly) {
  let catHtml = '';
  categories.forEach(cat => {
    let optsHtml = '';
    cat.options.forEach(opt => {
      const isSave = opt === "Save for Future Giving";
      const isFixed = fixedCosts[opt];
      const slug = voteSlugify(opt);
      optsHtml += `
        <div class="vote-opt-row vote-readonly">
          <div class="vote-opt-top">
            <div class="vote-opt-info">
              <div class="vote-opt-name">${isSave ? '🏦 ' : ''}${escapeHtml(opt)}
                <span class="vote-tag-inline" id="vtag-${prefix}${cat.key}-${slug}"></span>
              </div>
              ${isFixed ? `<div class="vote-opt-note">Fixed cost: SAR ${fixedCosts[opt].toLocaleString()}</div>` : ''}
            </div>
            <div class="vote-opt-stats">
              <div class="vote-opt-votes" id="vvotes-${prefix}${cat.key}-${slug}">0</div>
              <div class="vote-opt-amount" id="vamt-${prefix}${cat.key}-${slug}"></div>
            </div>
          </div>
          <div class="vote-bar-bg"><div class="vote-bar-fill" id="vbar-${prefix}${cat.key}-${slug}" style="width:0%"></div></div>
        </div>`;
    });

    catHtml += `
      <div class="card vote-category-card" id="vcard-${prefix}${cat.key}">
        <h3 class="vote-cat-name">${escapeHtml(cat.name)}</h3>
        <div class="vote-cat-budget">Budget: SAR ${cat.budget.toLocaleString()} · Min ${LEGACY_MIN_VOTES} votes to qualify</div>
        ${optsHtml}
      </div>`;
  });
  return catHtml;
}

async function loadLegacyPollData() {
  try {
    const resp = await fetch(LEGACY_SCRIPT_URL);
    const data = await resp.json();

    const totalEl = document.getElementById('voteLegacyTotal');
    if (totalEl) totalEl.textContent = data.totalVoters;

    const prefix = 'legacy-';

    LEGACY_POLL.categories.forEach(cat => {
      const counts = data[cat.key] || {};
      const maxVotes = Math.max(...Object.values(counts), 1);
      const { results, eliminated } = voteAllocate(counts, cat.budget);

      cat.options.forEach(opt => {
        const s = voteSlugify(opt);
        const votes = counts[opt] || 0;
        const isElim = eliminated.hasOwnProperty(opt);
        const result = results[opt];
        const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
        const isSave = opt === "Save for Future Giving";

        const votesEl = document.getElementById(`vvotes-${prefix}${cat.key}-${s}`);
        if (votesEl) votesEl.textContent = votes;

        const amtEl = document.getElementById(`vamt-${prefix}${cat.key}-${s}`);
        const tagEl = document.getElementById(`vtag-${prefix}${cat.key}-${s}`);
        if (amtEl && tagEl) {
          if (result) {
            amtEl.textContent = `SAR ${result.amount.toLocaleString()}`;
            amtEl.className = 'vote-opt-amount';
            tagEl.innerHTML = result.capped ? '<span class="vote-tag vote-tag-cap">🎉 Amount Reached</span>' : '';
          } else if (isElim && votes > 0) {
            amtEl.textContent = 'Threshold not reached';
            amtEl.className = 'vote-opt-amount vote-eliminated';
            tagEl.innerHTML = `<span class="vote-tag vote-tag-elim">&lt;${LEGACY_MIN_VOTES} votes</span>`;
          } else {
            amtEl.textContent = '';
            tagEl.innerHTML = '';
          }
        }

        const barEl = document.getElementById(`vbar-${prefix}${cat.key}-${s}`);
        if (barEl) {
          barEl.style.width = pct + '%';
          barEl.className = 'vote-bar-fill' + (isElim ? ' eliminated' : (isSave ? ' green' : ''));
        }
      });
    });
  } catch (err) {
    console.error('Failed to load legacy poll data:', err);
  }
}

// ═══════════════════════════════════════
// VOTING INTERACTIONS
// ═══════════════════════════════════════
function togglePollOption(pollId, optionIdx, multiChoice) {
  const options = document.querySelectorAll(`.vote-poll-option[data-poll-id="${pollId}"]`);
  const clicked = document.querySelector(`.vote-poll-option[data-poll-id="${pollId}"][data-option-idx="${optionIdx}"]`);

  if (!multiChoice) {
    // Single choice: unselect all others
    options.forEach(opt => opt.classList.remove('selected'));
  }

  clicked.classList.toggle('selected');
}

async function submitVote(pollId, multiChoice) {
  const user = getCurrentUser();
  const selected = document.querySelectorAll(`.vote-poll-option[data-poll-id="${pollId}"].selected`);

  if (selected.length === 0) {
    alert('Please select at least one option');
    return;
  }

  if (!multiChoice && selected.length > 1) {
    alert('Please select only one option');
    return;
  }

  const selections = Array.from(selected).map(el => parseInt(el.dataset.optionIdx));

  try {
    await db.collection('polls').doc(pollId).collection('votes').doc(user.uid).set({
      odcId: user.uid,
      selections,
      votedAt: firebase.firestore.Timestamp.now()
    });

    // Show toast
    const toast = document.getElementById('voteToast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Reload polls and re-render
    await loadPolls(true);
    renderActivePolls();
  } catch (error) {
    console.error('Error submitting vote:', error);
    alert('Failed to submit vote. Please try again.');
  }
}

async function changeVote(pollId) {
  const user = getCurrentUser();
  if (!confirm('Change your vote? Your previous selection will be replaced.')) return;

  try {
    await db.collection('polls').doc(pollId).collection('votes').doc(user.uid).delete();
    await loadPolls(true);
    renderActivePolls();
  } catch (error) {
    console.error('Error changing vote:', error);
    alert('Failed to change vote. Please try again.');
  }
}

// ═══════════════════════════════════════
// POLL MANAGEMENT (EDITORS)
// ═══════════════════════════════════════
async function createOrUpdatePoll(e) {
  e.preventDefault();
  const user = getCurrentUser();

  const title = document.getElementById('pollTitle').value.trim();
  const optionInputs = document.querySelectorAll('#pollOptionsContainer input[data-option-idx]');
  const options = Array.from(optionInputs).map(input => input.value.trim()).filter(opt => opt);
  const multiChoice = document.getElementById('pollMultiChoice').checked;
  const passThreshold = parseFloat(document.getElementById('pollThreshold').value);
  const startDateStr = document.getElementById('pollStartDate').value;
  const closeDateStr = document.getElementById('pollCloseDate').value;

  if (!title || options.length < 2) {
    alert('Please provide a title and at least 2 options');
    return;
  }

  const pollData = {
    title,
    options,
    multiChoice,
    passThreshold,
    startDate: startDateStr ? firebase.firestore.Timestamp.fromDate(new Date(startDateStr)) : null,
    closeDate: closeDateStr ? firebase.firestore.Timestamp.fromDate(new Date(closeDateStr)) : null,
    status: 'active'
  };

  try {
    if (voteState.editingPollId) {
      await db.collection('polls').doc(voteState.editingPollId).update(pollData);
    } else {
      pollData.createdBy = user.uid;
      pollData.createdAt = firebase.firestore.Timestamp.now();
      await db.collection('polls').add(pollData);
    }

    voteState.showNewPollForm = false;
    voteState.editingPollId = null;
    document.getElementById('newPollForm').style.display = 'none';
    await loadPolls(true);
    renderActivePolls();
    renderClosedPolls();
  } catch (error) {
    console.error('Error creating/updating poll:', error);
    alert('Failed to save poll. Please try again.');
  }
}

async function togglePollStatus(pollId) {
  const poll = [...voteState.activePolls, ...voteState.closedPolls].find(p => p.id === pollId);
  if (!poll) return;

  const newStatus = poll.status === 'active' ? 'closed' : 'active';
  try {
    await db.collection('polls').doc(pollId).update({ status: newStatus });
    await loadPolls(true);
    renderActivePolls();
    renderClosedPolls();
  } catch (error) {
    console.error('Error toggling poll status:', error);
    alert('Failed to update poll status. Please try again.');
  }
}

function editPoll(pollId) {
  voteState.editingPollId = pollId;
  voteState.showNewPollForm = true;
  const formContainer = document.getElementById('newPollForm');
  formContainer.innerHTML = renderNewPollForm();
  formContainer.style.display = 'block';
  setupPollFormHandlers();
  document.getElementById('pollTitle').scrollIntoView({ behavior: 'smooth' });
}

async function deletePoll(pollId) {
  if (!confirm('Delete this poll? This cannot be undone.')) return;

  try {
    // Delete all votes first
    const votes = await db.collection('polls').doc(pollId).collection('votes').get();
    const batch = db.batch();
    votes.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Delete poll
    await db.collection('polls').doc(pollId).delete();
    await loadPolls(true);
    renderActivePolls();
    renderClosedPolls();
  } catch (error) {
    console.error('Error deleting poll:', error);
    alert('Failed to delete poll. Please try again.');
  }
}

// ═══════════════════════════════════════
// POLL FORM HANDLERS
// ═══════════════════════════════════════
function setupPollFormHandlers() {
  const form = document.getElementById('pollFormElement');
  const addOptionBtn = document.getElementById('addOptionBtn');
  const cancelBtn = document.getElementById('cancelPollBtn');

  if (form) {
    form.addEventListener('submit', createOrUpdatePoll);
  }

  if (addOptionBtn) {
    addOptionBtn.addEventListener('click', () => {
      const container = document.getElementById('pollOptionsContainer');
      const currentOptions = container.querySelectorAll('.poll-option-row');
      const newIdx = currentOptions.length;
      const newRow = document.createElement('div');
      newRow.className = 'poll-option-row';
      newRow.dataset.idx = newIdx;
      newRow.innerHTML = `
        <input type="text" class="form-input" placeholder="Option ${newIdx + 1}" data-option-idx="${newIdx}">
        <button type="button" class="btn btn-outline poll-remove-opt" data-idx="${newIdx}">×</button>
      `;
      container.appendChild(newRow);
      setupRemoveOptionHandlers();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      voteState.showNewPollForm = false;
      voteState.editingPollId = null;
      document.getElementById('newPollForm').style.display = 'none';
    });
  }

  setupRemoveOptionHandlers();
}

function setupRemoveOptionHandlers() {
  document.querySelectorAll('.poll-remove-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('.poll-option-row');
      if (row) row.remove();
    });
  });
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
async function initVotePage() {
  await loadPolls();

  // Tab switching
  document.querySelectorAll('[data-votetab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.votetab;
      document.querySelectorAll('[data-votetab]').forEach(b => {
        b.className = 'btn ' + (b.dataset.votetab === tab ? 'btn-primary' : 'btn-outline');
      });
      document.getElementById('voteTabActive').classList.toggle('hidden', tab !== 'active');
      document.getElementById('voteTabClosed').classList.toggle('hidden', tab !== 'closed');
      const legacyTab = document.getElementById('voteTabLegacy');
      if (legacyTab) legacyTab.classList.toggle('hidden', tab !== 'legacy');

      // Load legacy data when switching to legacy tab
      if (tab === 'legacy') {
        renderLegacyPoll();
      }
    });
  });

  // New poll button
  const newPollBtn = document.getElementById('newPollBtn');
  if (newPollBtn) {
    newPollBtn.addEventListener('click', () => {
      voteState.showNewPollForm = !voteState.showNewPollForm;
      voteState.editingPollId = null;
      const formContainer = document.getElementById('newPollForm');
      if (voteState.showNewPollForm) {
        formContainer.innerHTML = renderNewPollForm();
        formContainer.style.display = 'block';
        setupPollFormHandlers();
      } else {
        formContainer.style.display = 'none';
      }
    });
  }

  // Render initial content
  await renderActivePolls();
  await renderClosedPolls();
}
