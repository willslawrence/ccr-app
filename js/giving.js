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

// Fund fractions for "All" allocations
const FUND_FRACTIONS = {
  'LC1': 1/4,      // Church Needs
  'LC2': 1/12,     // Ministry of the Word  
  'PC1': 1/6,      // Global Church Needs
  'PC2': 1/6,      // Church Planting
  'HH1': 1/6,      // Orphans, Widows, Sojourners
  'HH2': 1/6       // Persecuted Church
};

// Fund names for display
const FUND_NAMES = {
  'LC1': 'LC1 Church Needs',
  'LC2': 'LC2 Ministry of the Word',
  'PC1': 'PC1 Global Church Needs', 
  'PC2': 'PC2 Church Planting',
  'HH1': 'HH1 Orphans/Widows/Sojourners',
  'HH2': 'HH2 Persecuted Church',
  'SP': 'Special Project'
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

// Calculate fund balances based on allocation rules
function calculateFundBalances() {
  const balances = {
    'LC1': 0, 'LC2': 0, 'PC1': 0, 'PC2': 0, 'HH1': 0, 'HH2': 0, 'SP': 0
  };

  givingState.transactions.forEach(trans => {
    // Skip transfers within CCR
    if (trans.allocation === 'Transfer within CCR') return;

    if (trans.allocation === 'All') {
      // Split incoming amounts by fund fractions
      if (trans.type === 'Incoming') {
        Object.keys(FUND_FRACTIONS).forEach(fund => {
          balances[fund] += trans.amount * FUND_FRACTIONS[fund];
        });
      }
    } else {
      // Direct allocation to specific fund
      const fundMatch = trans.allocation.match(/^(LC1|LC2|PC1|PC2|HH1|HH2)/);
      if (fundMatch) {
        balances[fundMatch[1]] += trans.amount;
      } else if (trans.allocation === 'Special Project') {
        balances['SP'] += trans.amount;
      }
    }
  });

  return balances;
}

// Calculate totals (exclude transfers from balance)
function calculateTotals() {
  const nonTransfers = givingState.transactions.filter(t => 
    t.allocation !== 'Transfer within CCR'
  );

  const totalIn = nonTransfers
    .filter(t => t.type === 'Incoming')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = Math.abs(nonTransfers
    .filter(t => t.type === 'Outgoing')
    .reduce((sum, t) => sum + t.amount, 0));

  const balance = totalIn - totalOut;

  // Calculate church ratio (LC1 outgoing / total outgoing)
  const lc1Outgoing = Math.abs(nonTransfers
    .filter(t => t.type === 'Outgoing' && 
      (t.allocation === 'LC1 - Church Needs' || 
       (t.allocation === 'All' && t.amount < 0)))
    .reduce((sum, t) => {
      if (t.allocation === 'All') {
        return sum + (Math.abs(t.amount) * FUND_FRACTIONS['LC1']);
      }
      return sum + Math.abs(t.amount);
    }, 0));

  const churchRatio = totalOut > 0 ? (lc1Outgoing / totalOut) * 100 : 0;

  return { totalIn, totalOut, balance, churchRatio };
}

// Calculate total given (excluding Local Church)
function getTotalGiven() {
  if (!window.GIVING_CHARITIES) return 0;
  return GIVING_CHARITIES
    .filter(charity => charity.status === 'given' && charity.name !== 'Local Church (Us)')
    .reduce((sum, charity) => sum + charity.amountNum, 0);
}

// Format amount for display (no currency symbol in transaction list)
function formatAmount(amount, showCurrency = false) {
  const prefix = showCurrency ? 'SAR ' : '';
  return prefix + Math.abs(amount).toLocaleString();
}

// Render Giving page
async function renderGivingPage() {
  await loadTransactions();
  const totals = calculateTotals();
  const fundBalances = calculateFundBalances();
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

        <!-- Summary Card -->
        <div class="card" style="margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;margin-bottom:16px;">
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Incoming Total</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--green);">SAR ${totals.totalIn.toLocaleString()}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Outgoing Total</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--red);">${formatAmount(totals.totalOut, true)}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Balance</div>
              <div class="mono" style="font-size:24px;font-weight:700;color:var(--accent);">SAR ${totals.balance.toLocaleString()}</div>
            </div>
          </div>
          
          <!-- Church Ratio -->
          <div style="text-align:center;padding:8px;background:var(--card-hover);border-radius:6px;margin-bottom:16px;">
            <span style="font-size:12px;color:var(--muted);">Internal Use:</span>
            <span style="font-size:14px;font-weight:600;margin-left:4px;">${totals.churchRatio.toFixed(1)}%</span>
          </div>

          <!-- Fund Balances Grid -->
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            ${Object.entries(fundBalances).map(([fund, balance]) => `
              <div style="padding:8px;background:var(--card-hover);border-radius:4px;">
                <div style="font-size:10px;color:var(--muted);margin-bottom:2px;">${FUND_NAMES[fund]}</div>
                <div style="font-size:14px;font-weight:600;color:${balance >= 0 ? 'var(--green)' : 'var(--red)'};">
                  ${balance >= 0 ? '' : '-'}${formatAmount(balance, true)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${isAdmin() ? `
          <button class="btn btn-primary" id="addTransactionBtn" style="margin-bottom:20px;">+ Add Transaction</button>
        ` : ''}

        <!-- Add/Edit Transaction Form -->
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
                <label class="form-label">Amount *</label>
                <input type="number" class="form-input" id="transAmount" placeholder="e.g., 1000 or -500" step="0.01" required>
              </div>
              <div class="form-group">
                <label class="form-label">Type *</label>
                <select class="form-select" id="transType" required>
                  <option value="">Select type...</option>
                  <option value="Incoming">Incoming</option>
                  <option value="Outgoing">Outgoing</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Via *</label>
                <input type="text" class="form-input" id="transVia" placeholder="e.g., Cash, Revolut, Local Bank Transfer" required>
              </div>
              <div class="form-group">
                <label class="form-label">Church Allocation *</label>
                <select class="form-select" id="transAllocation" required>
                  <option value="">Select allocation...</option>
                  <option value="All">All</option>
                  <option value="LC1 - Church Needs">LC1 - Church Needs</option>
                  <option value="LC2 - Ministry Of the Word">LC2 - Ministry Of the Word</option>
                  <option value="PC1 - Global Church Needs">PC1 - Global Church Needs</option>
                  <option value="PC2 - Church Planting">PC2 - Church Planting</option>
                  <option value="HH1 - Orphans, Widows, Soj">HH1 - Orphans, Widows, Soj</option>
                  <option value="HH2 - Persecuted Church">HH2 - Persecuted Church</option>
                  <option value="Special Project">Special Project</option>
                  <option value="Transfer within CCR">Transfer within CCR</option>
                </select>
              </div>
              ${isAdmin() ? `
                <div class="form-group">
                  <label class="form-label">Donor</label>
                  <input type="text" class="form-input" id="transDonor" placeholder="Optional">
                </div>
                <div class="form-group">
                  <label class="form-label">Receipt ID</label>
                  <input type="text" class="form-input" id="transReceiptId" placeholder="Optional">
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="transStatus">
                    <option value="Complete">Complete</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Receipt Image URL</label>
                  <input type="url" class="form-input" id="transReceiptUrl" placeholder="https://...">
                </div>
              ` : ''}
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
                  <div class="card-meta">${formatDate(trans.date)}</div>
                  <div class="card-title">${escapeHtml(trans.description)}</div>
                  <div class="card-meta" style="margin-top:4px;">
                    ${trans.allocation} • ${trans.status}
                    ${trans.receiptUrl ? ' • <a href="' + trans.receiptUrl + '" target="_blank" style="color:var(--accent);">Receipt</a>' : ''}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div class="mono" style="font-size:20px;font-weight:700;color:${trans.amount > 0 ? 'var(--green)' : 'var(--red)'};">
                    ${trans.amount > 0 ? '+' : '-'}${formatAmount(trans.amount)}
                  </div>
                </div>
              </div>
              ${isAdmin() ? `
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
              '<span class="status-badge status-given" style="position:absolute;top:auto;bottom:8px;right:8px;">✓ Given</span>' : 
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
                </div>
                <h3 class="charity-name">${escapeHtml(charity.name)}</h3>
                <p class="charity-desc">${escapeHtml(shortDesc)}</p>
                <div class="charity-footer">
                  <div class="charity-amount">${charity.amount} ${statusBadge}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Filter charities by category (single-select)
function filterGivingCategory(cat) {
  // Deselect all other buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Select clicked button
  document.querySelector(`.cat-btn[data-cat="${cat}"]`).classList.add('active');
  
  activeGivingCat = cat;
  
  const grid = document.getElementById('charityGrid');
  const cards = Array.from(document.querySelectorAll('.giving-charity-card'));
  
  // Sort cards: matching category first, then others
  cards.sort((a, b) => {
    const aMatches = cat === 'all' || a.dataset.category === cat;
    const bMatches = cat === 'all' || b.dataset.category === cat;
    
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
  
  // Clear and re-append in new order
  cards.forEach(card => grid.removeChild(card));
  cards.forEach(card => {
    const isVisible = cat === 'all' || card.dataset.category === cat;
    card.classList.toggle('dimmed', !isVisible);
    grid.appendChild(card);
  });
}

// Open charity modal - Fixed to properly expand modals
function openCharityModal(charityName) {
  if (!window.GIVING_CHARITIES) {
    console.error('GIVING_CHARITIES not loaded');
    return;
  }
  
  const charity = GIVING_CHARITIES.find(c => c.name === charityName);
  if (!charity) {
    console.error('Charity not found:', charityName);
    return;
  }
  
  // Find or create modal
  let modal = document.getElementById('charityDetailModal');
  if (!modal) {
    // Create modal if it doesn't exist
    modal = document.createElement('div');
    modal.id = 'charityDetailModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal"></div>';
    document.body.appendChild(modal);
  }
  
  const modalContent = modal.querySelector('.modal');
  
  // Build modal content
  let content = `
    <div class="modal-header">
      <h2>${escapeHtml(charity.name)}</h2>
      <button class="modal-close" onclick="closeCharityModal()">&times;</button>
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
  modal.classList.add('active');
  
  // Click outside to close
  modal.onclick = (e) => { 
    if (e.target === modal) closeCharityModal(); 
  };
}

// Close charity modal
function closeCharityModal() {
  const modal = document.getElementById('charityDetailModal');
  if (modal) {
    modal.classList.remove('active');
  }
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
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    const via = document.getElementById('transVia').value.trim();
    const allocation = document.getElementById('transAllocation').value;
    
    // Admin-only fields
    const donor = isAdmin() && document.getElementById('transDonor') ? 
      document.getElementById('transDonor').value.trim() || null : null;
    const receiptId = isAdmin() && document.getElementById('transReceiptId') ? 
      document.getElementById('transReceiptId').value.trim() || null : null;
    const status = isAdmin() && document.getElementById('transStatus') ? 
      document.getElementById('transStatus').value : 'Complete';
    const receiptUrl = isAdmin() && document.getElementById('transReceiptUrl') ? 
      document.getElementById('transReceiptUrl').value.trim() || null : null;

    const transactionData = {
      date,
      description,
      amount,
      type,
      via,
      allocation,
      status,
      donor,
      receiptId,
      receiptUrl
    };

    if (givingState.editingId) {
      // Edit existing
      await db.collection('transactions').doc(givingState.editingId).update({
        ...transactionData,
        updatedAt: firebase.firestore.Timestamp.now()
      });
    } else {
      // Add new
      await db.collection('transactions').add({
        ...transactionData,
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
  document.getElementById('transAmount').value = trans.amount;
  document.getElementById('transType').value = trans.type;
  document.getElementById('transVia').value = trans.via;
  document.getElementById('transAllocation').value = trans.allocation;
  
  // Admin fields
  if (isAdmin()) {
    if (document.getElementById('transDonor')) document.getElementById('transDonor').value = trans.donor || '';
    if (document.getElementById('transReceiptId')) document.getElementById('transReceiptId').value = trans.receiptId || '';
    if (document.getElementById('transStatus')) document.getElementById('transStatus').value = trans.status || 'Complete';
    if (document.getElementById('transReceiptUrl')) document.getElementById('transReceiptUrl').value = trans.receiptUrl || '';
  }
  
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