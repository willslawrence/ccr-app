/* ====================================
   GIVING PAGE
   Two tabs: Transactions + Charities
   ==================================== */

let currentGivingTab = 'transactions'; // Default to transactions
let activeGivingCat = 'all'; // Category filter for charities
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

// Calculate total given (excluding Local Church)
function getTotalGiven() {
  if (!window.GIVING_CHARITIES) return 0;
  return GIVING_CHARITIES
    .filter(charity => charity.status === 'given' && charity.name !== 'Local Church (Us)')
    .reduce((sum, charity) => sum + charity.amountNum, 0);
}

// Render Giving page
async function renderGivingPage() {
  await loadTransactions();
  const totals = calculateTotals();
  const totalGiven = getTotalGiven();

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

        <!-- Total Given Summary -->
        <div class="card giving-summary">
          <h3>Total Given</h3>
          <div class="giving-total">SAR ${totalGiven.toLocaleString()}</div>
          <p style="color: var(--muted); font-size: 14px; margin-top: 8px;">
            Across ${(GIVING_CHARITIES || []).filter(c => c.status === 'given').length} charities and ministries
          </p>
        </div>

        <!-- Category Filter Pills -->
        <div class="cat-filters" style="margin-bottom:20px;">
          <button class="cat-btn ${activeGivingCat === 'all' ? 'active' : ''}" data-cat="all" onclick="filterGivingCategory('all')">All</button>
          <button class="cat-btn ${activeGivingCat === 'church' ? 'active' : ''}" data-cat="church" onclick="filterGivingCategory('church')">⛪ Church Planting</button>
          <button class="cat-btn ${activeGivingCat === 'orphan' ? 'active' : ''}" data-cat="orphan" onclick="filterGivingCategory('orphan')">💛 Orphans Widows & Sojourners</button>
          <button class="cat-btn ${activeGivingCat === 'persecuted' ? 'active' : ''}" data-cat="persecuted" onclick="filterGivingCategory('persecuted')">🔥 Persecuted Church</button>
          <button class="cat-btn ${activeGivingCat === 'word' ? 'active' : ''}" data-cat="word" onclick="filterGivingCategory('word')">📖 Ministry of the Word</button>
          <button class="cat-btn ${activeGivingCat === 'local' ? 'active' : ''}" data-cat="local" onclick="filterGivingCategory('local')">🏠 Local Church</button>
          <button class="cat-btn ${activeGivingCat === 'global' ? 'active' : ''}" data-cat="global" onclick="filterGivingCategory('global')">🌍 Global Church Needs</button>
        </div>

        <!-- Charity Cards Grid -->
        <div class="charity-grid" id="charityGrid">
          ${(GIVING_CHARITIES || []).map(charity => {
            const isVisible = activeGivingCat === 'all' || charity.category === activeGivingCat || (charity.categories && charity.categories.some(c => c.cat === activeGivingCat));
            const statusBadge = charity.status === 'given' ? 
              '<span class="status-badge status-given">✓ Given</span>' : 
              '<span class="status-badge status-new">★ New</span>';
            const scoreCircle = charity.score === 100 ? 
              '<div class="score-circle score-100">100</div>' : 
              charity.score === 75 ? '<div class="score-circle score-75">75</div>' : 
              charity.score === -1 ? '<div class="score-circle score-warning">⚠️</div>' : '';
            
            // Truncate description to 2-3 lines
            const shortDesc = charity.description.length > 120 ? 
              charity.description.substring(0, 120) + '...' : charity.description;

            return `
              <div class="giving-charity-card ${isVisible ? '' : 'dimmed'}" data-category="${charity.category}" onclick="openCharityModal('${charity.name.replace(/'/g, "\\'")}')">
                ${scoreCircle}
                <div class="charity-card-header">
                  <span class="category-tag cat-${charity.category}">${charity.categoryLabel}</span>
                  ${statusBadge}
                </div>
                <h3 class="charity-name">${escapeHtml(charity.name)}</h3>
                <p class="charity-desc">${escapeHtml(shortDesc)}</p>
                <div class="charity-footer">
                  <div class="charity-amount">${charity.amount}</div>
                  <div class="click-details">Click for details</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Filter charities by category
function filterGivingCategory(cat) {
  activeGivingCat = cat;
  
  // Update button states
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  
  // Filter cards
  document.querySelectorAll('.giving-charity-card').forEach(card => {
    const cardCat = card.dataset.category;
    const isVisible = cat === 'all' || cardCat === cat;
    card.classList.toggle('dimmed', !isVisible);
  });
}

// Open charity modal
function openCharityModal(charityName) {
  if (!window.GIVING_CHARITIES) return;
  const charity = GIVING_CHARITIES.find(c => c.name === charityName);
  if (!charity) return;
  
  // Reuse existing bookDetailModal
  const modal = document.getElementById('bookDetailModal');
  const modalContent = modal.querySelector('.modal-content');
  
  // Build modal content
  let content = `
    <div class="modal-header">
      <h2>${escapeHtml(charity.name)}</h2>
      <button class="modal-close" onclick="document.getElementById('bookDetailModal').style.display='none'">&times;</button>
    </div>
    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
  `;
  
  // Category and amount
  content += `
    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <span class="category-tag cat-${charity.category}">${charity.categoryLabel}</span>
      ${charity.status === 'given' ? '<span class="status-badge status-given">✓ Given</span>' : '<span class="status-badge status-new">★ New</span>'}
    </div>
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--accent);">
      ${charity.amount}
    </div>
  `;
  
  // Full description
  content += `<div style="margin-bottom: 16px;">${charity.fullDescription || charity.description}</div>`;
  
  // Link if available
  if (charity.link) {
    content += `<div style="margin-bottom: 16px;"><a href="${charity.link}" target="_blank" class="btn btn-outline">Visit Website</a></div>`;
  }
  
  // Stats row for orgs
  if (charity.stats) {
    content += `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--card-hover); border-radius: 8px;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: var(--muted);">Programs</div>
          <div style="font-weight: 600;">${charity.stats.programs}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12px; color: var(--muted);">Fundraising</div>
          <div style="font-weight: 600;">${charity.stats.ceoPay}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12px; color: var(--muted);">Revenue</div>
          <div style="font-weight: 600;">${charity.stats.revenue}</div>
        </div>
      </div>
    `;
  }
  
  // Audit section if available
  if (charity.audit) {
    const audit = charity.audit;
    content += `<div style="margin-bottom: 16px;">`;
    
    // Mission
    if (audit.mission) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">Mission</h4>
        <div style="margin-bottom: 16px; font-style: italic;">${audit.mission}</div>
      `;
    }
    
    // What They Do
    if (audit.programs) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">What They Do</h4>
        <ul style="margin-bottom: 16px;">
          ${audit.programs.map(p => `<li>${p}</li>`).join('')}
        </ul>
      `;
    }
    
    // Financials table
    if (audit.financials) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">Financials</h4>
        <div style="margin-bottom: 16px;">
      `;
      audit.financials.forEach(item => {
        const colorClass = item.ratingColor === 'green' ? 'color: var(--green)' : 
                          item.ratingColor === 'amber' ? 'color: #d97706' : 
                          item.ratingColor === 'red' ? 'color: var(--red)' : '';
        content += `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
            <span>${item.metric}</span>
            <span style="${colorClass}; font-weight: 600;">${item.value}</span>
          </div>
        `;
      });
      content += `</div>`;
    }
    
    // Leadership table
    if (audit.leaders) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">Leadership</h4>
        <div style="margin-bottom: 16px;">
      `;
      audit.leaders.forEach(leader => {
        content += `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
            <span>${leader.name} (${leader.role})</span>
            <span style="font-weight: 600;">${leader.comp}</span>
          </div>
        `;
      });
      if (audit.leaderNote) {
        content += `<div style="font-size: 12px; color: var(--muted); margin-top: 8px;">${audit.leaderNote}</div>`;
      }
      content += `</div>`;
    }
    
    // Governance checkmarks
    if (audit.governance) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">Governance</h4>
        <ul style="margin-bottom: 16px;">
          ${audit.governance.map(g => `<li style="color: var(--green);">✓ ${g}</li>`).join('')}
        </ul>
      `;
    }
    
    // Critics Say (red box)
    if (audit.critics) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--red);">Critics Say</h4>
        <div style="background: rgba(220, 38, 38, 0.1); border-left: 4px solid var(--red); padding: 12px; margin-bottom: 16px;">
          <ul>
            ${audit.critics.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Ambassadors Say (green box)
    if (audit.ambassadors) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--green);">Ambassadors Say</h4>
        <div style="background: rgba(22, 163, 74, 0.1); border-left: 4px solid var(--green); padding: 12px; margin-bottom: 16px;">
          <ul>
            ${audit.ambassadors.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Verdict
    if (audit.verdict) {
      content += `
        <h4 style="margin-bottom: 8px; color: var(--accent);">Verdict</h4>
        <div style="margin-bottom: 16px; font-weight: 500;">${audit.verdict}</div>
      `;
    }
    
    content += `</div>`;
  }
  
  // Update text if available
  if (charity.updateText) {
    content += `
      <h4 style="margin-bottom: 8px; color: var(--accent);">Latest Update</h4>
      <div style="margin-bottom: 16px;">${charity.updateText}</div>
    `;
  }
  
  content += `</div>`;
  
  modalContent.innerHTML = content;
  modal.style.display = 'block';
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
