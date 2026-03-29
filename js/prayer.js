/* ====================================
   PRAYER REQUESTS PAGE - Firestore
   ==================================== */

let prayerState = {
  prayers: [],
  searchQuery: '',
  expandedId: null,
  showAddForm: false,
  showSearch: false,
  editingId: null,
  prayedThisSession: new Set(),
  dataLoaded: false
};

function renderPrayerPage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">🙏 Prayer Requests</h1>
          <p class="page-subtitle">Share prayer needs and pray for one another</p>
        </div>

        <div class="btn-group">
          <button class="btn btn-primary" id="addPrayerBtn">+ Add Request</button>
          <button class="btn btn-outline" id="searchPrayerBtn">🔍 Search</button>
        </div>
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
            <div class="form-group">
              <label class="form-label">Submitted By</label>
              <input type="text" class="form-input" id="prayerAuthor" placeholder="Your name (leave blank for current user)">
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

// Track seen prayer IDs for new prayer notification
function getSeenPrayerIds() {
  try { return new Set(JSON.parse(localStorage.getItem('ccr_seen_prayers') || '[]')); } catch(e) { return new Set(); }
}
function markPrayersSeen() {
  const ids = prayerState.prayers.map(p => p.id);
  localStorage.setItem('ccr_seen_prayers', JSON.stringify(ids));
  clearPrayerBadge();
}
function checkPrayerBadge() {
  const seen = getSeenPrayerIds();
  const unseen = prayerState.prayers.filter(p => !p.answered && !seen.has(p.id));
  if (unseen.length > 0) {
    showPrayerBadge(unseen.length);
  } else {
    clearPrayerBadge();
  }
}
function showPrayerBadge(count) {
  document.querySelectorAll('.fab-item[data-page="prayer"], button[data-page="prayer"]').forEach(el => {
    if (!el.querySelector('.prayer-badge')) {
      const badge = document.createElement('span');
      badge.className = 'prayer-badge';
      badge.style.cssText = 'position:absolute;top:-2px;right:-2px;background:#dc2626;color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;';
      badge.textContent = count;
      el.style.position = 'relative';
      el.appendChild(badge);
    } else {
      el.querySelector('.prayer-badge').textContent = count;
    }
  });
  // Also badge the home grid button
  document.querySelectorAll('[onclick*="prayer"], [data-page="prayer"]').forEach(el => {
    if (!el.querySelector('.prayer-badge')) {
      const badge = document.createElement('span');
      badge.className = 'prayer-badge';
      badge.style.cssText = 'position:absolute;top:4px;right:4px;background:#dc2626;color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;';
      badge.textContent = count;
      el.style.position = 'relative';
      el.appendChild(badge);
    }
  });
}
function clearPrayerBadge() {
  document.querySelectorAll('.prayer-badge').forEach(b => b.remove());
}

async function initPrayerPage() {
  await loadPrayers();
  markPrayersSeen();
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

async function loadPrayers(forceRefresh = false) {
  if (prayerState.dataLoaded && !forceRefresh) return;
  try {
    const snapshot = await db.collection('prayers')
      .orderBy('createdAt', 'desc')
      .get();

    prayerState.prayers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      answeredAt: doc.data().answeredAt?.toDate?.()?.toISOString() || doc.data().answeredAt
    }));
    prayerState.dataLoaded = true;
  } catch (error) {
    console.error('Error loading prayers:', error);
    prayerState.prayers = [];
  }
}

async function addPrayer() {
  const user = getCurrentUser();
  const shortDesc = document.getElementById('prayerShortDesc').value.trim();
  const longDesc = document.getElementById('prayerLongDesc').value.trim();
  const anonymous = document.getElementById('prayerAnonymous').checked;
  const customAuthor = document.getElementById('prayerAuthor').value.trim();

  const authorName = anonymous ? 'Anonymous' : (customAuthor || user.name);

  const prayer = {
    text: shortDesc,
    shortDesc,
    longDesc,
    author: authorName,
    authorId: user.uid,
    submittedBy: user.uid,
    submitterName: authorName,
    anonymous,
    answered: false,
    answeredAt: null,
    prayingCount: 0,
    prayedBy: [],
    createdAt: firebase.firestore.Timestamp.now()
  };

  try {
    await db.collection('prayers').add(prayer);
    await loadPrayers();

    // Send push notification
    try { if (typeof sendPushNotification === 'function') { await sendPushNotification('prayer', '🙏 New Prayer Request', shortDesc, 'all'); } } catch(e) { console.warn('Push failed:', e.message); }
    
    // Suggest enabling notifications for first-time users
    suggestNotifications();

    document.getElementById('prayerFormElement').reset();
    prayerState.showAddForm = false;
    document.getElementById('addPrayerForm').style.display = 'none';
    renderPrayers();
  } catch (error) {
    console.error('Error adding prayer:', error);
    alert('Failed to add prayer request. Please try again.');
  }
}

function togglePrayer(id) {
  if (prayerState.editingId) return; // don't toggle while editing
  prayerState.expandedId = prayerState.expandedId === id ? null : id;
  renderPrayers();
}

function prayForRequest(id) {
  if (!prayerState.prayedThisSession) prayerState.prayedThisSession = new Set();
  prayerState.prayedThisSession.add(id);
  renderPrayers();
}

const _prayerBusy = new Set();

async function markAnswered(id) {
  if (_prayerBusy.has(id)) return;
  _prayerBusy.add(id);

  // Optimistic: update local state + re-render immediately
  const prayer = prayerState.prayers.find(p => p.id === id);
  if (prayer) {
    prayer.answered = true;
    prayer.answeredAt = new Date().toISOString();
    renderPrayers();
  }

  try {
    await db.collection('prayers').doc(id).update({
      answered: true,
      answeredAt: firebase.firestore.Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking prayer as answered:', error);
    // Revert on failure
    if (prayer) { prayer.answered = false; prayer.answeredAt = null; renderPrayers(); }
    alert('Failed to mark as answered. Please try again.');
  } finally {
    _prayerBusy.delete(id);
  }
}

async function unmarkAnswered(id) {
  if (_prayerBusy.has(id)) return;
  _prayerBusy.add(id);

  // Optimistic: update local state + re-render immediately
  const prayer = prayerState.prayers.find(p => p.id === id);
  const prevAnsweredAt = prayer?.answeredAt;
  if (prayer) {
    prayer.answered = false;
    prayer.answeredAt = null;
    renderPrayers();
  }

  try {
    await db.collection('prayers').doc(id).update({
      answered: false,
      answeredAt: null
    });
  } catch (error) {
    console.error('Error unmarking prayer:', error);
    // Revert on failure
    if (prayer) { prayer.answered = true; prayer.answeredAt = prevAnsweredAt; renderPrayers(); }
    alert('Failed to unmark as answered. Please try again.');
  } finally {
    _prayerBusy.delete(id);
  }
}

async function deletePrayer(id) {
  if (!confirm('Delete this prayer request?')) return;

  try {
    await db.collection('prayers').doc(id).delete();
    await loadPrayers();
    renderPrayers();
  } catch (error) {
    console.error('Error deleting prayer:', error);
    alert('Failed to delete prayer. Please try again.');
  }
}

function startEditPrayer(id) {
  prayerState.editingId = id;
  prayerState.expandedId = id;
  renderPrayers();
}

function cancelEditPrayer() {
  prayerState.editingId = null;
  renderPrayers();
}

async function saveEditPrayer(id) {
  const shortDesc = document.getElementById('editPrayerShortDesc').value.trim();
  const longDesc = document.getElementById('editPrayerLongDesc').value.trim();
  const author = document.getElementById('editPrayerAuthor').value.trim();
  const dateStr = document.getElementById('editPrayerDate').value;

  if (!shortDesc) {
    alert('Short description is required.');
    return;
  }

  const updates = {
    shortDesc,
    longDesc,
    text: shortDesc,
    submitterName: author || 'Anonymous',
    author: author || 'Anonymous'
  };

  // Update date if changed
  if (dateStr) {
    updates.createdAt = firebase.firestore.Timestamp.fromDate(new Date(dateStr));
  }

  try {
    await db.collection('prayers').doc(id).update(updates);
    prayerState.editingId = null;
    await loadPrayers();
    renderPrayers();
  } catch (error) {
    console.error('Error editing prayer:', error);
    alert('Failed to edit prayer. Please try again.');
  }
}

// Swipe-to-pray removed — was too greedy with touch events and broke page scrolling

function renderPrayers() {
  const list = document.getElementById('prayerList');
  const empty = document.getElementById('prayerEmpty');
  const user = getCurrentUser();

  // Filter prayers
  let prayers = prayerState.prayers;
  if (prayerState.searchQuery) {
    prayers = prayers.filter(p =>
      (p.shortDesc || '').toLowerCase().includes(prayerState.searchQuery) ||
      (p.longDesc || '').toLowerCase().includes(prayerState.searchQuery) ||
      (p.submitterName || '').toLowerCase().includes(prayerState.searchQuery)
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
    const isEditing = prayerState.editingId === prayer.id;
    const canEdit = user.uid === prayer.submittedBy || isEditor();
    const canAnswer = user.uid === prayer.submittedBy || isEditor();
    const hasPrayed = prayerState.prayedThisSession && prayerState.prayedThisSession.has(prayer.id);

    // Format date for the date input
    const prayerDate = prayer.createdAt ? new Date(prayer.createdAt) : new Date();
    const dateInputVal = prayerDate.toISOString().slice(0, 16);

    if (isEditing) {
      return `
        <div class="card" style="margin-bottom:12px;">
          <h3 style="margin-bottom:16px;">Edit Prayer Request</h3>
          <div class="form-group">
            <label class="form-label">Short Description *</label>
            <input type="text" class="form-input" id="editPrayerShortDesc" value="${escapeHtml(prayer.shortDesc || prayer.text || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Longer Description</label>
            <textarea class="form-textarea" id="editPrayerLongDesc">${escapeHtml(prayer.longDesc || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Submitted By</label>
            <input type="text" class="form-input" id="editPrayerAuthor" value="${escapeHtml(prayer.submitterName || prayer.author || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="datetime-local" class="form-input" id="editPrayerDate" value="${dateInputVal}">
          </div>
          <div class="btn-group" style="margin-top:16px;">
            <button class="btn btn-primary" onclick="saveEditPrayer('${prayer.id}')">Save</button>
            <button class="btn btn-outline" onclick="cancelEditPrayer()">Cancel</button>
          </div>
        </div>
      `;
    }

    return `
      <div style="margin-bottom:12px;">
          <div class="card card-clickable" style="margin:0;${prayer.answered ? 'opacity:0.6;' : ''}display:flex;align-items:stretch;gap:0;padding:0;overflow:hidden;" onclick="togglePrayer('${prayer.id}')">
            <button class="pray-side-btn ${hasPrayed ? 'prayed' : ''}" onclick="event.stopPropagation(); prayForRequest('${prayer.id}')" ${hasPrayed ? 'disabled' : ''} title="${hasPrayed ? 'Prayed' : 'Pray'}">
              <span>P</span><span>R</span><span>A</span><span>Y</span>
            </button>
            <div style="flex:1;padding:12px 14px;">
            <div class="card-header">
              <div style="flex:1;">
                <div class="card-meta">${formatDate(prayer.createdAt)} · ${escapeHtml(prayer.submitterName || 'Unknown')}</div>
                <div class="card-title">${escapeHtml(prayer.shortDesc || prayer.text || '')}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${prayer.answered ? '<span class="badge badge-green">✓ Answered</span>' : ''}
              </div>
            </div>
            ${isExpanded ? `
              <div class="card-content" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);" onclick="event.stopPropagation();">
                ${prayer.longDesc ? `<p style="margin-bottom:16px;">${escapeHtml(prayer.longDesc)}</p>` : ''}

                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                  ${!prayer.answered && canAnswer ? `<button class="btn btn-outline" style="font-size:11px;padding:4px 10px;min-height:28px;border-radius:6px;" onclick="markAnswered('${prayer.id}')">✓ Answered</button>` : ''}
                  ${prayer.answered && canAnswer ? `<button class="btn btn-outline" style="font-size:11px;padding:4px 10px;min-height:28px;border-radius:6px;color:var(--gold);" onclick="unmarkAnswered('${prayer.id}')">↩ Unmark</button>` : ''}
                  ${canEdit ? `<button class="btn btn-outline" style="font-size:11px;padding:4px 10px;min-height:28px;border-radius:6px;" onclick="startEditPrayer('${prayer.id}')">✏️ Edit</button>` : ''}
                  ${canEdit ? `<button class="btn btn-outline" style="font-size:11px;padding:4px 10px;min-height:28px;border-radius:6px;color:var(--red);" onclick="deletePrayer('${prayer.id}')">🗑️</button>` : ''}
                </div>
              </div>
            ` : ''}
            </div>
          </div>
      </div>
    `;
  }).join('');


}
