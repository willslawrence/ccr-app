/* ====================================
   SCHEDULE PAGE
   ==================================== */

let scheduleState = {
  events: [],
  volunteerSchedule: [],
  orderOfService: [],
  currentTab: 'oos', // 'events', 'volunteering', 'oos'
  searchQuery: '',
  showAddForm: false,
  editingId: null,
  dataLoaded: false  // Cache flag
};

function renderSchedulePage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">📅 Schedule</h1>
          <p class="page-subtitle">Events, volunteering, and Order of Service</p>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div class="btn-group" style="flex:1;margin-bottom:0;">
            <button class="btn ${scheduleState.currentTab === 'events' ? 'btn-primary' : 'btn-outline'}" id="eventsTabBtn">Events</button>
            <button class="btn ${scheduleState.currentTab === 'volunteering' ? 'btn-primary' : 'btn-outline'}" id="volunteeringTabBtn">Volunteering</button>
            <button class="btn ${scheduleState.currentTab === 'oos' ? 'btn-primary' : 'btn-outline'}" id="oosTabBtn">Order of Service</button>
          </div>

        </div>
      </div>

      <div id="scheduleContent"></div>
    </div>
  `;
}

async function initSchedulePage() {
  await loadScheduleData();
  renderScheduleContent();

  function switchTab(tab) {
    scheduleState.currentTab = tab;
    // Update button styles immediately (no delay)
    document.getElementById('eventsTabBtn').className = `btn ${tab === 'events' ? 'btn-primary' : 'btn-outline'}`;
    document.getElementById('volunteeringTabBtn').className = `btn ${tab === 'volunteering' ? 'btn-primary' : 'btn-outline'}`;
    document.getElementById('oosTabBtn').className = `btn ${tab === 'oos' ? 'btn-primary' : 'btn-outline'}`;
    // Then render content
    renderScheduleContent();
  }

  document.getElementById('eventsTabBtn').addEventListener('click', () => switchTab('events'));
  document.getElementById('volunteeringTabBtn').addEventListener('click', () => switchTab('volunteering'));
  document.getElementById('oosTabBtn').addEventListener('click', () => switchTab('oos'));
}

async function loadScheduleData(forceRefresh = false) {
  if (scheduleState.dataLoaded && !forceRefresh) return;
  try {
    // Load events from Firestore
    const eventsSnapshot = await db.collection('events').orderBy('date', 'asc').get();
    scheduleState.events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Load volunteer schedule from Firestore
    const volunteerSnapshot = await db.collection('schedule_volunteers').orderBy('date', 'desc').get();
    scheduleState.volunteerSchedule = volunteerSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });

    // Load order of service from Firestore
    const oosSnapshot = await db.collection('order_of_service').orderBy('date', 'desc').get();
    scheduleState.orderOfService = oosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });
    scheduleState.dataLoaded = true;
  } catch (error) {
    console.error('Error loading schedule data from Firestore:', error);
    alert('Failed to load schedule data. Please try again.');
  }
}

function renderScheduleContent() {
  const content = document.getElementById('scheduleContent');

  if (scheduleState.currentTab === 'events') {
    content.innerHTML = renderEventsTab();
    initEventsTab();
  } else if (scheduleState.currentTab === 'volunteering') {
    content.innerHTML = renderVolunteeringTab();
    initVolunteeringTab();
  } else if (scheduleState.currentTab === 'oos') {
    content.innerHTML = renderOoSTab();
    initOoSTab();
  }
}

/* ====================================
   EVENTS TAB
   ==================================== */

function renderEventsTab() {
  const canEdit = isEditor();
  const now = new Date();

  const sortedEvents = [...scheduleState.events].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  return `
    <button class="btn btn-primary" id="addEventBtn" style="display:none;">+ Add Event</button>
    <div id="eventForm" style="display:none;margin-bottom:24px;">
      <div class="card">
        <h3 style="margin-bottom:16px;">${scheduleState.editingId ? 'Edit Event' : 'New Event'}</h3>
        <form id="eventFormElement">
          <div class="form-group">
            <label class="form-label">Event Name *</label>
            <input type="text" class="form-input" id="eventTitle" required>
          </div>
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" class="form-input" id="eventDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">Time</label>
            <input type="time" class="form-input" id="eventTime">
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input" id="eventLocation">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="eventDescription"></textarea>
          </div>
          <div class="btn-group" style="margin-top:20px;">
            <button type="submit" class="btn btn-primary">${scheduleState.editingId ? 'Save Changes' : 'Add Event'}</button>
            <button type="button" class="btn btn-outline" id="cancelEventBtn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="eventList">
      ${sortedEvents.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-text">No events scheduled</div>
          <div class="empty-sub">Events will appear here</div>
          ${canEdit ? '<button class="btn btn-primary" style="margin-top:12px;font-size:13px;" onclick="document.getElementById(\'addEventBtn\').click()">+ New Event</button>' : ''}
        </div>
      ` : sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const today = new Date(); today.setHours(0,0,0,0); // start of today
        const isPast = eventDate < today;

        return `
          <div class="card" style="margin-bottom:12px;${isPast ? 'opacity:0.5;' : ''}position:relative;">
            ${isPast ? '<span class="badge" style="position:absolute;top:50%;right:60px;transform:translateY(-50%);background:var(--muted);z-index:2;">Past</span>' : ''}
            <button class="copy-card-btn" onclick="event.stopPropagation(); copyEventCard('${event.id}', this)" title="Copy for sharing">📋 Copy</button>
            <div class="card-header">
              <div style="flex:1;">
                <div class="card-meta">${formatDate(event.date)}${event.time ? ' • ' + event.time : ''}</div>
                <div class="card-title">${escapeHtml(event.title)}</div>
                ${event.location ? `<div class="text-muted" style="font-size:13px;margin-top:4px;">📍 ${escapeHtml(event.location)}</div>` : ''}
              </div>
            </div>
            ${event.description ? `
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                <p style="margin:0;white-space:pre-wrap;">${escapeHtml(event.description)}</p>
              </div>
            ` : ''}
            ${canEdit ? `
              <div class="btn-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;" onclick="editEvent('${event.id}')">✏️ Edit</button>
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;color:var(--red);" onclick="(async () => await deleteEvent('${event.id}'))()">🗑️ Delete</button>
                <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="document.getElementById('addEventBtn').click()">+ New</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function initEventsTab() {
  const addBtn = document.getElementById('addEventBtn');
  const cancelBtn = document.getElementById('cancelEventBtn');
  const form = document.getElementById('eventFormElement');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      scheduleState.showAddForm = true;
      scheduleState.editingId = null;
      document.getElementById('eventForm').style.display = 'block';
      document.getElementById('eventTitle').focus();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      scheduleState.showAddForm = false;
      scheduleState.editingId = null;
      document.getElementById('eventForm').style.display = 'none';
      form.reset();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveEvent();
    });
  }
}

async function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const location = document.getElementById('eventLocation').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  const user = getCurrentUser();

  try {
    if (scheduleState.editingId) {
      // Update existing event in Firestore
      await db.collection('events').doc(scheduleState.editingId).update({
        title,
        date,
        time,
        location,
        description,
        updatedAt: firebase.firestore.Timestamp.now()
      });

      // Update local state
      const event = scheduleState.events.find(e => e.id === scheduleState.editingId);
      if (event) {
        event.title = title;
        event.date = date;
        event.time = time;
        event.location = location;
        event.description = description;
        event.updatedAt = new Date().toISOString();
      }
    } else {
      // Add new event to Firestore
      const eventData = {
        title,
        date,
        time,
        location,
        description,
        createdBy: user.uid,
        createdAt: firebase.firestore.Timestamp.now()
      };

      const docRef = await db.collection('events').add(eventData);

      // Add to local state
      scheduleState.events.push({
        id: docRef.id,
        ...eventData,
        createdAt: new Date().toISOString()
      });
    }

    scheduleState.showAddForm = false;
    scheduleState.editingId = null;
    renderScheduleContent();
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Failed to save event. Please try again.');
  }
}

function editEvent(id) {
  const event = scheduleState.events.find(e => e.id === id);
  if (!event) return;

  scheduleState.editingId = id;
  scheduleState.showAddForm = true;

  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTime').value = event.time || '';
  document.getElementById('eventLocation').value = event.location || '';
  document.getElementById('eventDescription').value = event.description || '';
  document.getElementById('eventForm').style.display = 'block';
  document.getElementById('eventTitle').focus();
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;

  try {
    // Delete from Firestore
    await db.collection('events').doc(id).delete();

    // Remove from local state
    scheduleState.events = scheduleState.events.filter(e => e.id !== id);
    renderScheduleContent();
  } catch (error) {
    console.error('Error deleting event:', error);
    alert('Failed to delete event. Please try again.');
  }
}

/* ====================================
   VOLUNTEERING TAB
   ==================================== */

function renderVolunteeringTab() {
  const canEdit = isEditor();
  const now = new Date();

  // Group weeks by month (YYYY-MM)
  const monthGroups = {};
  scheduleState.volunteerSchedule.forEach(week => {
    const monthKey = week.date.substring(0, 7); // YYYY-MM
    if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
    monthGroups[monthKey].push(week);
  });

  // Sort months descending (newest first), weeks within month ascending
  const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
  sortedMonths.forEach(key => {
    monthGroups[key].sort((a, b) => a.date.localeCompare(b.date));
  });

  // Determine current month key
  const currentMonthKey = now.toISOString().substring(0, 7);

  const ROLE_COLS = [
    { key: 'location', label: 'Location', icon: '📍' },
    { key: 'setupCleanup', label: 'Set Up / Clean Up', icon: '🧹' },
    { key: 'gospel', label: 'Gospel', icon: '📖' },
    { key: 'kids', label: 'Kids', icon: '👶' },
    { key: 'it', label: 'IT', icon: '💻' },
    { key: 'songs', label: 'Songs', icon: '🎵' },
    { key: 'passageTheme', label: 'Passage', icon: '📜' },
  ];

  return `
    <button class="btn btn-primary" id="addVolunteerBtn" style="display:none;">+ Add Month</button>

    <!-- Monthly edit form (hidden by default) -->
    <div id="volunteerMonthForm" style="display:none;margin-bottom:24px;">
      <div class="card">
        <h3 style="margin-bottom:16px;" id="volMonthFormTitle">New Month</h3>
        <form id="volunteerMonthFormElement">
          <div class="form-group">
            <label class="form-label">Month *</label>
            <input type="month" class="form-input" id="volMonth" required>
          </div>
          <div id="volMonthWeeks"></div>
          <div style="margin-bottom:16px;">
            <button type="button" class="btn btn-outline" onclick="addVolunteerWeekRow()" style="font-size:12px;padding:6px 14px;">+ Add Week</button>
          </div>
          <div class="btn-group" style="margin-top:20px;">
            <button type="submit" class="btn btn-primary" id="volMonthSubmitBtn">Save Month</button>
            <button type="button" class="btn btn-outline" id="cancelVolunteerMonthBtn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="volunteerList">
      ${sortedMonths.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">No volunteer schedule yet</div>
          <div class="empty-sub">Add a month to get started</div>
          ${canEdit ? '<button class="btn btn-primary" style="margin-top:12px;font-size:13px;" onclick="document.getElementById(\'addVolunteerBtn\').click()">+ New Month</button>' : ''}
        </div>
      ` : sortedMonths.map(monthKey => {
        const weeks = monthGroups[monthKey];
        const monthDate = new Date(monthKey + '-01');
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const isCurrent = monthKey === currentMonthKey;
        const isPast = monthKey < currentMonthKey;

        return `
          <div class="card vol-month-card" style="margin-bottom:16px;padding:0;overflow:hidden;${isCurrent ? 'border:2px solid var(--accent);' : ''}${isPast ? 'opacity:0.6;' : ''}position:relative;">
            <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;background:var(--surface);border-bottom:1px solid var(--border);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">👥</span>
                <strong style="font-size:15px;">${monthLabel}</strong>
                ${isCurrent ? '<span class="badge" style="background:var(--accent);color:white;font-size:10px;padding:3px 8px;">CURRENT</span>' : ''}
              </div>
              <button class="copy-card-btn" onclick="event.stopPropagation(); copyVolunteerMonth('${monthKey}', this)" title="Copy month for sharing" style="position:static;">📋 Copy</button>
            </div>
            <div class="vol-grid-scroll">
              <table class="vol-grid-table">
                <thead>
                  <tr>
                    <th class="vol-grid-th">Date</th>
                    ${ROLE_COLS.map(c => `<th class="vol-grid-th">${c.icon} ${c.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${weeks.map(week => {
                    const weekDate = new Date(week.date + 'T00:00:00');
                    const isCurrentWeek = isThisWeek(weekDate);
                    const dayLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `
                      <tr class="${isCurrentWeek ? 'vol-grid-current' : ''}">
                        <td class="vol-grid-td vol-grid-date">${dayLabel}</td>
                        ${ROLE_COLS.map(c => `<td class="vol-grid-td">${escapeHtml(week[c.key] || '—')}</td>`).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ${canEdit ? `
              <div class="btn-group" style="padding:10px 14px;border-top:1px solid var(--border);">
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;" onclick="editVolunteerMonth('${monthKey}')">✏️ Edit</button>
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;color:var(--red);" onclick="(async () => await deleteVolunteerMonth('${monthKey}'))()">🗑️ Delete</button>
                <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="document.getElementById('addVolunteerBtn').click()">+ New Month</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function initVolunteeringTab() {
  const addBtn = document.getElementById('addVolunteerBtn');
  const cancelBtn = document.getElementById('cancelVolunteerMonthBtn');
  const form = document.getElementById('volunteerMonthFormElement');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      scheduleState.showAddForm = true;
      scheduleState.editingId = null;
      document.getElementById('volMonthFormTitle').textContent = 'New Month';
      document.getElementById('volMonthSubmitBtn').textContent = 'Save Month';
      document.getElementById('volMonth').value = '';
      document.getElementById('volMonth').disabled = false;
      document.getElementById('volMonthWeeks').innerHTML = '';
      // Add 4 empty week rows by default
      for (let i = 0; i < 4; i++) addVolunteerWeekRow();
      document.getElementById('volunteerMonthForm').style.display = 'block';
      document.getElementById('volMonth').focus();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      scheduleState.showAddForm = false;
      scheduleState.editingId = null;
      document.getElementById('volunteerMonthForm').style.display = 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveVolunteerMonth();
    });
  }
}

// Add a week row to the month form
window.addVolunteerWeekRow = function(data) {
  const container = document.getElementById('volMonthWeeks');
  const idx = container.querySelectorAll('.vol-week-row').length + 1;
  const row = document.createElement('div');
  row.className = 'vol-week-row';
  row.style.cssText = 'padding:12px;margin-bottom:12px;background:var(--surface);border-radius:8px;';
  row.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:13px;">Week ${idx}</strong>
      <button type="button" onclick="this.closest('.vol-week-row').remove()" style="width:24px;height:24px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:11px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Date *</label><input type="date" class="form-input vol-w-date" value="${data?.date || ''}" required style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Location *</label><input type="text" class="form-input vol-w-location" value="${escapeHtml(data?.location || '')}" required style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Set Up/Clean Up</label><input type="text" class="form-input vol-w-setup" value="${escapeHtml(data?.setupCleanup || '')}" style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Gospel</label><input type="text" class="form-input vol-w-gospel" value="${escapeHtml(data?.gospel || '')}" style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Kids</label><input type="text" class="form-input vol-w-kids" value="${escapeHtml(data?.kids || '')}" style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">IT</label><input type="text" class="form-input vol-w-it" value="${escapeHtml(data?.it || '')}" style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Songs</label><input type="text" class="form-input vol-w-songs" value="${escapeHtml(data?.songs || '')}" style="font-size:12px;padding:6px 8px;"></div>
      <div class="form-group" style="margin:0;"><label class="form-label" style="font-size:11px;">Passage Theme</label><input type="text" class="form-input vol-w-passage" value="${escapeHtml(data?.passageTheme || '')}" style="font-size:12px;padding:6px 8px;"></div>
    </div>
    <input type="hidden" class="vol-w-id" value="${data?.id || ''}">
  `;
  container.appendChild(row);
};

// Save entire month (create or update all weeks)
async function saveVolunteerMonth() {
  const monthVal = document.getElementById('volMonth').value; // YYYY-MM
  if (!monthVal) { alert('Please select a month.'); return; }

  const rows = document.querySelectorAll('#volMonthWeeks .vol-week-row');
  const weeks = [];
  for (const row of rows) {
    const date = row.querySelector('.vol-w-date').value;
    const location = row.querySelector('.vol-w-location').value.trim();
    if (!date || !location) { alert('Each week needs a date and location.'); return; }
    weeks.push({
      existingId: row.querySelector('.vol-w-id').value || null,
      date,
      location,
      setupCleanup: row.querySelector('.vol-w-setup').value.trim(),
      gospel: row.querySelector('.vol-w-gospel').value.trim(),
      kids: row.querySelector('.vol-w-kids').value.trim(),
      it: row.querySelector('.vol-w-it').value.trim(),
      songs: row.querySelector('.vol-w-songs').value.trim(),
      passageTheme: row.querySelector('.vol-w-passage').value.trim(),
    });
  }

  try {
    // If editing, delete removed weeks
    if (scheduleState.editingId) {
      const existingWeeks = scheduleState.volunteerSchedule.filter(w => w.date.startsWith(scheduleState.editingId));
      const keptIds = new Set(weeks.map(w => w.existingId).filter(Boolean));
      for (const ew of existingWeeks) {
        if (!keptIds.has(ew.id)) {
          await db.collection('schedule_volunteers').doc(ew.id).delete();
          scheduleState.volunteerSchedule = scheduleState.volunteerSchedule.filter(w => w.id !== ew.id);
        }
      }
    }

    // Upsert each week
    for (const week of weeks) {
      const weekData = {
        date: week.date,
        location: week.location,
        setupCleanup: week.setupCleanup,
        gospel: week.gospel,
        kids: week.kids,
        it: week.it,
        songs: week.songs,
        passageTheme: week.passageTheme,
      };

      if (week.existingId) {
        await db.collection('schedule_volunteers').doc(week.existingId).update(weekData);
        const existing = scheduleState.volunteerSchedule.find(w => w.id === week.existingId);
        if (existing) Object.assign(existing, weekData);
      } else {
        weekData.createdAt = firebase.firestore.Timestamp.now();
        const docRef = await db.collection('schedule_volunteers').add(weekData);
        scheduleState.volunteerSchedule.push({ id: docRef.id, ...weekData, createdAt: new Date().toISOString() });
      }
    }

    scheduleState.showAddForm = false;
    scheduleState.editingId = null;
    renderScheduleContent();
  } catch (error) {
    console.error('Error saving volunteer month:', error);
    alert('Failed to save. Please try again.');
  }
}

// Edit an entire month
window.editVolunteerMonth = function(monthKey) {
  scheduleState.editingId = monthKey;
  const weeks = scheduleState.volunteerSchedule
    .filter(w => w.date.startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthDate = new Date(monthKey + '-01');
  const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  document.getElementById('volMonthFormTitle').textContent = 'Edit ' + monthLabel;
  document.getElementById('volMonthSubmitBtn').textContent = 'Save Changes';
  document.getElementById('volMonth').value = monthKey;
  document.getElementById('volMonth').disabled = true;
  document.getElementById('volMonthWeeks').innerHTML = '';

  weeks.forEach(w => addVolunteerWeekRow(w));
  document.getElementById('volunteerMonthForm').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete entire month
window.deleteVolunteerMonth = async function(monthKey) {
  const weeks = scheduleState.volunteerSchedule.filter(w => w.date.startsWith(monthKey));
  if (!confirm(`Delete all ${weeks.length} weeks in this month?`)) return;

  try {
    for (const week of weeks) {
      await db.collection('schedule_volunteers').doc(week.id).delete();
    }
    scheduleState.volunteerSchedule = scheduleState.volunteerSchedule.filter(w => !w.date.startsWith(monthKey));
    renderScheduleContent();
  } catch (error) {
    console.error('Error deleting volunteer month:', error);
    alert('Failed to delete. Please try again.');
  }
};

// Legacy single-week functions (kept for backward compat)
function editVolunteerWeek(id) {
  const week = scheduleState.volunteerSchedule.find(w => w.id === id);
  if (!week) return;
  const monthKey = week.date.substring(0, 7);
  editVolunteerMonth(monthKey);
}

async function deleteVolunteerWeek(id) {
  if (!confirm('Delete this week?')) return;
  try {
    await db.collection('schedule_volunteers').doc(id).delete();
    scheduleState.volunteerSchedule = scheduleState.volunteerSchedule.filter(w => w.id !== id);
    renderScheduleContent();
  } catch (error) {
    console.error('Error deleting volunteer week:', error);
    alert('Failed to delete. Please try again.');
  }
}

/* ====================================
   ORDER OF SERVICE TAB
   ==================================== */

function renderOoSTab() {
  const canEdit = isEditor();

  const sortedOoS = [...scheduleState.orderOfService].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  const currentOoS = sortedOoS.length > 0 ? sortedOoS[0] : null;

  return `
    <button class="btn btn-primary" id="addOoSBtn" style="display:none;">+ New Order of Service</button>
    <div id="oosForm" style="display:none;margin-bottom:24px;">
      <div class="card">
        <h3 style="margin-bottom:16px;">${scheduleState.editingId ? 'Edit OoS' : 'New Order of Service'}</h3>
        <form id="oosFormElement">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" class="form-input" id="oosDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">Venue Name *</label>
            <input type="text" class="form-input" id="oosVenueName" required>
          </div>
          <div class="form-group">
            <label class="form-label">Google Maps URL</label>
            <input type="url" class="form-input" id="oosVenueUrl" placeholder="https://maps.google.com/...">
          </div>
          <div class="form-group">
            <label class="form-label">Instructions</label>
            <input type="text" class="form-input" id="oosInstructions" placeholder="Gate codes, parking info, access notes...">
          </div>
          <div class="form-group">
            <label class="form-label">Service Items</label>
            <div id="oosServiceItems">
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="1pm" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Arrival" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="1:15pm" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Food & Fellowship" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="1:45pm" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Gospel & Lord's Supper" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="2:15pm" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Public Reading" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Psalms, Hymns, Spiritual Songs" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="2:45pm" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Exhortation" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Prayers & Building Up" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Cheerful Giving" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Benediction" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
              <div class="oos-item-row" style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="form-input" value="" style="width:80px;flex:none;font-size:12px;padding:8px;">
                <input type="text" class="form-input" value="Great Commission: Matthew 28:18-20" style="flex:1;font-size:12px;padding:8px;">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
              </div>
            </div>
            <button type="button" class="btn btn-outline" onclick="addOoSItemRow()" style="font-size:11px;padding:6px 12px;min-height:28px;">+ Add Item</button>
          </div>

          <div class="form-group">
            <label class="form-label">Songs</label>
            <div id="oosSongItems">
              <div class="oos-song-row" style="margin-bottom:8px;">
                <input type="text" class="form-input" placeholder="Song name" style="font-size:12px;padding:8px;margin-bottom:4px;">
                <div style="display:flex;gap:6px;">
                  <input type="url" class="form-input" placeholder="YouTube link" style="flex:1;font-size:12px;padding:8px;">
                  <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
                </div>
              </div>
              <div class="oos-song-row" style="margin-bottom:8px;">
                <input type="text" class="form-input" placeholder="Song name" style="font-size:12px;padding:8px;margin-bottom:4px;">
                <div style="display:flex;gap:6px;">
                  <input type="url" class="form-input" placeholder="YouTube link" style="flex:1;font-size:12px;padding:8px;">
                  <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
                </div>
              </div>
              <div class="oos-song-row" style="margin-bottom:8px;">
                <input type="text" class="form-input" placeholder="Song name" style="font-size:12px;padding:8px;margin-bottom:4px;">
                <div style="display:flex;gap:6px;">
                  <input type="url" class="form-input" placeholder="YouTube link" style="flex:1;font-size:12px;padding:8px;">
                  <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
                </div>
              </div>
              <div class="oos-song-row" style="margin-bottom:8px;">
                <input type="text" class="form-input" placeholder="Song name" style="font-size:12px;padding:8px;margin-bottom:4px;">
                <div style="display:flex;gap:6px;">
                  <input type="url" class="form-input" placeholder="YouTube link" style="flex:1;font-size:12px;padding:8px;">
                  <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-outline" onclick="addOoSSongRow()" style="font-size:11px;padding:6px 12px;min-height:28px;">+ Add Song</button>
          </div>
          <div class="form-group">
            <label class="form-label">Children's Section</label>
            <textarea class="form-textarea" id="oosChildren" rows="3" placeholder="Description for children's activities"></textarea>
          </div>
          <div class="btn-group" style="margin-top:20px;">
            <button type="submit" class="btn btn-primary">${scheduleState.editingId ? 'Save Changes' : 'Create OoS'}</button>
            <button type="button" class="btn btn-outline" id="cancelOoSBtn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="oosList">
      ${!currentOoS ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No Order of Service yet</div>
          <div class="empty-sub">Create this week's OoS</div>
        </div>
      ` : `
        <div class="card" style="margin-bottom:16px;padding:10px 12px;position:relative;">
          <button class="copy-card-btn" onclick="event.stopPropagation(); copyOoSCard('${currentOoS.id}', this)" title="Copy for sharing">📋 Copy</button>
          <div class="card-header" style="margin-bottom:8px;">
            <div style="flex:1;">
              <div class="card-title" style="font-size:14px;">Order of Service</div>
              <div class="card-meta" style="font-size:11px;">${formatDate(currentOoS.date)}</div>
            </div>
          </div>

          <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
            <div style="margin-bottom:12px;font-size:12px;">
              <strong>Venue:</strong> ${escapeHtml(currentOoS.venueName)}
              ${currentOoS.venueUrl ? `<br><a href="${escapeHtml(currentOoS.venueUrl)}" target="_blank" style="color:var(--accent);text-decoration:none;">📍 View on Google Maps 🔗</a>` : ''}
              ${currentOoS.instructions ? `<br><span style="color:var(--muted);">ℹ️ ${escapeHtml(currentOoS.instructions)}</span>` : ''}
            </div>

            <div style="margin-top:12px;">
              <strong style="font-size:12px;">Service Items:</strong>
              <div style="margin-top:6px;display:grid;gap:6px;">
                ${currentOoS.items.map((item, idx) => `
                  <div style="display:flex;gap:8px;align-items:start;font-size:12px;">
                    <span style="color:var(--muted);font-weight:bold;min-width:16px;">${idx + 1}.</span>
                    <div style="flex:1;">
                      ${item.time ? `<span style="font-weight:bold;">${escapeHtml(item.time)}</span> — ` : ''}
                      ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color:var(--accent);text-decoration:none;">${escapeHtml(item.title)} 🔗</a>` : escapeHtml(item.title)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            ${currentOoS.childrenSection ? `
              <div style="margin-top:12px;padding:8px;background:var(--bg);border-radius:6px;">
                <strong style="font-size:12px;">Children's Section:</strong>
                <p style="margin:6px 0 0 0;font-size:12px;">${escapeHtml(currentOoS.childrenSection)}</p>
              </div>
            ` : ''}
          </div>

          ${canEdit ? `
            <div class="btn-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
              <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;" onclick="editOoS('${currentOoS.id}')">✏️ Edit</button>
              <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;color:var(--red);" onclick="(async () => await deleteOoS('${currentOoS.id}'))()">🗑️ Delete</button>
              <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="document.getElementById('addOoSBtn').click()">+ New</button>
            </div>
          ` : ''}
        </div>

        ${sortedOoS.length > 1 ? `
          <h3 style="margin:24px 0 16px 0;">Past Orders of Service</h3>
          ${sortedOoS.slice(1).map(oos => `
            <div class="card" style="margin-bottom:12px;opacity:0.6;">
              <div class="card-header">
                <div class="card-title">${formatDate(oos.date)}</div>
              </div>
              ${canEdit ? `
                <div class="btn-group" style="margin-top:12px;">
                  <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="viewOoS('${oos.id}')">👁️ View</button>
                  <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="(async () => await deleteOoS('${oos.id}'))()">🗑️ Delete</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}
      `}
    </div>
  `;
}

function initOoSTab() {
  const addBtn = document.getElementById('addOoSBtn');
  const cancelBtn = document.getElementById('cancelOoSBtn');
  const form = document.getElementById('oosFormElement');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      scheduleState.showAddForm = true;
      scheduleState.editingId = null;
      document.getElementById('oosForm').style.display = 'block';
      document.getElementById('oosVenueName').focus();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      scheduleState.showAddForm = false;
      scheduleState.editingId = null;
      document.getElementById('oosForm').style.display = 'none';
      form.reset();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveOoS();
    });
  }
}

function addOoSItemRow() {
  const container = document.getElementById('oosServiceItems');
  const row = document.createElement('div');
  row.className = 'oos-item-row';
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;';
  row.innerHTML = `
    <input type="text" class="form-input" placeholder="Time" style="width:80px;flex:none;font-size:12px;padding:8px;">
    <input type="text" class="form-input" placeholder="Item title" style="flex:1;font-size:12px;padding:8px;">
    <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
  `;
  container.appendChild(row);
}

function addOoSSongRow() {
  const container = document.getElementById('oosSongItems');
  const row = document.createElement('div');
  row.className = 'oos-song-row';
  row.style.cssText = 'margin-bottom:8px;';
  row.innerHTML = `
    <input type="text" class="form-input" placeholder="Song name" style="font-size:12px;padding:8px;margin-bottom:4px;">
    <div style="display:flex;gap:6px;">
      <input type="url" class="form-input" placeholder="YouTube link" style="flex:1;font-size:12px;padding:8px;">
      <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
    </div>
  `;
  container.appendChild(row);
}

async function saveOoS() {
  const date = document.getElementById('oosDate').value;
  const venueName = document.getElementById('oosVenueName').value.trim();
  const venueUrl = document.getElementById('oosVenueUrl').value.trim();
  const instructions = document.getElementById('oosInstructions').value.trim();
  const childrenSection = document.getElementById('oosChildren').value.trim();

  // Parse service items from structured inputs
  const items = [];
  let psalmsIndex = -1;
  document.querySelectorAll('#oosServiceItems .oos-item-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const time = inputs[0].value.trim();
    const title = inputs[1].value.trim();
    if (title) {
      items.push({ time, title, url: '' });
      // Track the "Psalms/Hymns/Spiritual Songs" item position
      if (title.toLowerCase().includes('psalm') || title.toLowerCase().includes('hymn') || title.toLowerCase().includes('spiritual song')) {
        psalmsIndex = items.length - 1;
      }
    }
  });

  // Parse songs — insert right after psalms item (or at end if no psalms item found)
  const songs = [];
  document.querySelectorAll('#oosSongItems .oos-song-row').forEach(row => {
    const songName = row.querySelector('input[type="text"]').value.trim();
    const songUrl = row.querySelector('input[type="url"]').value.trim();
    if (songName) songs.push({ time: '', title: 'Song: ' + songName, url: songUrl });
  });

  if (songs.length > 0) {
    const insertAt = psalmsIndex >= 0 ? psalmsIndex + 1 : items.length;
    items.splice(insertAt, 0, ...songs);
  }

  try {
    if (scheduleState.editingId) {
      // Update existing Order of Service in Firestore
      await db.collection('order_of_service').doc(scheduleState.editingId).update({
        date,
        venueName,
        venueUrl,
        instructions,
        items,
        childrenSection,
        updatedAt: firebase.firestore.Timestamp.now()
      });

      // Update local state
      const oos = scheduleState.orderOfService.find(o => o.id === scheduleState.editingId);
      if (oos) {
        oos.date = date;
        oos.venueName = venueName;
        oos.venueUrl = venueUrl;
        oos.instructions = instructions;
        oos.items = items;
        oos.childrenSection = childrenSection;
        oos.updatedAt = new Date().toISOString();
      }
    } else {
      // Add new Order of Service to Firestore
      const oosData = {
        date,
        venueName,
        venueUrl,
        instructions,
        items,
        childrenSection,
        createdAt: firebase.firestore.Timestamp.now()
      };

      const docRef = await db.collection('order_of_service').add(oosData);

      // Add to local state
      scheduleState.orderOfService.push({
        id: docRef.id,
        ...oosData,
        createdAt: new Date().toISOString()
      });

      // Send push notification for new Order of Service
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      try { if (typeof sendPushNotification === 'function') { await sendPushNotification('oos', '📋 Order of Service', formattedDate, 'all'); } } catch(e) { console.warn('Push failed:', e.message); }
    }

    scheduleState.showAddForm = false;
    scheduleState.editingId = null;
    renderScheduleContent();
  } catch (error) {
    console.error('Error saving Order of Service:', error);
    alert('Failed to save Order of Service. Please try again.');
  }
}

function editOoS(id) {
  const oos = scheduleState.orderOfService.find(o => o.id === id);
  if (!oos) return;

  scheduleState.editingId = id;
  scheduleState.showAddForm = true;

  document.getElementById('oosDate').value = oos.date;
  document.getElementById('oosVenueName').value = oos.venueName;
  document.getElementById('oosVenueUrl').value = oos.venueUrl || '';
  document.getElementById('oosInstructions').value = oos.instructions || '';

  // Populate service items and songs into structured fields
  const serviceContainer = document.getElementById('oosServiceItems');
  const songContainer = document.getElementById('oosSongItems');
  serviceContainer.innerHTML = '';
  songContainer.innerHTML = '';

  oos.items.forEach(item => {
    if (item.title.startsWith('Song: ') || item.url) {
      const songName = item.title.replace(/^Song:\s*/, '');
      const row = document.createElement('div');
      row.className = 'oos-song-row';
      row.style.cssText = 'margin-bottom:8px;';
      row.innerHTML = `
        <input type="text" class="form-input" placeholder="Song name" value="${escapeHtml(songName)}" style="font-size:12px;padding:8px;margin-bottom:4px;">
        <div style="display:flex;gap:6px;">
          <input type="url" class="form-input" placeholder="YouTube link" value="${escapeHtml(item.url || '')}" style="flex:1;font-size:12px;padding:8px;">
          <button type="button" class="btn-icon-sm" onclick="this.parentElement.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
        </div>
      `;
      songContainer.appendChild(row);
    } else {
      const row = document.createElement('div');
      row.className = 'oos-item-row';
      row.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;';
      row.innerHTML = `
        <input type="text" class="form-input" placeholder="Time" value="${escapeHtml(item.time || '')}" style="width:80px;flex:none;font-size:12px;padding:8px;">
        <input type="text" class="form-input" placeholder="Item title" value="${escapeHtml(item.title || '')}" style="flex:1;font-size:12px;padding:8px;">
        <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()" style="width:28px;height:28px;border:none;background:rgba(192,57,43,0.1);color:var(--red);border-radius:6px;cursor:pointer;font-size:12px;flex:none;align-self:center;">✕</button>
      `;
      serviceContainer.appendChild(row);
    }
  });

  document.getElementById('oosChildren').value = oos.childrenSection || '';
  document.getElementById('oosForm').style.display = 'block';
  document.getElementById('oosVenueName').focus();
}

async function deleteOoS(id) {
  if (!confirm('Delete this Order of Service?')) return;

  try {
    // Delete from Firestore
    await db.collection('order_of_service').doc(id).delete();

    // Remove from local state
    scheduleState.orderOfService = scheduleState.orderOfService.filter(o => o.id !== id);
    renderScheduleContent();
  } catch (error) {
    console.error('Error deleting Order of Service:', error);
    alert('Failed to delete Order of Service. Please try again.');
  }
}

function viewOoS(id) {
  // For now, just scroll to top to see current. Could implement modal view
  alert('View feature coming soon. For now, please use Edit to see details.');
}

/* ====================================
   UTILITY FUNCTIONS
   ==================================== */

function isThisWeek(date) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday
  weekEnd.setHours(23, 59, 59, 999);

  return date >= weekStart && date <= weekEnd;
}

/* ====================================
   COPY-TO-CLIPBOARD FORMATTERS
   Signal/WhatsApp-friendly plain text
   ==================================== */

function copyEventCard(id, btnEl) {
  const ev = scheduleState.events.find(e => e.id === id);
  if (!ev) return;
  let text = `📅 *${ev.title}*\n`;
  text += `${formatDate(ev.date)}`;
  if (ev.time) text += ` • ${ev.time}`;
  text += '\n';
  if (ev.location) text += `📍 ${ev.location}\n`;
  if (ev.description) text += `\n${ev.description}\n`;
  copyCardText(text.trim(), btnEl);
}

function copyVolunteerCard(id, btnEl) {
  const week = scheduleState.volunteerSchedule.find(w => w.id === id);
  if (!week) return;
  let text = `👥 *Volunteering — ${formatDate(week.date)}*\n`;
  text += `📍 ${week.location}\n\n`;
  if (week.setupCleanup) text += `🧹 Set Up/Clean Up: ${week.setupCleanup}\n`;
  if (week.gospel) text += `📖 Gospel: ${week.gospel}\n`;
  if (week.kids) text += `👶 Kids: ${week.kids}\n`;
  if (week.it) text += `💻 IT: ${week.it}\n`;
  if (week.songs) text += `🎵 Songs: ${week.songs}\n`;
  if (week.passageTheme) text += `📜 Passage Theme: ${week.passageTheme}\n`;
  copyCardText(text.trim(), btnEl);
}

function copyVolunteerMonth(monthKey, btnEl) {
  const weeks = scheduleState.volunteerSchedule
    .filter(w => w.date.startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!weeks.length) return;

  const monthDate = new Date(monthKey + '-01');
  const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  let text = `👥 *Volunteering Schedule — ${monthLabel}*\n\n`;

  weeks.forEach(week => {
    const d = new Date(week.date + 'T00:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    text += `*${dayLabel}* — 📍 ${week.location}\n`;
    if (week.setupCleanup) text += `  🧹 ${week.setupCleanup}\n`;
    if (week.gospel) text += `  📖 ${week.gospel}\n`;
    if (week.kids) text += `  👶 ${week.kids}\n`;
    if (week.it) text += `  💻 ${week.it}\n`;
    if (week.songs) text += `  🎵 ${week.songs}\n`;
    if (week.passageTheme) text += `  📜 ${week.passageTheme}\n`;
    text += '\n';
  });

  copyCardText(text.trim(), btnEl);
}

function copyOoSCard(id, btnEl) {
  const oos = scheduleState.orderOfService.find(o => o.id === id);
  if (!oos) return;
  let text = `📋 *Order of Service — ${formatDate(oos.date)}*\n`;
  text += `📍 ${oos.venueName}\n`;
  if (oos.venueUrl) text += `${oos.venueUrl}\n`;
  if (oos.instructions) text += `ℹ️ ${oos.instructions}\n`;
  text += '\n';
  oos.items.forEach((item, idx) => {
    const time = item.time ? `${item.time} — ` : '';
    const title = item.title.startsWith('Song: ') ? `🎵 ${item.title.replace('Song: ', '')}` : item.title;
    text += `${idx + 1}. ${time}${title}\n`;
    if (item.url) text += `   ${item.url}\n`;
  });
  if (oos.childrenSection) {
    text += `\n👶 Children's Section:\n${oos.childrenSection}\n`;
  }
  copyCardText(text.trim(), btnEl);
}
