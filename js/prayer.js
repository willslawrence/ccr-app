/* ====================================
   PRAYER REQUESTS PAGE
   ==================================== */

let prayerState = {
  prayers: [],
  searchQuery: '',
  expandedId: null,
  showAddForm: false,
  showSearch: false
};

function renderPrayerPage() {
  return `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">🙏 Prayer Requests</h1>
        <p class="page-subtitle">Share prayer needs and pray for one another</p>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" id="addPrayerBtn">+ Add Request</button>
        <button class="btn btn-outline" id="searchPrayerBtn">🔍 Search</button>
      </div>

      <div class="search-bar" id="prayerSearchBar" style="display:none;">
        <span class="search-icon">🔍</span>
        <input type="text" id="prayerSearchInput" placeholder="Search prayer requests...">
      </div>

      <div id="addPrayerForm" style="display:none;margin-bottom:24px;">
        <div class="card">
          <h3 style="margin-bottom:16px;">New Prayer Request</h3>
          <form id="prayerFormElement">
            <div class="form-group">
              <label class="form-label">Short Description *</label>
              <input type="text" class="form-input" id="prayerShortDesc" placeholder="One line summary" required>
            </div>
            <div class="form-group">
              <label class="form-label">Longer Description (optional)</label>
              <textarea class="form-textarea" id="prayerLongDesc" placeholder="Share more details..."></textarea>
            </div>
            <div class="form-checkbox">
              <input type="checkbox" id="prayerAnonymous">
              <label>Submit anonymously</label>
            </div>
            <div class="btn-group" style="margin-top:20px;">
              <button type="submit" class="btn btn-primary">Submit Request</button>
              <button type="button" class="btn btn-outline" id="cancelPrayerBtn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div id="prayerList"></div>
      <div id="prayerEmpty" class="empty-state" style="display:none;">
        <div class="empty-icon">🙏</div>
        <div class="empty-text">No prayer requests yet</div>
        <div class="empty-sub">Be the first to share a prayer need</div>
      </div>
    </div>
  `;
}

function initPrayerPage() {
  loadPrayers();
  renderPrayers();

  const addBtn = document.getElementById('addPrayerBtn');
  const searchBtn = document.getElementById('searchPrayerBtn');
  const cancelBtn = document.getElementById('cancelPrayerBtn');
  const form = document.getElementById('prayerFormElement');
  const searchInput = document.getElementById('prayerSearchInput');

  addBtn.addEventListener('click', () => {
    prayerState.showAddForm = !prayerState.showAddForm;
    document.getElementById('addPrayerForm').style.display = prayerState.showAddForm ? 'block' : 'none';
    if (prayerState.showAddForm) {
      document.getElementById('prayerShortDesc').focus();
    }
  });

  searchBtn.addEventListener('click', () => {
    prayerState.showSearch = !prayerState.showSearch;
    document.getElementById('prayerSearchBar').style.display = prayerState.showSearch ? 'block' : 'none';
    if (prayerState.showSearch) {
      searchInput.focus();
    }
  });

  cancelBtn.addEventListener('click', () => {
    prayerState.showAddForm = false;
    document.getElementById('addPrayerForm').style.display = 'none';
    form.reset();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addPrayer();
  });

  searchInput.addEventListener('input', (e) => {
    prayerState.searchQuery = e.target.value.toLowerCase();
    renderPrayers();
  });
}

function loadPrayers() {
  prayerState.prayers = JSON.parse(localStorage.getItem('ccr_prayers') || '[]');
}

function savePrayers() {
  localStorage.setItem('ccr_prayers', JSON.stringify(prayerState.prayers));
}

function addPrayer() {
  const user = getCurrentUser();
  const shortDesc = document.getElementById('prayerShortDesc').value.trim();
  const longDesc = document.getElementById('prayerLongDesc').value.trim();
  const anonymous = document.getElementById('prayerAnonymous').checked;

  const prayer = {
    id: 'prayer_' + Date.now(),
    shortDesc,
    longDesc,
    submittedBy: user.uid,
    submitterName: anonymous ? 'Anonymous' : user.name,
    anonymous,
    answered: false,
    answeredAt: null,
    prayingCount: 0,
    prayedBy: [],
    createdAt: new Date().toISOString()
  };

  prayerState.prayers.unshift(prayer);
  savePrayers();

  document.getElementById('prayerFormElement').reset();
  prayerState.showAddForm = false;
  document.getElementById('addPrayerForm').style.display = 'none';
  renderPrayers();
}

function togglePrayer(id) {
  prayerState.expandedId = prayerState.expandedId === id ? null : id;
  renderPrayers();
}

function prayForRequest(id) {
  const user = getCurrentUser();
  const prayer = prayerState.prayers.find(p => p.id === id);
  if (!prayer) return;

  if (!prayer.prayedBy.includes(user.uid)) {
    prayer.prayedBy.push(user.uid);
    prayer.prayingCount++;
    savePrayers();
    renderPrayers();
  }
}

function markAnswered(id) {
  const prayer = prayerState.prayers.find(p => p.id === id);
  if (!prayer) return;

  prayer.answered = true;
  prayer.answeredAt = new Date().toISOString();
  savePrayers();
  renderPrayers();
}

function deletePrayer(id) {
  if (!confirm('Delete this prayer request?')) return;

  prayerState.prayers = prayerState.prayers.filter(p => p.id !== id);
  savePrayers();
  renderPrayers();
}

function editPrayer(id) {
  const prayer = prayerState.prayers.find(p => p.id === id);
  if (!prayer) return;

  const shortDesc = prompt('Short description:', prayer.shortDesc);
  if (shortDesc === null) return;

  const longDesc = prompt('Longer description:', prayer.longDesc);
  if (longDesc === null) return;

  prayer.shortDesc = shortDesc.trim();
  prayer.longDesc = longDesc.trim();
  savePrayers();
  renderPrayers();
}

function renderPrayers() {
  const list = document.getElementById('prayerList');
  const empty = document.getElementById('prayerEmpty');
  const user = getCurrentUser();

  // Filter prayers
  let prayers = prayerState.prayers;
  if (prayerState.searchQuery) {
    prayers = prayers.filter(p =>
      p.shortDesc.toLowerCase().includes(prayerState.searchQuery) ||
      p.longDesc.toLowerCase().includes(prayerState.searchQuery) ||
      p.submitterName.toLowerCase().includes(prayerState.searchQuery)
    );
  }

  // Sort: answered last, newest first
  prayers = [...prayers].sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (prayers.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  list.innerHTML = prayers.map(prayer => {
    const isExpanded = prayerState.expandedId === prayer.id;
    const canEdit = user.uid === prayer.submittedBy || isEditor();
    const canAnswer = user.uid === prayer.submittedBy || isEditor();
    const hasPrayed = prayer.prayedBy.includes(user.uid);

    return `
      <div class="card card-clickable" style="margin-bottom:12px;${prayer.answered ? 'opacity:0.6;' : ''}" onclick="togglePrayer('${prayer.id}')">
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-meta">${formatDate(prayer.createdAt)} · ${prayer.submitterName}</div>
            <div class="card-title">${escapeHtml(prayer.shortDesc)}</div>
          </div>
          ${prayer.answered ? '<span class="badge badge-green">✓ Answered</span>' : ''}
        </div>
        ${isExpanded ? `
          <div class="card-content" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);" onclick="event.stopPropagation();">
            ${prayer.longDesc ? `<p style="margin-bottom:16px;">${escapeHtml(prayer.longDesc)}</p>` : ''}

            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
              <button class="btn ${hasPrayed ? 'btn-outline' : 'btn-primary'}" style="font-size:13px;padding:8px 16px;" onclick="prayForRequest('${prayer.id}')" ${hasPrayed ? 'disabled' : ''}>
                🙏 ${hasPrayed ? 'Prayed' : 'Pray'}
              </button>
              <span class="text-muted" style="font-size:13px;">${prayer.prayingCount} ${prayer.prayingCount === 1 ? 'person' : 'people'} praying</span>
            </div>

            <div class="btn-group">
              ${!prayer.answered && canAnswer ? `<button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="markAnswered('${prayer.id}')">✓ Mark Answered</button>` : ''}
              ${canEdit ? `<button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editPrayer('${prayer.id}')">✏️ Edit</button>` : ''}
              ${canEdit ? `<button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="deletePrayer('${prayer.id}')">🗑️ Delete</button>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}
