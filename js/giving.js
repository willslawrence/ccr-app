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

// Load transactions from Firestore
async function loadTransactions() {
  try {
    const snapshot = await db.collection('transactions').orderBy('date', 'desc').get();
    givingState.transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to ISO string
        date: data.date instanceof firebase.firestore.Timestamp
          ? data.date.toDate().toISOString().split('T')[0]
          : data.date,
        createdAt: data.createdAt instanceof firebase.firestore.Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt
      };
    });
  } catch (error) {
    console.error('Error loading transactions:', error);
    givingState.transactions = [];
  }
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
async function renderGivingPage() {
  await loadTransactions();
  const totals = calculateTotals();
  const totalAllocation = getTotalAllocation();

  return `
    <div class="page giving-page">
      <div class="page-sticky-banner">
        <h1 class="page-title">💰 Giving</h1>

        <!-- Tab Buttons (side-by-side at top) -->
        <div class="btn-group" style="margin-bottom:0;">
          <button class="btn ${currentGivingTab === 'transactions' ? 'btn-primary' : 'btn-outline'}" data-tab="transactions">📊 Transactions</button>
          <button class="btn ${currentGivingTab === 'charities' ? 'btn-primary' : 'btn-outline'}" data-tab="charities">💰 Charities</button>
        </div>
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
async function initGivingPage() {
  await loadTransactions();

  // Tab switching
  document.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      currentGivingTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = await renderGivingPage();
      await initGivingPage();
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
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveTransaction();
    });
  }
}

// Save transaction
async function saveTransaction() {
  try {
    const date = document.getElementById('transDate').value;
    const description = document.getElementById('transDesc').value.trim();
    const category = document.getElementById('transCategory').value;
    const amount = parseFloat(document.getElementById('transAmount').value);

    if (givingState.editingId) {
      // Edit existing
      await db.collection('transactions').doc(givingState.editingId).update({
        date,
        description,
        category,
        amount,
        updatedAt: firebase.firestore.Timestamp.now()
      });
    } else {
      // Add new
      await db.collection('transactions').add({
        date,
        description,
        category,
        amount,
        createdAt: firebase.firestore.Timestamp.now()
      });
    }

    givingState.showAddForm = false;
    givingState.editingId = null;
    document.getElementById('app').innerHTML = await renderGivingPage();
    await initGivingPage();
  } catch (error) {
    console.error('Error saving transaction:', error);
    alert('Error saving transaction. Please try again.');
  }
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
async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;

  try {
    await db.collection('transactions').doc(id).delete();
    document.getElementById('app').innerHTML = await renderGivingPage();
    await initGivingPage();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    alert('Error deleting transaction. Please try again.');
  }
}
