/* ====================================
   GIVING PAGE
   Two tabs: Transactions + Charities
   ==================================== */

let currentGivingTab = 'transactions'; // Default to transactions
let givingState = {
  transactions: [],
  showAddForm: false,
  editingId: null
};

// Load transactions from localStorage
function loadTransactions() {
  givingState.transactions = JSON.parse(localStorage.getItem('ccr_transactions') || '[]');

  // Sort by date, newest first
  givingState.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Save transactions
function saveTransactions() {
  localStorage.setItem('ccr_transactions', JSON.stringify(givingState.transactions));
}

// Calculate totals
function calculateTotals() {
  const totalIn = givingState.transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = Math.abs(givingState.transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  const balance = totalIn - totalOut;

  return { totalIn, totalOut, balance };
}

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
  loadTransactions();
  const totals = calculateTotals();
  const totalAllocation = getTotalAllocation();

  return `
    <div class="page giving-page">
      <h1 class="page-title">💰 Giving</h1>

      <!-- Tab Buttons (side-by-side at top) -->
      <div class="btn-group" style="margin-bottom:20px;">
        <button class="btn ${currentGivingTab === 'transactions' ? 'btn-primary' : 'btn-outline'}" data-tab="transactions">📊 Transactions</button>
        <button class="btn ${currentGivingTab === 'charities' ? 'btn-primary' : 'btn-outline'}" data-tab="charities">💰 Charities</button>
      </div>

      <!-- Transactions Tab -->
      <div class="giving-tab-content ${currentGivingTab === 'transactions' ? 'active' : ''}" data-tab="transactions">

        <!-- Running Totals Card -->
        <div class="card" style="margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;">
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total In</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--green);">$${totals.totalIn.toLocaleString()}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Total Out</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--red);">$${totals.totalOut.toLocaleString()}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Balance</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--accent);">$${totals.balance.toLocaleString()}</div>
            </div>
          </div>
        </div>

        ${isAdmin() || isEditor() ? `
          <button class="btn btn-primary" id="addTransactionBtn" style="margin-bottom:20px;">+ Add Transaction</button>
        ` : ''}

        <!-- Add Transaction Form -->
        <div id="addTransactionForm" style="display:none;margin-bottom:24px;">
          <div class="card">
            <h3 style="margin-bottom:16px;">${givingState.editingId ? 'Edit Transaction' : 'New Transaction'}</h3>
            <form id="transactionFormElement">
              <div class="form-group">
                <label class="form-label">Date *</label>
                <input type="date" class="form-input" id="transDate" required>
              </div>
              <div class="form-group">
                <label class="form-label">Description *</label>
                <input type="text" class="form-input" id="transDesc" placeholder="e.g., Sunday Offering" required>
              </div>
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-select" id="transCategory" required>
                  <option value="">Select category...</option>
                  <option value="Tithe">Tithe</option>
                  <option value="Offering">Offering</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Amount * (use negative for expenses)</label>
                <input type="number" class="form-input" id="transAmount" placeholder="e.g., 1000 or -500" step="0.01" required>
              </div>
              <div class="btn-group" style="margin-top:20px;">
                <button type="submit" class="btn btn-primary">${givingState.editingId ? 'Save Changes' : 'Add Transaction'}</button>
                <button type="button" class="btn btn-outline" id="cancelTransBtn">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Transaction List -->
        <div id="transactionList">
          ${givingState.transactions.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📊</div>
              <div class="empty-text">No transactions yet</div>
              <div class="empty-sub">Add your first transaction above</div>
            </div>
          ` : givingState.transactions.map(trans => `
            <div class="card" style="margin-bottom:12px;">
              <div class="card-header">
                <div style="flex:1;">
                  <div class="card-meta">${formatDate(trans.date)} · ${trans.category}</div>
                  <div class="card-title">${escapeHtml(trans.description)}</div>
                </div>
                <div style="text-align:right;">
                  <div class="mono" style="font-size:20px;font-weight:700;color:${trans.amount > 0 ? 'var(--green)' : 'var(--red)'};">
                    ${trans.amount > 0 ? '+' : ''}$${Math.abs(trans.amount).toLocaleString()}
                  </div>
                </div>
              </div>
              ${isAdmin() || isEditor() ? `
                <div class="btn-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                  <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editTransaction('${trans.id}')">✏️ Edit</button>
                  <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="deleteTransaction('${trans.id}')">🗑️ Delete</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
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
      </div>
    </div>
  `;
}

// Initialize Giving page
function initGivingPage() {
  loadTransactions();

  // Tab switching
  document.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentGivingTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = renderGivingPage();
      initGivingPage();
    });
  });

  // Add transaction button
  const addBtn = document.getElementById('addTransactionBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      givingState.showAddForm = true;
      givingState.editingId = null;
      document.getElementById('addTransactionForm').style.display = 'block';
      document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('transDate').focus();
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelTransBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      givingState.showAddForm = false;
      givingState.editingId = null;
      document.getElementById('addTransactionForm').style.display = 'none';
      document.getElementById('transactionFormElement').reset();
    });
  }

  // Form submit
  const form = document.getElementById('transactionFormElement');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTransaction();
    });
  }
}

// Save transaction
function saveTransaction() {
  const date = document.getElementById('transDate').value;
  const description = document.getElementById('transDesc').value.trim();
  const category = document.getElementById('transCategory').value;
  const amount = parseFloat(document.getElementById('transAmount').value);

  if (givingState.editingId) {
    // Edit existing
    const trans = givingState.transactions.find(t => t.id === givingState.editingId);
    if (trans) {
      trans.date = date;
      trans.description = description;
      trans.category = category;
      trans.amount = amount;
    }
  } else {
    // Add new
    const transaction = {
      id: 'trans_' + Date.now(),
      date,
      description,
      category,
      amount,
      createdAt: new Date().toISOString()
    };
    givingState.transactions.unshift(transaction);
  }

  saveTransactions();
  givingState.showAddForm = false;
  givingState.editingId = null;
  document.getElementById('app').innerHTML = renderGivingPage();
  initGivingPage();
}

// Edit transaction
function editTransaction(id) {
  const trans = givingState.transactions.find(t => t.id === id);
  if (!trans) return;

  givingState.editingId = id;
  givingState.showAddForm = true;

  document.getElementById('transDate').value = trans.date;
  document.getElementById('transDesc').value = trans.description;
  document.getElementById('transCategory').value = trans.category;
  document.getElementById('transAmount').value = trans.amount;
  document.getElementById('addTransactionForm').style.display = 'block';
  document.getElementById('transDate').focus();
}

// Delete transaction
function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;

  givingState.transactions = givingState.transactions.filter(t => t.id !== id);
  saveTransactions();
  document.getElementById('app').innerHTML = renderGivingPage();
  initGivingPage();
}
