/* ====================================
   GIVING VOTE PAGE
   Approval voting for charity allocations
   Ported from giving-vote-reference.html
   ==================================== */

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLQa5a5OpGCuTRRa6Q6T3mL3EFS1-0iLrmE3BsgucdFUWkv2oW43ZZUWfigtHOFXnykQ/exec";
const MIN_VOTES = 6;
const FIXED_COSTS = { "Ridgy Vibrating Ball": 280, "Joyful Joseph": 5626, "Stan and Tasha": 750 };

// Active poll — set to null when no poll is active
const ACTIVE_POLL = null;

// Archive of closed polls
const PAST_POLLS = [
  {
    title: "Q1 2026 Giving Allocation",
    closedDate: "March 2026",
    scriptUrl: SCRIPT_URL,
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
  }
];

// Current active categories (used by active poll logic)
const CATEGORIES = ACTIVE_POLL ? ACTIVE_POLL.categories : [];

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let voteServerCounts = {};
let voteMySelections = {};
let voteServerTotalVoters = 0;
let voteRefreshInterval = null;

function voteInitState() {
  CATEGORIES.forEach(c => {
    voteServerCounts[c.key] = {};
    voteMySelections[c.key] = new Set();
  });
}
voteInitState();

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function voteSlugify(s) {
  return s.replace(/[^a-zA-Z0-9]/g, '_');
}

function voteAllocate(counts, budget) {
  const passing = {};
  const eliminated = {};
  for (const [name, votes] of Object.entries(counts)) {
    if (votes < MIN_VOTES) eliminated[name] = votes;
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
      if (FIXED_COSTS[name] && !r.capped && r.amount > FIXED_COSTS[name]) {
        surplus += r.amount - FIXED_COSTS[name];
        r.amount = FIXED_COSTS[name];
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

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
function renderVoteCategoryCards(categories, fixedCosts, prefix, readOnly) {
  let catHtml = '';
  categories.forEach(cat => {
    let optsHtml = '';
    cat.options.forEach(opt => {
      const isSave = opt === "Save for Future Giving";
      const isFixed = fixedCosts[opt];
      const slug = voteSlugify(opt);
      optsHtml += `
        <div class="vote-opt-row ${isSave ? 'vote-save-opt' : ''}${readOnly ? ' vote-readonly' : ''}" ${readOnly ? '' : `data-cat="${escapeHtml(cat.key)}" data-opt="${escapeHtml(opt)}"`}>
          <div class="vote-opt-top">
            ${readOnly ? '' : '<div class="vote-checkmark"></div>'}
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
        <div class="vote-cat-budget">Budget: SAR ${cat.budget.toLocaleString()} · Min ${fixedCosts._minVotes || MIN_VOTES} votes to qualify</div>
        ${optsHtml}
      </div>`;
  });
  return catHtml;
}

function renderPastPolls() {
  if (PAST_POLLS.length === 0) {
    return `
      <div class="card coming-soon-card">
        <div class="coming-soon-icon">📊</div>
        <h3>No Past Polls</h3>
        <p style="color: var(--muted); margin-top: 8px;">Past poll results will appear here when a poll is closed.</p>
      </div>`;
  }

  return PAST_POLLS.map((poll, idx) => {
    const prefix = `past${idx}-`;
    const catCards = renderVoteCategoryCards(poll.categories, poll.fixedCosts, prefix, true);
    return `
      <div class="vote-past-poll" data-past-idx="${idx}" data-past-url="${poll.scriptUrl}">
        <div class="card vote-past-header">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div>
              <h3 style="margin:0; color:var(--gold);">${escapeHtml(poll.title)}</h3>
              <div style="color:var(--muted); font-size:0.85rem; margin-top:4px;">Closed · ${escapeHtml(poll.closedDate)}</div>
            </div>
            <span class="vote-tag vote-tag-closed">🔒 Closed</span>
          </div>
        </div>
        <div class="vote-voter-count card">
          Total votes submitted: <strong id="votePastTotal-${idx}">—</strong>
        </div>
        ${catCards}
      </div>`;
  }).join('');
}

function renderVotePage() {
  let activeContent;
  if (ACTIVE_POLL) {
    const catHtml = renderVoteCategoryCards(CATEGORIES, FIXED_COSTS, '', false);
    activeContent = `
      <div class="card vote-name-section">
        <label class="form-label">Name or Pseudonym</label>
        <div class="vote-hint">Pre-filled from your account — change it if you prefer a pseudonym</div>
        <input type="text" class="form-input vote-name-input" id="voterName" placeholder="Name or pseudonym" autocomplete="name">
      </div>
      <div class="vote-voter-count card">
        Total votes submitted: <strong id="voteTotalVoters">—</strong>
      </div>
      ${catHtml}`;
  } else {
    activeContent = `
      <div class="card coming-soon-card">
        <div class="coming-soon-icon">🗳️</div>
        <h3>No Active Poll</h3>
        <p style="color: var(--muted); margin-top: 8px;">There's no poll open right now. Check Past Polls for previous results.</p>
      </div>`;
  }

  return `
    <div class="page vote-page">
      <h1 class="page-title">Giving Vote</h1>
      <p class="page-subtitle">Approval voting · Select options you support in each category</p>

      <div class="btn-group">
        <button class="btn ${ACTIVE_POLL ? 'btn-primary' : 'btn-outline'}" data-votetab="active">🗳️ Active Poll</button>
        <button class="btn ${ACTIVE_POLL ? 'btn-outline' : 'btn-primary'}" data-votetab="past">📊 Past Polls</button>
      </div>

      <!-- Active Poll Tab -->
      <div class="vote-tab-content ${ACTIVE_POLL ? '' : 'hidden'}" id="voteTabActive">
        ${activeContent}
      </div>

      <!-- Past Polls Tab -->
      <div class="vote-tab-content ${ACTIVE_POLL ? 'hidden' : ''}" id="voteTabPast">
        ${renderPastPolls()}
      </div>

      <!-- Fixed submit bar (hidden when no active poll) -->
      <div class="vote-submit-wrap ${ACTIVE_POLL ? '' : 'hidden'}" id="voteSubmitWrap">
        <button class="btn vote-submit-btn" id="voteSubmitBtn">Submit Vote</button>
      </div>

      <!-- Toast -->
      <div class="vote-toast" id="voteToast">✅ Vote Recorded!</div>
    </div>
  `;
}

// ═══════════════════════════════════════
// DISPLAY UPDATE
// ═══════════════════════════════════════
function voteUpdateDisplay() {
  CATEGORIES.forEach(cat => {
    const merged = {};
    cat.options.forEach(opt => {
      merged[opt] = (voteServerCounts[cat.key][opt] || 0) + (voteMySelections[cat.key].has(opt) ? 1 : 0);
    });
    const maxVotes = Math.max(...Object.values(merged), 1);
    const { results, eliminated } = voteAllocate(merged, cat.budget);

    cat.options.forEach(opt => {
      const s = voteSlugify(opt);
      const votes = merged[opt] || 0;
      const isElim = eliminated.hasOwnProperty(opt);
      const result = results[opt];
      const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
      const isSave = opt === "Save for Future Giving";

      const votesEl = document.getElementById(`vvotes-${cat.key}-${s}`);
      if (votesEl) votesEl.textContent = votes;

      const amtEl = document.getElementById(`vamt-${cat.key}-${s}`);
      const tagEl = document.getElementById(`vtag-${cat.key}-${s}`);
      if (amtEl && tagEl) {
        if (result) {
          amtEl.textContent = `SAR ${result.amount.toLocaleString()}`;
          amtEl.className = 'vote-opt-amount';
          tagEl.innerHTML = result.capped ? '<span class="vote-tag vote-tag-cap">🎉 Amount Reached</span>' : '';
        } else if (isElim && votes > 0) {
          amtEl.textContent = 'Threshold not reached';
          amtEl.className = 'vote-opt-amount vote-eliminated';
          tagEl.innerHTML = `<span class="vote-tag vote-tag-elim">&lt;${MIN_VOTES} votes</span>`;
        } else {
          amtEl.textContent = '';
          tagEl.innerHTML = '';
        }
      }

      const barEl = document.getElementById(`vbar-${cat.key}-${s}`);
      if (barEl) {
        barEl.style.width = pct + '%';
        barEl.className = 'vote-bar-fill' + (isElim ? ' eliminated' : (isSave ? ' green' : ''));
      }
    });
  });

  // Total voters
  const hasSelections = CATEGORIES.some(c => voteMySelections[c.key].size > 0);
  const totalEl = document.getElementById('voteTotalVoters');
  if (totalEl) totalEl.textContent = voteServerTotalVoters + (hasSelections ? 1 : 0);
}

// ═══════════════════════════════════════
// SERVER COMMUNICATION
// ═══════════════════════════════════════
async function voteLoadResults() {
  try {
    const resp = await fetch(SCRIPT_URL);
    const data = await resp.json();
    voteServerTotalVoters = data.totalVoters;
    CATEGORIES.forEach(cat => {
      voteServerCounts[cat.key] = data[cat.key] || {};
    });
    voteUpdateDisplay();
  } catch (err) {
    console.error('Failed to load vote results:', err);
  }
}

async function voteSubmit() {
  const nameInput = document.getElementById('voterName');
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--red)';
    setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
    return;
  }

  const btn = document.getElementById('voteSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  const votes = {};
  CATEGORIES.forEach(cat => {
    votes[cat.key] = Array.from(voteMySelections[cat.key]);
  });

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ name, votes }),
      mode: 'no-cors'
    });

    // Move selections into server counts
    CATEGORIES.forEach(cat => {
      voteMySelections[cat.key].forEach(opt => {
        voteServerCounts[cat.key][opt] = (voteServerCounts[cat.key][opt] || 0) + 1;
      });
      voteMySelections[cat.key] = new Set();
    });
    voteServerTotalVoters++;

    // Reset UI
    document.querySelectorAll('.vote-opt-row.selected').forEach(el => el.classList.remove('selected'));
    nameInput.value = '';
    voteUpdateDisplay();

    // Toast
    const toast = document.getElementById('voteToast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit Vote';
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit Vote';
    }
    alert('Error submitting vote. Please try again.');
    console.error(err);
  }
}

// ═══════════════════════════════════════
// PAST POLL DATA LOADING
// ═══════════════════════════════════════
async function voteLoadPastPollResults(poll, idx) {
  try {
    const resp = await fetch(poll.scriptUrl);
    const data = await resp.json();

    const totalEl = document.getElementById(`votePastTotal-${idx}`);
    if (totalEl) totalEl.textContent = data.totalVoters;

    const prefix = `past${idx}-`;
    const minVotes = poll.minVotes || MIN_VOTES;

    poll.categories.forEach(cat => {
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
            tagEl.innerHTML = `<span class="vote-tag vote-tag-elim">&lt;${minVotes} votes</span>`;
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
    console.error(`Failed to load past poll ${idx}:`, err);
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
      document.getElementById('voteTabActive').classList.toggle('hidden', tab !== 'active');
      document.getElementById('voteTabPast').classList.toggle('hidden', tab !== 'past');
      const submitWrap = document.getElementById('voteSubmitWrap');
      if (submitWrap) submitWrap.classList.toggle('hidden', tab !== 'active' || !ACTIVE_POLL);
    });
  });

  // Pre-fill voter name from logged-in user
  if (ACTIVE_POLL) {
    const nameInput = document.getElementById('voterName');
    if (nameInput && AppState.currentUser && AppState.currentUser.name) {
      nameInput.value = AppState.currentUser.name;
    }
  }

  // Only wire up voting interactions if there's an active poll
  if (ACTIVE_POLL) {
    document.querySelectorAll('.vote-opt-row:not(.vote-readonly)').forEach(row => {
      row.addEventListener('click', () => {
        const cat = row.dataset.cat;
        const opt = row.dataset.opt;
        if (voteMySelections[cat].has(opt)) {
          voteMySelections[cat].delete(opt);
          row.classList.remove('selected');
        } else {
          voteMySelections[cat].add(opt);
          row.classList.add('selected');
        }
        voteUpdateDisplay();
      });
    });

    const submitBtn = document.getElementById('voteSubmitBtn');
    if (submitBtn) submitBtn.addEventListener('click', voteSubmit);

    voteInitState();
    voteLoadResults();
    if (voteRefreshInterval) clearInterval(voteRefreshInterval);
    voteRefreshInterval = setInterval(voteLoadResults, 30000);
  }

  // Load past poll data
  PAST_POLLS.forEach((poll, idx) => {
    voteLoadPastPollResults(poll, idx);
  });

  // Default to Past Polls tab when no active poll
  if (!ACTIVE_POLL && PAST_POLLS.length > 0) {
    const pastBtn = document.querySelector('[data-votetab="past"]');
    if (pastBtn) pastBtn.click();
  }
}
