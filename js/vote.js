/* ====================================
   GIVING VOTE PAGE
   Simple voting UI for charity allocations
   ==================================== */

// Mock voting data
const VOTING_CHARITIES = [
  { id: 1, name: "Local Food Bank", description: "Supporting families in need" },
  { id: 2, name: "Missions Fund", description: "Supporting missionaries worldwide" },
  { id: 3, name: "Youth Ministry", description: "Youth programs and activities" },
  { id: 4, name: "Building Maintenance", description: "Facility upkeep and improvements" },
  { id: 5, name: "Benevolence Fund", description: "Emergency community assistance" }
];

let userVotes = {}; // { charityId: percentage }
let hasSubmittedVote = false;

// Check if user has voted
function checkVoteStatus() {
  const user = getCurrentUser();
  const voteKey = user ? `vote_${user.id}` : 'vote_mock';
  const savedVote = localStorage.getItem(voteKey);

  if (savedVote) {
    hasSubmittedVote = true;
    userVotes = JSON.parse(savedVote);
  }
}

// Save vote
function saveVote() {
  const user = getCurrentUser();
  const voteKey = user ? `vote_${user.id}` : 'vote_mock';

  // Validate that votes add up to 100%
  const total = Object.values(userVotes).reduce((sum, val) => sum + val, 0);

  if (Math.abs(total - 100) > 0.1) {
    alert(`Vote percentages must add up to 100%. Current total: ${total.toFixed(1)}%`);
    return;
  }

  localStorage.setItem(voteKey, JSON.stringify(userVotes));
  hasSubmittedVote = true;

  alert('Your vote has been submitted successfully!');
  navigateTo('vote');
}

// Update vote percentage
function updateVotePercentage(charityId, value) {
  userVotes[charityId] = parseFloat(value) || 0;
  updateRemainingPercentage();
}

// Calculate remaining percentage
function updateRemainingPercentage() {
  const total = Object.values(userVotes).reduce((sum, val) => sum + val, 0);
  const remaining = 100 - total;

  const remainingEl = document.getElementById('remainingPercentage');
  if (remainingEl) {
    remainingEl.textContent = remaining.toFixed(1);

    if (Math.abs(remaining) < 0.1) {
      remainingEl.style.color = 'var(--green)';
    } else if (remaining < 0) {
      remainingEl.style.color = 'var(--red)';
    } else {
      remainingEl.style.color = 'var(--accent)';
    }
  }
}

// Initialize votes to equal distribution
function initializeEqualVotes() {
  const equalPercent = 100 / VOTING_CHARITIES.length;
  VOTING_CHARITIES.forEach(charity => {
    userVotes[charity.id] = parseFloat(equalPercent.toFixed(1));
  });
}

// Render Vote page
function renderVotePage() {
  checkVoteStatus();

  // If user hasn't voted yet, initialize equal distribution
  if (!hasSubmittedVote && Object.keys(userVotes).length === 0) {
    initializeEqualVotes();
  }

  const total = Object.values(userVotes).reduce((sum, val) => sum + val, 0);
  const remaining = 100 - total;

  return `
    <div class="page vote-page">
      <h1 class="page-title">Giving Vote</h1>

      ${hasSubmittedVote ? `
        <!-- Vote Submitted View -->
        <div class="card vote-submitted-card">
          <div class="vote-submitted-icon">✅</div>
          <h3>Thank you for voting!</h3>
          <p style="color: var(--muted); margin-top: 8px;">
            Your allocation preferences have been recorded.
          </p>
        </div>

        <div class="card">
          <h3>Your Vote</h3>
          <div class="vote-results">
            ${VOTING_CHARITIES.map(charity => {
              const percent = userVotes[charity.id] || 0;
              return `
                <div class="vote-result-item">
                  <div class="vote-result-header">
                    <span class="charity-name">${escapeHtml(charity.name)}</span>
                    <span class="vote-percent">${percent.toFixed(1)}%</span>
                  </div>
                  <div class="vote-progress-bar">
                    <div class="vote-progress-fill" style="width: ${percent}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <button class="btn-outline" id="editVoteBtn" style="margin-top: 20px;">
            ✏️ Edit My Vote
          </button>
        </div>
      ` : `
        <!-- Voting Form -->
        <div class="card vote-instructions">
          <h3>Allocate Your Preferences</h3>
          <p style="color: var(--muted); line-height: 1.6; margin-top: 8px;">
            Distribute 100% across the following charities and funds based on your giving priorities.
            Adjust the percentages using the sliders or input fields.
          </p>
        </div>

        <div class="card vote-form">
          <!-- Remaining Percentage Display -->
          <div class="remaining-display">
            <span>Remaining:</span>
            <span id="remainingPercentage" class="remaining-value">${remaining.toFixed(1)}</span>
            <span>%</span>
          </div>

          <!-- Charity Voting Items -->
          <div class="vote-items">
            ${VOTING_CHARITIES.map(charity => {
              const value = userVotes[charity.id] || 0;
              return `
                <div class="vote-item">
                  <div class="vote-item-header">
                    <h4>${escapeHtml(charity.name)}</h4>
                    <input
                      type="number"
                      class="vote-input"
                      data-charity-id="${charity.id}"
                      value="${value.toFixed(1)}"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="vote-percent-symbol">%</span>
                  </div>
                  <p class="vote-item-description">${escapeHtml(charity.description)}</p>
                  <input
                    type="range"
                    class="vote-slider"
                    data-charity-id="${charity.id}"
                    value="${value}"
                    min="0"
                    max="100"
                    step="0.1"
                  >
                </div>
              `;
            }).join('')}
          </div>

          <!-- Equal Distribution Button -->
          <button class="btn-outline" id="equalDistBtn" style="margin-top: 20px;">
            ⚖️ Equal Distribution
          </button>

          <!-- Submit Button -->
          <button class="btn-gold" id="submitVoteBtn" style="margin-top: 12px;">
            Submit Vote
          </button>
        </div>
      `}

      ${isAdmin() ? `
        <div style="margin-top: 20px;">
          <button class="btn-outline" id="viewResultsBtn">📊 View All Results</button>
          <button class="btn-outline" id="createVoteBtn" style="margin-left: 8px;">➕ Create New Vote</button>
        </div>
      ` : ''}
    </div>
  `;
}

// Initialize Vote page
function initVotePage() {
  // Vote input changes
  document.querySelectorAll('.vote-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const charityId = parseInt(e.target.dataset.charityId);
      const value = parseFloat(e.target.value) || 0;
      updateVotePercentage(charityId, value);

      // Update corresponding slider
      const slider = document.querySelector(`.vote-slider[data-charity-id="${charityId}"]`);
      if (slider) slider.value = value;
    });
  });

  // Vote slider changes
  document.querySelectorAll('.vote-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const charityId = parseInt(e.target.dataset.charityId);
      const value = parseFloat(e.target.value);
      updateVotePercentage(charityId, value);

      // Update corresponding input
      const input = document.querySelector(`.vote-input[data-charity-id="${charityId}"]`);
      if (input) input.value = value.toFixed(1);
    });
  });

  // Equal distribution button
  const equalDistBtn = document.getElementById('equalDistBtn');
  if (equalDistBtn) {
    equalDistBtn.addEventListener('click', () => {
      initializeEqualVotes();
      navigateTo('vote');
    });
  }

  // Submit vote button
  const submitBtn = document.getElementById('submitVoteBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', saveVote);
  }

  // Edit vote button
  const editBtn = document.getElementById('editVoteBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      hasSubmittedVote = false;
      navigateTo('vote');
    });
  }

  // Admin buttons
  const viewResultsBtn = document.getElementById('viewResultsBtn');
  if (viewResultsBtn) {
    viewResultsBtn.addEventListener('click', () => {
      alert('View All Results feature coming soon - will show aggregated voting data');
    });
  }

  const createVoteBtn = document.getElementById('createVoteBtn');
  if (createVoteBtn) {
    createVoteBtn.addEventListener('click', () => {
      alert('Create New Vote feature coming soon - will allow admins to start new voting rounds');
    });
  }

  // Update remaining percentage display
  updateRemainingPercentage();
}
