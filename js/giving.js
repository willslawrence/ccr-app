/* ====================================
   GIVING PAGE
   Two tabs: Transactions (coming soon) + Charities
   ==================================== */

let currentGivingTab = 'charities';

// Mock charity data (replace with actual Google Sheets data later)
const CHARITIES_DATA = [
  {
    name: "Local Food Bank",
    category: "Community Outreach",
    allocation: 2500,
    description: "Supporting families in need with food assistance"
  },
  {
    name: "Missions Fund",
    category: "Global Missions",
    allocation: 3000,
    description: "Supporting missionaries worldwide"
  },
  {
    name: "Youth Ministry",
    category: "Ministry Programs",
    allocation: 1500,
    description: "Programs and activities for youth development"
  },
  {
    name: "Building Maintenance",
    category: "Operations",
    allocation: 2000,
    description: "Keeping our facilities in good condition"
  },
  {
    name: "Benevolence Fund",
    category: "Community Support",
    allocation: 1000,
    description: "Emergency assistance for church members and community"
  }
];

// Calculate total allocation
function getTotalAllocation() {
  return CHARITIES_DATA.reduce((sum, charity) => sum + charity.allocation, 0);
}

// Render Giving page
function renderGivingPage() {
  const totalAllocation = getTotalAllocation();

  return `
    <div class="page giving-page">
      <h1 class="page-title">Giving</h1>

      <!-- Tab Buttons -->
      <div class="tab-buttons">
        <button class="tab-btn ${currentGivingTab === 'charities' ? 'active' : ''}" data-tab="charities">💰 Charities</button>
        <button class="tab-btn ${currentGivingTab === 'transactions' ? 'active' : ''}" data-tab="transactions">📊 Transactions</button>
      </div>

      <!-- Charities Tab -->
      <div class="giving-tab-content ${currentGivingTab === 'charities' ? 'active' : ''}" data-tab="charities">

        <!-- Total Allocation Summary -->
        <div class="card giving-summary">
          <h3>Total Monthly Allocation</h3>
          <div class="giving-total">$${totalAllocation.toLocaleString()}</div>
          <p style="color: var(--muted); font-size: 14px; margin-top: 8px;">
            Distributed across ${CHARITIES_DATA.length} charities and funds
          </p>
        </div>

        <!-- Charity Cards -->
        <div class="charities-grid">
          ${CHARITIES_DATA.map(charity => {
            const percent = Math.round((charity.allocation / totalAllocation) * 100);
            return `
              <div class="charity-card card">
                <div class="charity-header">
                  <h3>${escapeHtml(charity.name)}</h3>
                  <span class="charity-category">${escapeHtml(charity.category)}</span>
                </div>
                <p class="charity-description">${escapeHtml(charity.description)}</p>
                <div class="charity-allocation">
                  <div class="allocation-amount">$${charity.allocation.toLocaleString()}</div>
                  <div class="allocation-percent">${percent}% of total</div>
                </div>
                <div class="charity-progress-bar">
                  <div class="charity-progress-fill" style="width: ${percent}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${isAdmin() || isEditor() ? `
          <button class="btn-gold" id="editCharitiesBtn" style="margin-top: 20px;">
            ✏️ Edit Allocations
          </button>
        ` : ''}
      </div>

      <!-- Transactions Tab -->
      <div class="giving-tab-content ${currentGivingTab === 'transactions' ? 'active' : ''}" data-tab="transactions">
        <div class="card coming-soon-card">
          <div class="coming-soon-icon">📊</div>
          <h3>Transaction History</h3>
          <p style="color: var(--muted); margin-top: 12px; line-height: 1.6;">
            Track church giving transactions and view detailed financial reports.
            This feature is coming in a future update.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Initialize Giving page
function initGivingPage() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentGivingTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = renderGivingPage();
      initGivingPage();
    });
  });

  // Edit charities button (admin/editor only)
  const editBtn = document.getElementById('editCharitiesBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      alert('Edit Allocations feature coming soon - will integrate with Google Sheets or Firestore');
    });
  }
}
