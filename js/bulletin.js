/* ====================================
   BULLETIN PAGE
   ==================================== */

let bulletinState = {
  bulletins: [],
  currentBulletinId: null,
  showEditor: false,
  editingId: null,
  searchQuery: ''
};

function renderBulletinPage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">📰 Bulletin</h1>
          <p class="page-subtitle">Weekly church bulletin and announcements</p>
        </div>

        <div class="btn-group">
          ${isEditor() ? '<button class="btn btn-primary" id="newBulletinBtn">+ New Bulletin</button>' : ''}
          <button class="btn btn-outline" id="searchBulletinBtn">🔍 Search</button>
        </div>
      </div>

      <div class="search-bar" id="bulletinSearchBar" style="display:none;">
        <span class="search-icon">🔍</span>
        <input type="text" id="bulletinSearchInput" placeholder="Search bulletins...">
      </div>

      <div id="bulletinEditor" style="display:none;margin:24px 0;">
        <div class="card">
          <h3 style="margin-bottom:16px;">${bulletinState.editingId ? 'Edit Bulletin' : 'New Bulletin'}</h3>
          <form id="bulletinForm">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="bulletinDate" required>
            </div>

            <div id="sectionsContainer"></div>

            <button type="button" class="btn btn-outline" id="addSectionBtn" style="margin:16px 0;">+ Add Section</button>

            <div class="form-checkbox" style="margin:16px 0;">
              <input type="checkbox" id="bulletinPublished">
              <label>Publish immediately</label>
            </div>

            <div class="btn-group" style="margin-top:20px;">
              <button type="submit" class="btn btn-primary">${bulletinState.editingId ? 'Save Changes' : 'Create Bulletin'}</button>
              <button type="button" class="btn btn-outline" id="cancelBulletinBtn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div id="bulletinDisplay"></div>
      <div id="bulletinEmpty" class="empty-state" style="display:none;">
        <div class="empty-icon">📰</div>
        <div class="empty-text">No bulletins yet</div>
        <div class="empty-sub">Create your first bulletin</div>
      </div>
    </div>
  `;
}

async function initBulletinPage() {
  await loadBulletins();
  renderBulletinDisplay();
  markBulletinSeen();

  const newBtn = document.getElementById('newBulletinBtn');
  const searchBtn = document.getElementById('searchBulletinBtn');
  const searchInput = document.getElementById('bulletinSearchInput');

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      bulletinState.showEditor = true;
      bulletinState.editingId = null;
      renderBulletinEditor();
    });
  }

  searchBtn.addEventListener('click', () => {
    const searchBar = document.getElementById('bulletinSearchBar');
    const isVisible = searchBar.style.display === 'block';
    searchBar.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) searchInput.focus();
  });

  searchInput.addEventListener('input', (e) => {
    bulletinState.searchQuery = e.target.value.toLowerCase();
    renderBulletinDisplay();
  });
}

async function loadBulletins() {
  try {
    const snapshot = await db.collection('bulletins').orderBy('date', 'desc').get();

    bulletinState.bulletins = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Set current bulletin to most recent published one
    const publishedBulletins = bulletinState.bulletins.filter(b => b.published);
    if (publishedBulletins.length > 0) {
      bulletinState.currentBulletinId = publishedBulletins[0].id;
    }
  } catch (error) {
    console.error('Error loading bulletins:', error);
    alert('Failed to load bulletins: ' + error.message);
    bulletinState.bulletins = [];
  }
}

function renderBulletinEditor() {
  const editor = document.getElementById('bulletinEditor');
  editor.style.display = 'block';

  // Load existing bulletin data if editing
  if (bulletinState.editingId) {
    const bulletin = bulletinState.bulletins.find(b => b.id === bulletinState.editingId);
    if (bulletin) {
      document.getElementById('bulletinDate').value = bulletin.date;
      document.getElementById('bulletinPublished').checked = bulletin.published;

      // Render sections
      renderSections(bulletin.sections);
    }
  } else {
    // New bulletin - set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bulletinDate').value = today;
    document.getElementById('bulletinPublished').checked = true;

    // Start with one empty section
    renderSections([{ heading: '', content: '' }]);
  }

  // Setup event listeners
  document.getElementById('bulletinForm').addEventListener('submit', handleBulletinSubmit);
  document.getElementById('cancelBulletinBtn').addEventListener('click', cancelBulletinEdit);
  document.getElementById('addSectionBtn').addEventListener('click', addSection);

  // Scroll to editor
  editor.scrollIntoView({ behavior: 'smooth' });
}

function renderSections(sections = []) {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = sections.map((section, idx) => `
    <div class="card" style="margin-bottom:16px;padding:16px;background:var(--bg);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong>Section ${idx + 1}</strong>
        ${sections.length > 1 ? `<button type="button" class="btn btn-outline" style="font-size:12px;padding:4px 12px;color:var(--red);" onclick="removeSection(${idx})">Remove</button>` : ''}
      </div>
      <div class="form-group">
        <label class="form-label">Heading</label>
        <input type="text" class="form-input section-heading" value="${escapeHtml(section.heading)}" placeholder="e.g., Upcoming Events">
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea class="form-textarea section-content" rows="6" placeholder="Enter content. Use Markdown formatting:&#10;- Bullet points start with -&#10;**Bold text** with double asterisks&#10;*Italic text* with single asterisks&#10;Links: [Text](URL)">${escapeHtml(section.content)}</textarea>
      </div>
    </div>
  `).join('');
}

function addSection() {
  const headings = document.querySelectorAll('.section-heading');
  const contents = document.querySelectorAll('.section-content');

  const sections = Array.from(headings).map((heading, idx) => ({
    heading: heading.value,
    content: contents[idx].value
  }));

  sections.push({ heading: '', content: '' });
  renderSections(sections);
}

function removeSection(idx) {
  const headings = document.querySelectorAll('.section-heading');
  const contents = document.querySelectorAll('.section-content');

  const sections = Array.from(headings).map((heading, i) => ({
    heading: heading.value,
    content: contents[i].value
  }));

  sections.splice(idx, 1);
  renderSections(sections);
}

async function handleBulletinSubmit(e) {
  e.preventDefault();

  const date = document.getElementById('bulletinDate').value;
  const published = document.getElementById('bulletinPublished').checked;

  const headings = document.querySelectorAll('.section-heading');
  const contents = document.querySelectorAll('.section-content');

  const sections = Array.from(headings).map((heading, idx) => ({
    heading: heading.value.trim(),
    content: contents[idx].value.trim()
  })).filter(section => section.heading || section.content);

  const user = getCurrentUser();

  try {
    if (bulletinState.editingId) {
      // Update existing bulletin
      await db.collection('bulletins').doc(bulletinState.editingId).update({
        date,
        sections,
        published,
        updatedAt: firebase.firestore.Timestamp.now()
      });
    } else {
      // Create new bulletin
      await db.collection('bulletins').add({
        date,
        sections,
        published,
        createdBy: user.uid,
        createdAt: firebase.firestore.Timestamp.now()
      });
    }

    await loadBulletins();
    cancelBulletinEdit();
    renderBulletinDisplay();

    // If published, notify users
    if (published) {
      const latestPublished = bulletinState.bulletins.find(b => b.published);
      if (latestPublished) {
        // Store the published timestamp so we can detect new bulletins
        const publishKey = latestPublished.id + '_' + (latestPublished.updatedAt || latestPublished.createdAt);
        localStorage.setItem('ccr_bulletin_latest', publishKey);
        // Send browser notification
        sendBulletinNotification(latestPublished);
      }
    }
  } catch (error) {
    console.error('Error saving bulletin:', error);
    alert('Failed to save bulletin: ' + error.message);
  }
}

// ─── NOTIFICATION & BADGE ───

function sendBulletinNotification(bulletin) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const firstSection = bulletin.sections && bulletin.sections[0];
    const body = firstSection ? firstSection.heading || 'New content available' : 'New content available';
    new Notification('📋 New Bulletin — ' + formatDate(bulletin.date), {
      body: body,
      icon: 'img/icon-192.png',
      tag: 'bulletin-update'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendBulletinNotification(bulletin);
      }
    });
  }
}

function checkBulletinBadge() {
  const latestPublished = bulletinState.bulletins.find(b => b.published);
  if (!latestPublished) {
    clearBulletinBadge();
    return;
  }

  const ts = latestPublished.updatedAt || latestPublished.createdAt;
  const publishKey = latestPublished.id + '_' + (ts instanceof Object ? JSON.stringify(ts) : ts);
  const lastSeen = localStorage.getItem('ccr_bulletin_seen');

  if (lastSeen !== publishKey) {
    showBulletinBadge();
  } else {
    clearBulletinBadge();
  }
}

function showBulletinBadge() {
  // Add badge to FAB nav bulletin button
  const fabItem = document.querySelector('.fab-item[data-page="bulletin"]');
  if (fabItem && !fabItem.querySelector('.fab-badge')) {
    const badge = document.createElement('span');
    badge.className = 'fab-badge';
    badge.textContent = '•';
    fabItem.appendChild(badge);
  }
}

function clearBulletinBadge() {
  document.querySelectorAll('.fab-item[data-page="bulletin"] .fab-badge').forEach(b => b.remove());
}

function markBulletinSeen() {
  const latestPublished = bulletinState.bulletins.find(b => b.published);
  if (latestPublished) {
    const ts = latestPublished.updatedAt || latestPublished.createdAt;
    const publishKey = latestPublished.id + '_' + (ts instanceof Object ? JSON.stringify(ts) : ts);
    localStorage.setItem('ccr_bulletin_seen', publishKey);
    clearBulletinBadge();
  }
}

function cancelBulletinEdit() {
  bulletinState.showEditor = false;
  bulletinState.editingId = null;
  document.getElementById('bulletinEditor').style.display = 'none';
  document.getElementById('bulletinForm').reset();
}

function renderBulletinDisplay() {
  const display = document.getElementById('bulletinDisplay');
  const empty = document.getElementById('bulletinEmpty');

  let bulletins = bulletinState.bulletins.filter(b => b.published || isEditor());

  // Apply search filter
  if (bulletinState.searchQuery) {
    bulletins = bulletins.filter(b => {
      const dateMatch = b.date.includes(bulletinState.searchQuery);
      const sectionsMatch = b.sections.some(s =>
        s.heading.toLowerCase().includes(bulletinState.searchQuery) ||
        s.content.toLowerCase().includes(bulletinState.searchQuery)
      );
      return dateMatch || sectionsMatch;
    });
  }

  if (bulletins.length === 0) {
    display.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Find the first published bulletin to mark as "Latest"
  const latestPublishedId = bulletins.find(b => b.published)?.id;

  display.innerHTML = bulletins.map((bulletin, idx) => {
    const isLatest = bulletin.published && bulletin.id === latestPublishedId;

    return `
      <div class="card" style="margin-bottom:14px;${isLatest ? 'border:2px solid var(--accent);' : ''}${!bulletin.published ? 'border:1px dashed var(--muted);opacity:0.8;' : ''}position:relative;">
        <button class="copy-card-btn" onclick="event.stopPropagation(); copyBulletinCard('${bulletin.id}', this)" title="Copy for sharing">📋</button>
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-title" style="font-size:15px;">${formatDate(bulletin.date)}</div>
            <div class="card-meta">
              ${!bulletin.published ? '<span class="badge" style="background:var(--surface);color:var(--muted);border:1px solid var(--border);font-size:10px;padding:2px 8px;">📝 Draft</span>' : ''}
              ${isLatest ? '<span class="badge" style="background:var(--accent);color:white;font-size:10px;padding:2px 8px;">Latest</span>' : ''}
            </div>
          </div>
        </div>

        <div style="margin-top:12px;">
          ${bulletin.sections.map(section => `
            <div style="margin-bottom:16px;">
              ${section.heading ? `<h3 style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--accent);">${escapeHtml(section.heading)}</h3>` : ''}
              <div style="line-height:1.5;font-size:13px;">${formatMarkdown(section.content)}</div>
            </div>
          `).join('')}
        </div>

        ${isEditor() ? `
          <div class="btn-group" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
            <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editBulletin('${bulletin.id}')">✏️ Edit</button>
            <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="deleteBulletin('${bulletin.id}')">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function editBulletin(id) {
  bulletinState.editingId = id;
  bulletinState.showEditor = true;
  renderBulletinEditor();
}

async function deleteBulletin(id) {
  if (!confirm('Delete this bulletin?')) return;

  try {
    await db.collection('bulletins').doc(id).delete();
    await loadBulletins();
    renderBulletinDisplay();
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    alert('Failed to delete bulletin: ' + error.message);
  }
}

/* ====================================
   UTILITY FUNCTIONS
   ==================================== */

function formatMarkdown(text) {
  if (!text) return '';

  // Basic markdown parsing
  let html = escapeHtml(text);

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent);text-decoration:none;">$1</a>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet lists: lines starting with - or *
  const lines = html.split('\n');
  let inList = false;
  const formatted = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (!inList) {
        formatted.push('<ul style="margin:8px 0;padding-left:20px;">');
        inList = true;
      }
      formatted.push(`<li style="margin:4px 0;">${trimmed.substring(1).trim()}</li>`);
    } else {
      if (inList) {
        formatted.push('</ul>');
        inList = false;
      }
      if (trimmed) {
        formatted.push(`<p style="margin:8px 0;">${trimmed}</p>`);
      }
    }
  }

  if (inList) {
    formatted.push('</ul>');
  }

  return formatted.join('');
}

/* ====================================
   COPY-TO-CLIPBOARD FORMATTER
   ==================================== */

function copyBulletinCard(id, btnEl) {
  const bulletin = bulletinState.bulletins.find(b => b.id === id);
  if (!bulletin) return;
  let text = `📰 *Bulletin — ${formatDate(bulletin.date)}*\n\n`;
  bulletin.sections.forEach(section => {
    if (section.heading) text += `*${section.heading}*\n`;
    if (section.content) {
      // Strip markdown syntax for clean plain text
      let clean = section.content;
      // Convert **bold** to *bold* (Signal style)
      clean = clean.replace(/\*\*([^*]+)\*\*/g, '*$1*');
      // Keep bullet points as-is (- prefix works in Signal)
      text += clean + '\n';
    }
    text += '\n';
  });
  copyCardText(text.trim(), btnEl);
}
