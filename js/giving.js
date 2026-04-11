/* ====================================
   GIVING PAGE
   Two tabs: Transactions + Charities
   ==================================== */

let currentGivingTab = 'transactions'; // Default to transactions
let activeGivingCat = 'all'; // Category filter for charities
let givingState = {
  transactions: [],
  showAddForm: false,
  editingId: null,
  expandedTransId: null,
  transactionsLoaded: false,
  submitting: false  // Guard against double-submit
};

// Fund fractions for "All" allocations
const FUND_FRACTIONS = {
  'LC1': 1/4,      // Church Needs — 25%
  'LC2': 1/12,    // Ministry of the Word — ~8.3%
  'PC1': 1/6,     // Global Church Needs — ~16.7%
  'PC2': 1/6,     // Church Planting — ~16.7%
  'HH1': 1/6,     // Orphans, Widows, Sojourners — ~16.7%
  'HH2': 1/6      // Persecuted Church — ~16.7%
  // SP (Special Projects) gets nothing from "All" — only receives direct allocations when specifically chosen
};

// Fund names for display
const FUND_NAMES = {
  'LC1': 'LC1 Church Needs',
  'LC2': 'LC2 Ministry of the Word',
  'PC1': 'PC1 Global Church Needs', 
  'PC2': 'PC2 Church Planting',
  'HH1': 'HH1 Orphans/Widows/Sojourners',
  'HH2': 'HH2 Persecuted Church',
  'SP': 'Special Projects',
  'MC': 'Member Care'
};

const FUND_TOOLTIPS = {
  'LC1': '1/4 of tithes. Church overhead — istarahas, food, supplies.',
  'LC2': '1/12 of tithes. Ministry of the Word — preaching and teaching resources. E.g. Joyful Joseph.',
  'PC1': '1/6 of tithes. Other churches or their church members local or global. E.g. Daniels Gift.',
  'PC2': '1/6 of tithes. Evangelism, Bible studies, missionaries. E.g. Stan and Tasha, Radical.',
  'HH1': '1/6 of tithes. Those in need, aid, crisis. E.g. Crisis Aid, Lifesong for Orphans, Send Relief.',
  'HH2': '1/6 of tithes. Christians facing persecution. E.g. Open Doors International.',
  'SP': 'You decide — designated giving for specific ad hoc needs. E.g. Kenyan Mother support, projector, illnesses.',
  'MC': 'Church member needs — taxis, baby gifts, emergencies. Part of LC1. Budget: SAR 400/month.'
};

// Load transactions from Firestore (cached — only fetches once per session)
async function loadTransactions(forceRefresh = false) {
  if (givingState.transactionsLoaded && !forceRefresh) return;
  try {
    const snapshot = await db.collection('transactions').orderBy('date', 'desc').get();
    givingState.transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      const ts = data.date instanceof firebase.firestore.Timestamp
        ? data.date.toDate()
        : new Date(data.date);
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof firebase.firestore.Timestamp
          ? data.date.toDate().toISOString().split('T')[0]
          : data.date,
        _sortTime: ts.getTime(),
        createdAt: data.createdAt instanceof firebase.firestore.Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt
      };
    }).sort((a, b) => b._sortTime - a._sortTime); // Force newest-first client-side
  } catch (error) {
    console.error('Error loading transactions:', error);
    givingState.transactions = [];
  }
}

// Calculate fund balances based on allocation rules
// Calculate how incoming money is allocated across funds (ignores spending)
function calculateIncomingAllocations() {
  const allocations = {
    'LC1': 0, 'LC2': 0, 'PC1': 0, 'PC2': 0, 'HH1': 0, 'HH2': 0, 'SP': 0
  };

  givingState.transactions.forEach(trans => {
    if (trans.allocation === 'Transfer within CCR') return;
    if (trans.type !== 'Incoming') return;

    if (trans.allocation === 'All') {
      Object.keys(FUND_FRACTIONS).forEach(fund => {
        allocations[fund] += trans.amount * FUND_FRACTIONS[fund];
      });
    } else {
      const fundMatch = trans.allocation.match(/^(LC1|LC2|PC1|PC2|HH1|HH2)/);
      if (fundMatch) {
        allocations[fundMatch[1]] += trans.amount;
      } else if (trans.allocation === 'Special Project') {
        allocations['SP'] += trans.amount;
      }
    }
  });

  return allocations;
}

function calculateFundBalances() {
  const balances = {
    'LC1': 0, 'LC2': 0, 'PC1': 0, 'PC2': 0, 'HH1': 0, 'HH2': 0, 'SP': 0
  };

  givingState.transactions.forEach(trans => {
    if (trans.allocation === 'Transfer within CCR') return;

    if (trans.allocation === 'All') {
      if (trans.type === 'Incoming') {
        Object.keys(FUND_FRACTIONS).forEach(fund => {
          balances[fund] += trans.amount * FUND_FRACTIONS[fund];
        });
      }
    } else {
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

// Calculate totals — ALL TIME (no date filter, used for Balance card)
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

  return { totalIn, totalOut, balance, programRatioActual: 0, programRatioExpected: 0 };
}

// Calculate PER metrics — last 120 days (for PER cards)
function calculatePERStats() {
  const { cutoff } = getLast120Days();
  const nonTransfers = givingState.transactions.filter(t => {
    if (t.allocation === 'Transfer within CCR') return false;
    if (!t.date) return false;
    const d = typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
    return d >= cutoff;
  });

  const totalIn = nonTransfers
    .filter(t => t.type === 'Incoming')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = Math.abs(nonTransfers
    .filter(t => t.type === 'Outgoing')
    .reduce((sum, t) => sum + t.amount, 0));

  // PER ACTUAL
  const outgoing = nonTransfers.filter(t => t.type === 'Outgoing');
  const lc1Spending = Math.abs(outgoing
    .filter(t => t.allocation && t.allocation.startsWith('LC1'))
    .reduce((sum, t) => sum + t.amount, 0));
  const totalSpending = Math.abs(outgoing.reduce((sum, t) => sum + t.amount, 0));
  const externalSpending = totalSpending - lc1Spending;
  const programRatioActual = totalSpending > 0 ? (externalSpending / totalSpending) * 100 : 0;

  // PER EXPECTED
  const alloc = { LC1: 0, LC2: 0, PC1: 0, PC2: 0, HH1: 0, HH2: 0, SP: 0 };
  nonTransfers.filter(t => t.type === 'Incoming').forEach(t => {
    if (t.allocation === 'All') {
      Object.keys(FUND_FRACTIONS).forEach(f => { alloc[f] += t.amount * FUND_FRACTIONS[f]; });
    } else {
      const match = t.allocation.match(/^(LC1|LC2|PC1|PC2|HH1|HH2)/);
      if (match) alloc[match[1]] += t.amount;
      else if (t.allocation === 'Special Project') alloc['SP'] += t.amount;
    }
  });
  const totalAllocated = Object.values(alloc).reduce((s, v) => s + v, 0);
  const externalAllocated = totalAllocated - (alloc['LC1'] || 0);
  const programRatioExpected = totalAllocated > 0 ? (externalAllocated / totalAllocated) * 100 : 0;

  return { totalIn, totalOut, balance: totalIn - totalOut, programRatioActual, programRatioExpected };
}

// Calculate total given from transactions (outgoing, excluding transfers, LC1 and LC2)
function getTotalGiven() {
  return Math.abs(givingState.transactions
    .filter(t => t.type === 'Outgoing' && t.allocation !== 'Transfer within CCR' && !t.allocation.startsWith('LC1') && !t.allocation.startsWith('LC2'))
    .reduce((sum, t) => sum + t.amount, 0));
}

// Get the last N days of transaction data (rolling window)
function getLast120Days() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const days = [];
  for (let i = 0; i < 120; i++) {
    const d = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    days.push({ date: d, key });
  }
  return { cutoff, days, now };
}

// Get month labels for display (past 4 calendar months)
function getLast4Months() {
  const months = [];
  const seen = new Set();
  for (const t of givingState.transactions) {
    if (!t.date) continue;
    const d = typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!seen.has(key) && months.length < 4) {
      seen.add(key);
      months.push(key);
    }
  }
  return months.reverse();
}

// Monthly tithe average — allocation="All" with "Tithe" in description, past 120 days
function getMonthlyTitheAverage() {
  const { cutoff } = getLast120Days();
  let total = 0;
  givingState.transactions.forEach(t => {
    if (!t.date || t.type !== 'Incoming' || t.allocation !== 'All') return;
    if (!/Tithe|tithe/i.test(t.description)) return;
    const d = typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
    if (d >= cutoff) total += t.amount;
  });
  const avg = total / 4; // 120 days = 4 x 30-day months
  return { total, average: avg };
}

// Monthly LC1 expense average — LC1 outgoing expenses, past 120 days
function getMonthlyLC1ExpenseAverage() {
  const { cutoff } = getLast120Days();
  let total = 0;
  givingState.transactions.forEach(t => {
    if (!t.date || t.type !== 'Outgoing' || !t.allocation?.startsWith('LC1')) return;
    if (t.allocation === 'Transfer within CCR') return;
    const d = typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
    if (d >= cutoff) total += Math.abs(t.amount);
  });
  const avg = total / 4; // 120 days = 4 x 30-day months
  return { total, average: avg };
}

// Ready-to-give = non-LC1 fund balances (LC2 + PC1 + PC2 + HH1 + HH2 + SP)
function getReadyToGiveFunds() {
  const balances = calculateFundBalances();
  return (balances.LC2 || 0) + (balances.PC1 || 0) + (balances.PC2 || 0) +
         (balances.HH1 || 0) + (balances.HH2 || 0) + (balances.SP || 0);
}

// Calculate amount given per charity from transactions (maps transaction descriptions to charity names)
// Compute live Local Church stats from Firestore transactions (last 120 days)
function getLocalChurchLiveStats() {
  const { cutoff } = getLast120Days();
  
  const nonTransfers = givingState.transactions.filter(t => {
    if (t.allocation === 'Transfer within CCR') return false;
    if (!t.date) return false;
    const d = typeof t.date.toDate === 'function' ? t.date.toDate() : new Date(t.date);
    return d >= cutoff;
  });
  
  // Income = incoming (non-transfer, last 120 days)
  const ytdIncome = nonTransfers
    .filter(t => t.type === 'Incoming')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Expenses = outgoing (non-transfer, last 120 days)
  const ytdExpenses = Math.abs(nonTransfers
    .filter(t => t.type === 'Outgoing')
    .reduce((sum, t) => sum + t.amount, 0));
  
  // PER Actual — external spending ÷ total spending (last 120 days)
  const lc1Expenses = Math.abs(nonTransfers
    .filter(t => t.type === 'Outgoing' && (t.allocation === 'LC1 - Church Needs' || t.allocation === 'LC1'))
    .reduce((sum, t) => sum + t.amount, 0));
  const externalExpenses = ytdExpenses - lc1Expenses;
  const actualPER = ytdExpenses > 0 ? Math.round((externalExpenses / ytdExpenses) * 100) : 0;
  
  // Expected PER — based on incoming allocations (how tithes are earmarked, last 120 days)
  const alloc = { LC1: 0, LC2: 0, PC1: 0, PC2: 0, HH1: 0, HH2: 0, SP: 0 };
  nonTransfers.filter(t => t.type === 'Incoming').forEach(t => {
    if (t.allocation === 'All') {
      Object.keys(FUND_FRACTIONS).forEach(f => { alloc[f] += t.amount * FUND_FRACTIONS[f]; });
    } else {
      const match = t.allocation.match(/^(LC1|LC2|PC1|PC2|HH1|HH2)/);
      if (match) alloc[match[1]] += t.amount;
      else if (t.allocation === 'Special Project') alloc['SP'] += t.amount;
    }
  });
  const totalAllocated = Object.values(alloc).reduce((s, v) => s + v, 0);
  const externalAllocated = totalAllocated - (alloc['LC1'] || 0);
  const expectedPER = totalAllocated > 0 ? Math.round((externalAllocated / totalAllocated) * 100) : 0;
  
  return { ytdIncome, ytdExpenses, actualPER, expectedPER };
}

// Inject live stats into the Local Church charity object before rendering
function updateLocalChurchCharityData() {
  if (!window.GIVING_CHARITIES || givingState.transactions.length === 0) return;
  
  const stats = getLocalChurchLiveStats();
  const lc = GIVING_CHARITIES.find(c => c.name === 'Local Church (Us)');
  if (!lc) return;
  
  const incomeStr = Math.round(stats.ytdIncome).toLocaleString();
  const expenseStr = Math.round(stats.ytdExpenses).toLocaleString();
  
  lc.amount = 'SAR ' + incomeStr;
  lc.amountNum = Math.round(stats.ytdIncome);
  lc.potentialAmount = '';
  lc.givenAmount = 'SAR ' + incomeStr;
  lc.givenLabel = 'Year to Date';
  lc.stats = {
    programs: stats.actualPER + '% to external',
    ceoPay: '$0.00 to raise $1',
    revenue: 'SAR ' + incomeStr + ' / ' + expenseStr
  };
  lc.description = 'Our local church. No fundraising costs. ' + stats.expectedPER + '% of all funds are earmarked for external programs and missions beyond the local body — this includes money already given and money still allocated to be spent. Currently at ' + stats.actualPER + '% actual.';
  lc.fullDescription = 'Our local church. No fundraising costs. ' + stats.expectedPER + '% of all funds are earmarked for external programs and missions beyond the local body — this includes money already given and money still allocated to be spent.<br><br>Past 120 days: SAR ' + incomeStr + ' received, SAR ' + expenseStr + ' spent.<br>Actual: ' + stats.actualPER + '% to external missions vs ' + stats.expectedPER + '% expected.';
}

function getCharityTransactionTotals() {
  const totals = {};
  const charityMap = {
    'Hope Village': 'Special Needs Sports Ministry',
    'Special Needs Sports': 'Special Needs Sports Ministry',
    'Stan and Tasha': 'Stan and Tasha',
    'Radical': 'Radical',
    'Crisis Aid': 'Crisis Aid International',
    'Lifesong': 'Lifesong for Orphans',
    'Send Relief': 'Send Relief',
    'Open Doors': 'Open Doors International',
    'Global Christian': 'Global Christian Relief',
    'Help The Persecuted': 'Help The Persecuted',
    'PreBorn': 'PreBorn!',
    'Joyful Joseph': 'Joyful Joseph',
    'Joyful Joshef': 'Joyful Joseph',
    'Daniels Gift': "Daniel's Gift",
    "Daniel's Gift": "Daniel's Gift",
    'Vibrating Ball': "Daniel's Gift",
    'Kenyan Mother': 'Special Projects',
    'Projector': 'Special Projects',
  };

  givingState.transactions
    .filter(t => t.type === 'Outgoing' && t.allocation !== 'Transfer within CCR')
    .forEach(t => {
      const desc = t.description;
      for (const [key, charityName] of Object.entries(charityMap)) {
        if (desc.toLowerCase().includes(key.toLowerCase())) {
          totals[charityName] = (totals[charityName] || 0) + Math.abs(t.amount);
          return;
        }
      }
    });

  return totals;
}

// Format amount for display (no currency symbol in transaction list)
function formatAmount(amount, showCurrency = false) {
  const prefix = showCurrency ? '<span style="font-size:0.65em;opacity:0.5;font-weight:500">SAR</span> ' : '';
  const val = Math.abs(amount);
  // Round to whole numbers for clean display, but keep decimals if they exist on individual transactions
  const display = Number.isInteger(val) || val >= 100 ? Math.round(val).toLocaleString() : val.toLocaleString(undefined, {maximumFractionDigits: 2});
  return prefix + display;
}

// Render Giving page
// Render just the transaction list HTML (used by toggleTransaction for partial updates)
function renderTransactionList() {
  if (givingState.transactions.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">No transactions yet</div>
        <div class="empty-sub">Add your first transaction above</div>
      </div>
    `;
  }
  return givingState.transactions.map(trans => {
    const isExpanded = givingState.expandedTransId === trans.id;
    return `
      <div class="card card-clickable" style="margin-bottom:8px;padding:10px 12px;" onclick="toggleTransaction('${trans.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;min-width:0;">
            <div class="card-meta" style="font-size:11px;">${formatDate(trans.date)} · ${trans.allocation}</div>
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(trans.description)}</div>
          </div>
          <div class="mono" style="font-size:15px;font-weight:700;color:${trans.amount > 0 ? 'var(--green)' : 'var(--red)'};white-space:nowrap;margin-left:8px;">
            ${trans.amount > 0 ? '+' : '-'}${formatAmount(trans.amount)}
          </div>
        </div>
        ${isExpanded ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;" onclick="event.stopPropagation();">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">
            <div><span style="color:var(--muted);">Type:</span> ${trans.type}</div>
            <div><span style="color:var(--muted);">Status:</span> <span style="color:${trans.status === 'Pending' ? '#d97706' : 'var(--green)'};font-weight:600;">${trans.status}</span></div>
            <div><span style="color:var(--muted);">Via:</span> ${escapeHtml(trans.via || '')}</div>
            <div><span style="color:var(--muted);">Allocation:</span> ${trans.allocation}</div>
            ${trans.donor && isAdmin() ? `<div><span style="color:var(--muted);">Donor:</span> ${escapeHtml(trans.donor)}</div>` : ''}
            ${trans.receiptId ? `<div><span style="color:var(--muted);">Receipt #:</span> ${escapeHtml(trans.receiptId)}</div>` : ''}
          </div>
          ${trans.receiptUrl ? `<div style="margin-top:8px;"><a href="${escapeHtml(trans.receiptUrl)}" target="_blank" style="color:var(--accent);font-size:12px;">📎 View Receipt</a></div>` : ''}
          ${isAdmin() ? `
            <div style="display:flex;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">
              <button class="btn btn-outline" style="font-size:10px;padding:4px 10px;min-height:auto;" onclick="editTransaction('${trans.id}')">✏️ Edit</button>
              <button class="btn btn-outline" style="font-size:10px;padding:4px 10px;min-height:auto;color:var(--red);" onclick="deleteTransaction('${trans.id}')">🗑️ Delete</button>
            </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function renderGivingPage() {
  await loadTransactions();
  const totals = calculateTotals();
  const perStats = calculatePERStats();
  const fundBalances = calculateFundBalances();
  const totalGiven = getTotalGiven();
  const charityTotals = getCharityTransactionTotals();
  const titheStats = getMonthlyTitheAverage();
  const lc1Stats = getMonthlyLC1ExpenseAverage();
  const readyToGive = getReadyToGiveFunds();
  updateLocalChurchCharityData();

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

        <!-- Balance Only -->
        <div style="display:flex;justify-content:center;margin-bottom:12px;text-align:center;">
          <div class="card info-card" style="padding:14px 32px;text-align:center;cursor:pointer;" onclick="showCardTooltip(this, 'Total Church Funds')">
            <div class="text-muted" style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Balance</div>
            <div class="mono" style="font-size:22px;font-weight:700;color:var(--accent);"><span style="font-size:0.6em;opacity:0.5;font-weight:500">SAR</span> ${Math.round(totals.balance).toLocaleString()}</div>
          </div>
        </div>

        <!-- Stats Row 1: Tithe + Expenses + Ready to Give -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;text-align:center;">
          <div class="card info-card" style="padding:10px 8px;cursor:pointer;" onclick="showCardTooltip(this, 'Average monthly tithe income over the past 120 days.')">
            <div class="text-muted" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Tithe Avg/Mon</div>
            <div class="mono" style="font-size:15px;font-weight:700;color:var(--accent);"><span style="font-size:0.6em;opacity:0.5;font-weight:500">SAR</span> ${Math.round(titheStats.average).toLocaleString()}</div>
            <div style="font-size:8px;color:var(--muted);margin-top:2px;">Past 4 months</div>
          </div>
          <div class="card info-card" style="padding:10px 8px;cursor:pointer;" onclick="showCardTooltip(this, 'Average monthly Local Church overhead over the past 120 days. Includes istarahas, food, and supplies.')">
            <div class="text-muted" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Expenses Avg/Mon</div>
            <div class="mono" style="font-size:15px;font-weight:700;color:var(--red);"><span style="font-size:0.6em;opacity:0.5;font-weight:500">SAR</span> ${Math.round(lc1Stats.average).toLocaleString()}</div>
            <div style="font-size:8px;color:var(--muted);margin-top:2px;">Past 4 months</div>
          </div>
          <div class="card info-card" style="padding:10px 8px;cursor:pointer;" onclick="showCardTooltip(this, 'Funds earmarked for the chosen charities we give to. LC2, PC1&2, and HH1&2 (excludes LC1)')">
            <div class="text-muted" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Ready to Give</div>
            <div class="mono" style="font-size:15px;font-weight:700;color:var(--green);"><span style="font-size:0.6em;opacity:0.5;font-weight:500">SAR</span> ${Math.round(readyToGive).toLocaleString()}</div>
            <div style="font-size:8px;color:var(--muted);margin-top:2px;">Non-LC1 funds</div>
          </div>
        </div>

        <!-- PER Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div class="card info-card" style="padding:10px 8px;cursor:pointer;text-align:center;" onclick="showCardTooltip(this, 'Percent of money that has gone to charities compared to all spending.')">
            <div class="text-muted" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">PER Actual</div>
            <div class="mono" style="font-size:15px;font-weight:700;color:var(--green);">${perStats.programRatioActual.toFixed(1)}%</div>
          </div>
          <div class="card info-card" style="padding:10px 8px;cursor:pointer;text-align:center;" onclick="showCardTooltip(this, 'Percent of tithe thats earmarked for missions and charities but not yet given.')">
            <div class="text-muted" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">PER Expected</div>
            <div class="mono" style="font-size:15px;font-weight:700;color:var(--accent);">${perStats.programRatioExpected.toFixed(1)}%</div>
          </div>
        </div>

        <!-- Tooltip -->
        <div id="cardTooltip" style="display:none;position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:#fff;padding:10px 16px;border-radius:10px;font-size:12px;line-height:1.5;max-width:280px;text-align:center;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <span id="cardTooltipText"></span>
        </div>

        <!-- Fund Balances Grid — 3 columns -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px;">
          ${Object.entries({...fundBalances, MC: 0}).map(([fund, balance]) => `
            <div class="info-card" style="padding:6px 8px;background:var(--card-hover);border-radius:4px;cursor:pointer;" onclick="showCardTooltip(this, '${(FUND_TOOLTIPS[fund]||'').replace(/'/g, "\\'")}')">
              <div style="font-size:9px;color:var(--muted);margin-bottom:1px;">${FUND_NAMES[fund]}</div>
              <div style="font-size:12px;font-weight:600;color:var(--green);">
                ${fund === 'MC' ? '<span style="font-size:0.65em;opacity:0.5;font-weight:500">SAR</span> 400' : (balance >= 0 ? '' : '-') + formatAmount(balance, true)}
              </div>
            </div>
          `).join('')}
        </div>

        ${isAdmin() || isEditor() ? `
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
              ${isAdmin() ? `<div class="form-group">
                <label class="form-label">Donor</label>
                <input type="text" class="form-input" id="transDonor" placeholder="Optional">
              </div>` : ''}
              <div class="form-group">
                <label class="form-label">Receipt ID</label>
                <input type="text" class="form-input" id="transReceiptId" placeholder="Optional">
              </div>
              ${isAdmin() ? `
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="transStatus">
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              ` : ''}
              <div class="form-group">
                <label class="form-label">Receipt Photo</label>
                <input type="file" class="form-input" id="transReceiptFile" accept="image/*" style="font-size:12px;">
                <input type="hidden" id="transReceiptUrl" value="">
                <div id="receiptPreview" style="margin-top:8px;display:none;">
                  <img id="receiptPreviewImg" style="max-width:100%;max-height:200px;border-radius:6px;">
                  <button type="button" class="btn btn-outline" style="font-size:10px;padding:2px 8px;margin-top:4px;" onclick="clearReceiptUpload()">✕ Remove</button>
                </div>
                <div id="receiptUploadProgress" style="display:none;margin-top:4px;font-size:11px;color:var(--muted);">Uploading...</div>
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
          ${renderTransactionList()}
        </div>
      </div>

      <!-- Charities Tab -->
      <div class="giving-tab-content ${currentGivingTab === 'charities' ? 'active' : ''}" data-tab="charities">

        <!-- Total Given Summary -->
        <div class="card giving-summary">
          <h3>Total Given</h3>
          <div class="giving-total"><span style="font-size:0.65em;opacity:0.5;font-weight:500">SAR</span> ${totalGiven.toLocaleString()}</div>
          <p style="color: var(--muted); font-size: 14px; margin-top: 8px;">
            Across ${(GIVING_CHARITIES || []).filter(c => c.status === 'given').length} charities and ministries
          </p>
          <p style="color: var(--muted); font-size: 11px; margin-top: 4px;">Since December 2025</p>
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

        <!-- Charity Cards Grid — Dashboard Style -->
        <div class="charity-grid" id="charityGrid">
          ${(GIVING_CHARITIES || []).map((charity, idx) => {
            const isVisible = activeGivingCat === 'all' || charity.category === activeGivingCat || (charity.categories && charity.categories.some(c => c.cat === activeGivingCat));

            // Score circle (top-right)
            let scoreHtml = '';
            if (charity.score === 100) scoreHtml = '<div class="card-score score-green">' + (charity.scoreLabel || '100') + '</div>';
            else if (charity.score > 0 && charity.score < 100) scoreHtml = '<div class="card-score score-yellow">' + (charity.scoreLabel || charity.score) + '</div>';
            else if (charity.score === -1) scoreHtml = '<div class="card-score score-red">' + (charity.scoreLabel || '⚠') + '</div>';
            else if (charity.score === null && charity.type === 'org') scoreHtml = '<div class="card-score score-na">' + (charity.scoreLabel || 'N/R') + '</div>';

            // Badge
            let badgeClass, badgeText;
            if (charity.status === 'given') { badgeClass = 'badge-given'; badgeText = '✓ Given'; }
            else if (charity.status === 'new') { badgeClass = 'badge-new'; badgeText = '★ New'; }
            else if (charity.type === 'org') { badgeClass = 'badge-org'; badgeText = 'Organization'; }
            else { badgeClass = 'badge-potential'; badgeText = 'Potential'; }

            // Category tag
            const catTag = charity.categories
              ? charity.categories.map(c => '<span class="cat-tag cat-tag-' + c.cat + '">' + c.label + '</span>').join(' ')
              : '<span class="cat-tag cat-tag-' + charity.category + '">' + charity.categoryLabel + '</span>';

            // Amounts from transactions
            const givenAmt = Math.round(charityTotals[charity.name] || charity.amountNum || 0);
            const amountClass = givenAmt === 0 ? 'zero' : '';
            const amountText = givenAmt === 0 ? 'TBD' : 'SAR ' + givenAmt.toLocaleString();

            // Short description
            const shortDesc = charity.description.length > 120 ? charity.description.substring(0, 120) + '...' : charity.description;

            return '<div class="giving-charity-card ' + (isVisible ? '' : 'dimmed') + ' cat-' + charity.category + '" data-category="' + charity.category + '" data-categories="' + (charity.categories ? charity.categories.map(c => c.cat).join(',') : charity.category) + '" data-index="' + idx + '" data-charity-name="' + escapeHtml(charity.name) + '" onclick="openCharityModal(this.dataset.charityName)">' +
              scoreHtml +
              (charity.image ? '<div class="card-img"><img src="' + charity.image + '" alt="' + escapeHtml(charity.name) + '"></div>' : '') +
              '<div class="card-top"><div>' + catTag + '<div class="card-name">' + escapeHtml(charity.name) + '</div></div><span class="card-badge ' + badgeClass + '">' + badgeText + '</span></div>' +
              '<div class="card-desc">' + escapeHtml(shortDesc) + '</div>' +
              '<div class="card-footer"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">' + (charity.givenLabel || 'Previously Given') + '</div><div class="card-amount ' + amountClass + '" style="color:#60a5fa">' + (charity.givenAmount || (charity.status === 'given' ? amountText : '—')) + '</div><div class="card-freq">' + (charity.frequency || '') + '</div></div><div style="text-align:right"><div style="font-size:11px;color:var(--accent);margin-top:4px;cursor:pointer">Click for details</div></div></div>' +
            '</div>';
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Filter charities by category — matches dashboard filterCat()
function filterGivingCategory(cat) {
  activeGivingCat = cat;
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  const grid = document.getElementById('charityGrid');
  if (!grid) return;
  const cards = Array.from(grid.children);

  if (cat === 'all') {
    cards.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
    cards.forEach(card => {
      card.classList.remove('dimmed');
      grid.appendChild(card);
    });
  } else {
    const matching = [];
    const dimmed = [];
    cards.forEach(card => {
      const cardCats = (card.dataset.categories || card.dataset.category).split(',');
      if (cardCats.includes(cat)) {
        card.classList.remove('dimmed');
        matching.push(card);
      } else {
        card.classList.add('dimmed');
        dimmed.push(card);
      }
    });
    matching.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
    dimmed.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
    matching.forEach(c => grid.appendChild(c));
    dimmed.forEach(c => grid.appendChild(c));
  }
}

// Open charity modal — matches dashboard openModal() exactly
function openCharityModal(charityName) {
  if (!window.GIVING_CHARITIES) { console.error('GIVING_CHARITIES not loaded'); return; }
  var r = GIVING_CHARITIES.find(function(c) { return c.name === charityName; });
  if (!r) { console.error('Charity not found:', charityName); return; }

  // Create overlay + modal if needed
  var overlay = document.getElementById('charityModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'charityModalOverlay';
    overlay.className = 'charity-modal-overlay';
    overlay.innerHTML = '<div class="charity-modal" id="charityModalContent"></div>';
    overlay.onclick = function(e) { if (e.target === overlay) closeCharityModal(); };
    document.body.appendChild(overlay);
  }
  var modal = document.getElementById('charityModalContent');

  // Refresh Local Church live stats before displaying modal
  updateLocalChurchCharityData();
  
  // Get Firestore-based amount
  var totals = getCharityTransactionTotals();
  var givenAmt = Math.round(totals[r.name] || r.amountNum || 0);
  // For Local Church, use the live YTD income instead of outgoing charity total
  if (r.name === 'Local Church (Us)') givenAmt = r.amountNum;
  var amountDisplay = givenAmt > 0 ? 'SAR ' + givenAmt.toLocaleString() : 'TBD';

  var content = '<button class="modal-close" onclick="closeCharityModal()">&times;</button>';

  // Header with image + name
  if (r.image) {
    content += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">';
    content += '<img src="' + r.image + '" style="width:64px;height:64px;object-fit:contain;border-radius:10px;background:var(--card-hover);padding:4px" alt="' + escapeHtml(r.name) + '">';
    content += '<h2 style="margin:0">' + escapeHtml(r.name) + '</h2></div>';
  } else {
    content += '<h2>' + escapeHtml(r.name) + '</h2>';
  }

  // Category tag + frequency + amount
  var catColors = {church:'#60a5fa',orphan:'#d4a017',persecuted:'#f97316',word:'#22c55e',local:'#4ade80',global:'#6088e0'};
  var cc = catColors[r.category] || 'var(--muted)';
  content += '<div class="modal-sub"><span style="color:' + cc + ';font-weight:600">' + r.categoryLabel + '</span> · ' + (r.frequency || '') + ' · ' + amountDisplay + '</div>';

  // Full description
  content += '<div class="modal-desc">' + (r.fullDescription || r.description) + '</div>';

  // Ministry Location
  if (r.location) {
    content += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 14px;background:var(--bg, #f8fafc);border:1px solid var(--border, #e2e5ed);border-radius:8px">';
    content += '<span style="font-size:16px">📍</span>';
    content += '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted, #6b7185);margin-bottom:2px">Ministry Location</div>';
    content += '<div style="font-size:13px;font-weight:500">' + r.location + '</div></div></div>';
  }

  // Links
  if (r.link) content += '<a class="modal-link" href="' + r.link + '" target="_blank">' + r.link + ' ↗</a><br>';
  if (r.link2) content += '<a class="modal-link" href="' + r.link2 + '" target="_blank">' + r.link2 + ' ↗</a><br>';

  // Stats bar (orgs)
  if (r.type === 'org' && r.stats) {
    content += '<div class="modal-stats">';
    content += '<div class="modal-stat"><div class="stat-label">$ to Mission</div><div class="stat-value">' + r.stats.programs + '</div></div>';
    if (r.stats.ceoPay) content += '<div class="modal-stat"><div class="stat-label">Fundraiser Efficiency</div><div class="stat-value">' + r.stats.ceoPay + '</div></div>';
    content += '<div class="modal-stat"><div class="stat-label">Revenue</div><div class="stat-value">' + r.stats.revenue + '</div></div>';
    content += '</div>';
  }

  // Full audit section
  if (r.type === 'org' && r.audit) {
    var a = r.audit;
    var scoreColor = a.score >= 80 ? '#16a34a' : a.score >= 60 ? '#ca8a04' : a.score === null ? '#94a3b8' : '#dc2626';
    var scoreBg = a.score >= 80 ? '#dcfce7' : a.score >= 60 ? '#fef9c3' : a.score === null ? '#f1f5f9' : '#fee2e2';

    content += '<div style="border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:12px;background:var(--card-hover)">';

    // Charity Audit header + score circle
    content += '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px">';
    content += '<div><div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Charity Audit</div>';
    content += '<div style="font-size:11px;color:var(--muted)">' + a.ein + ' · ' + (a.location || '') + '</div></div>';
    content += '<div style="text-align:center"><div style="width:52px;height:52px;border-radius:50%;border:3px solid ' + scoreColor + ';background:' + scoreBg + ';display:flex;flex-direction:column;align-items:center;justify-content:center">';
    content += '<div style="font-size:18px;font-weight:800;color:' + scoreColor + '">' + (a.score !== null ? a.score : 'N/R') + '</div></div>';
    content += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + (a.scoreSource || 'Charity Navigator') + '</div></div></div>';

    // What They Do
    if (a.programs) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:2px">What They Do</div>';
      content += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;margin-bottom:14px">';
      a.programs.forEach(function(p) {
        var parts = p.split(' — ');
        var bold = parts[0];
        var rest = parts.length > 1 ? ' — ' + parts.slice(1).join(' — ') : '';
        content += '<div style="font-size:11px;display:flex;align-items:baseline;gap:5px"><span style="color:#2563eb">•</span><span><strong>' + bold + '</strong>' + rest + '</span></div>';
      });
      content += '</div>';
    }

    // Mission & Outreach
    if (a.mission) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:2px">Mission & Outreach</div>';
      content += '<div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-left:4px solid #2563eb;border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.6;color:#1e40af;margin-bottom:14px">' + a.mission + '</div>';
    }

    // Financials table
    if (a.financials) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:2px">Financials</div>';
      content += '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:14px">';
      a.financials.forEach(function(f, i) {
        var bg = i % 2 === 0 ? 'var(--card-hover)' : 'transparent';
        var pill = f.rating ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + (f.ratingColor === 'green' ? '#dcfce7' : f.ratingColor === 'red' ? '#fee2e2' : '#fef9c3') + ';color:' + (f.ratingColor === 'green' ? '#166534' : f.ratingColor === 'red' ? '#991b1b' : '#854d0e') + '">' + f.rating + '</span>' : '';
        content += '<tr style="background:' + bg + '"><td style="padding:5px 8px;color:var(--muted)">' + f.metric + '</td><td style="padding:5px 8px;font-weight:700">' + f.value + '</td><td style="padding:5px 8px">' + pill + '</td></tr>';
      });
      content += '</table>';
    }

    // Leadership table
    if (a.leaders) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:2px">Leadership</div>';
      content += '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:14px">';
      a.leaders.forEach(function(l, i) {
        var bg = i % 2 === 0 ? 'var(--card-hover)' : 'transparent';
        content += '<tr style="background:' + bg + '"><td style="padding:4px 8px;font-weight:600">' + l.name + '</td><td style="padding:4px 8px;color:var(--muted)">' + l.role + '</td><td style="padding:4px 8px;font-weight:700">' + l.comp + '</td></tr>';
      });
      content += '</table>';
      if (a.leaderNote) content += '<div style="font-size:11px;color:var(--muted);margin-bottom:14px">' + a.leaderNote + '</div>';
    }

    // Governance
    if (a.governance) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:2px">Governance</div>';
      content += '<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:10px">';
      a.governance.forEach(function(g) { content += '<span style="font-size:11px;color:#166534">✓ ' + g + '</span>'; });
      content += '</div>';
    }

    // Critics Say
    if (a.critics && a.critics.length) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #dc2626;display:inline-block;padding-bottom:2px">⚖️ Critics Say</div>';
      content += '<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:10px 12px;margin-bottom:14px">';
      a.critics.forEach(function(c) { content += '<div style="font-size:12px;line-height:1.6;margin-bottom:4px;display:flex;gap:6px"><span style="color:#dc2626;flex-shrink:0">✗</span><span>' + c + '</span></div>'; });
      content += '</div>';
    }

    // Ambassadors Say
    if (a.ambassadors && a.ambassadors.length) {
      content += '<div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;border-bottom:2px solid #16a34a;display:inline-block;padding-bottom:2px">🤝 Ambassadors Say</div>';
      content += '<div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:10px 12px;margin-bottom:14px">';
      a.ambassadors.forEach(function(c) { content += '<div style="font-size:12px;line-height:1.6;margin-bottom:4px;display:flex;gap:6px"><span style="color:#16a34a;flex-shrink:0">✓</span><span>' + c + '</span></div>'; });
      content += '</div>';
    }

    // Red flags
    if (a.redflags) {
      var rfBg = a.redflagLevel === 'clean' ? '#dcfce7' : a.redflagLevel === 'warning' ? '#fee2e2' : '#fef3c7';
      var rfBorder = a.redflagLevel === 'clean' ? '#16a34a' : a.redflagLevel === 'warning' ? '#dc2626' : '#d97706';
      content += '<div style="border-left:4px solid ' + rfBorder + ';background:' + rfBg + ';border-radius:8px;padding:10px 12px;font-size:12px;margin-bottom:14px">' + a.redflags + '</div>';
    }

    // Verdict
    if (a.verdict) {
      content += '<div style="background:var(--card-hover);border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-size:12px;line-height:1.6">' + a.verdict + '</div>';
    }

    if (a.sources) content += '<div style="font-size:9px;color:var(--muted);margin-top:8px">' + a.sources + '</div>';
    content += '</div>'; // close audit box
  }

  // Update box
  if (r.updatePdf) {
    content += '<div class="update-box" style="background:var(--card-hover);border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:12px;max-height:none;overflow:visible">';
    content += '<h3 style="font-size:13px;color:var(--muted);margin-bottom:8px">📋 Latest Update</h3>';
    content += '<div style="font-size:13px;line-height:1.8;white-space:normal;word-wrap:break-word;margin-bottom:12px">' + (r.updateText || '') + '</div>';
    content += '<iframe style="width:100%;height:500px;border:1px solid var(--border);border-radius:8px;margin-top:12px" src="' + r.updatePdf + '"></iframe>';
    if (r.lastUpdate) content += '<p style="margin-top:12px;font-size:11px;color:var(--muted)">Last updated: ' + r.lastUpdate + '</p>';
    content += '</div>';
  } else {
    content += '<div class="update-box" style="background:var(--card-hover);border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:12px;max-height:none;overflow:visible">';
    content += '<h3 style="font-size:13px;color:var(--muted);margin-bottom:8px">📋 Latest Update</h3>';
    content += '<div style="font-size:13px;line-height:1.8;white-space:normal;word-wrap:break-word">' + (r.updateText || 'No updates yet.') + '</div>';
    if (r.lastUpdate) content += '<p style="margin-top:12px;font-size:11px;color:var(--muted)">Last updated: ' + r.lastUpdate + '</p>';
    content += '</div>';
  }

  modal.innerHTML = content;
  overlay.classList.add('show');
}

// Close charity modal
function closeCharityModal() {
  var overlay = document.getElementById('charityModalOverlay');
  if (overlay) overlay.classList.remove('show');
}

// Escape key closes charity modal
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeCharityModal(); });

// Initialize Giving page
async function initGivingPage() {
  await loadTransactions();

  // Tab switching — toggle visibility instead of full re-render
  document.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentGivingTab = btn.dataset.tab;
      // Update button styles
      document.querySelectorAll('button[data-tab]').forEach(b => {
        b.className = `btn ${b.dataset.tab === currentGivingTab ? 'btn-primary' : 'btn-outline'}`;
      });
      // Toggle tab content visibility
      document.querySelectorAll('.giving-tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === currentGivingTab);
      });
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
      document.getElementById('transDesc').focus();
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

  // Receipt file preview
  const fileInput = document.getElementById('transReceiptFile');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      const preview = document.getElementById('receiptPreview');
      const img = document.getElementById('receiptPreviewImg');
      if (file && preview && img) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Clear receipt upload
function clearReceiptUpload() {
  const fileInput = document.getElementById('transReceiptFile');
  if (fileInput) fileInput.value = '';
  const preview = document.getElementById('receiptPreview');
  if (preview) preview.style.display = 'none';
  const hidden = document.getElementById('transReceiptUrl');
  if (hidden) hidden.value = '';
}

// Save transaction
async function saveTransaction() {
  if (givingState.submitting) return;
  givingState.submitting = true;
  const submitBtn = document.querySelector('#transactionFormElement button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const date = document.getElementById('transDate').value;
    const description = document.getElementById('transDesc').value.trim();
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    const via = document.getElementById('transVia').value.trim();
    const allocation = document.getElementById('transAllocation').value;
    
    // Fields available to both editor and admin
    const donor = document.getElementById('transDonor') ? 
      document.getElementById('transDonor').value.trim() || null : null;
    const receiptId = document.getElementById('transReceiptId') ? 
      document.getElementById('transReceiptId').value.trim() || null : null;
    // Receipt URL — either from file upload or existing value
    let receiptUrl = document.getElementById('transReceiptUrl') ? 
      document.getElementById('transReceiptUrl').value.trim() || null : null;
    
    // Upload receipt file to ImgBB if selected
    const fileInput = document.getElementById('transReceiptFile');
    if (fileInput && fileInput.files.length > 0) {
      const progressEl = document.getElementById('receiptUploadProgress');
      if (progressEl) { progressEl.style.display = 'block'; progressEl.textContent = 'Uploading receipt...'; }
      try {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('image', file);
        const resp = await fetch('https://api.imgbb.com/1/upload?key=715755d5fd0228b1579d318f1e7feb91', {
          method: 'POST',
          body: formData
        });
        const result = await resp.json();
        if (result.success) {
          receiptUrl = result.data.display_url;
        } else {
          throw new Error(result.error?.message || 'Upload failed');
        }
        if (progressEl) progressEl.style.display = 'none';
      } catch (uploadErr) {
        console.error('Receipt upload failed:', uploadErr);
        if (progressEl) { progressEl.textContent = 'Upload failed — saving without receipt'; }
      }
    }
    // Status: only admin can set, editors default to Pending
    const status = isAdmin() && document.getElementById('transStatus') ? 
      document.getElementById('transStatus').value : 'Pending';

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

      // Send push notification to admins for new transactions (non-blocking)
      try { if (typeof sendPushNotification === 'function') await sendPushNotification('transaction', '💰 New Transaction', description, 'admin'); } catch(e){ console.warn('Push failed:',e.message); }
    }

    givingState.showAddForm = false;
    givingState.editingId = null;
    givingState.transactionsLoaded = false; // Force refresh after save
    document.getElementById('app').innerHTML = await renderGivingPage();
    await initGivingPage();
  } catch (error) {
    console.error('Error saving transaction:', error);
    alert('Error saving transaction. Please try again.');
  } finally {
    givingState.submitting = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Toggle transaction expand
function toggleTransaction(id) {
  givingState.expandedTransId = givingState.expandedTransId === id ? null : id;
  // Re-render only the transaction list, not the whole page
  const listEl = document.getElementById('transactionList');
  if (listEl) {
    listEl.innerHTML = renderTransactionList();
  }
}

// Edit transaction
function editTransaction(id) {
  if (!isAdmin()) return;
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
  
  // Shared fields (editor + admin)
  if (document.getElementById('transDonor')) document.getElementById('transDonor').value = trans.donor || '';
  if (document.getElementById('transReceiptId')) document.getElementById('transReceiptId').value = trans.receiptId || '';
  if (document.getElementById('transReceiptUrl')) document.getElementById('transReceiptUrl').value = trans.receiptUrl || '';
  // Show existing receipt preview if editing
  if (trans.receiptUrl) {
    const preview = document.getElementById('receiptPreview');
    const img = document.getElementById('receiptPreviewImg');
    if (preview && img) { img.src = trans.receiptUrl; preview.style.display = 'block'; }
  }
  // Admin-only
  if (isAdmin() && document.getElementById('transStatus')) document.getElementById('transStatus').value = trans.status || 'Pending';
  
  document.getElementById('addTransactionForm').style.display = 'block';
  document.getElementById('addTransactionForm').scrollIntoView({ behavior: 'smooth' });
}

// Delete transaction
async function deleteTransaction(id) {
  if (!isAdmin()) return;
  if (!confirm('Delete this transaction?')) return;

  try {
    await db.collection('transactions').doc(id).delete();
    givingState.transactionsLoaded = false; // Force refresh after delete
    document.getElementById('app').innerHTML = await renderGivingPage();
    await initGivingPage();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    alert('Error deleting transaction. Please try again.');
  }
}
// Tooltip system for info cards
let tooltipTimer = null;
function showCardTooltip(el, text) {
  console.log('Tooltip clicked:', text);
  if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; }
  const tip = document.getElementById('cardTooltip');
  const tipText = document.getElementById('cardTooltipText');
  if (!tip || !tipText) { console.warn('Tooltip element not found'); return; }
  tipText.textContent = text;
  tip.style.display = 'block';
  tooltipTimer = setTimeout(() => { tip.style.display = 'none'; tooltipTimer = null; }, 4000);
}
