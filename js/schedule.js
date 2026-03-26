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
        const isPast = eventDate < now;

        return `
          <div class="card" style="margin-bottom:12px;${isPast ? 'opacity:0.5;' : ''}position:relative;">
            <button class="copy-card-btn" onclick="event.stopPropagation(); copyEventCard('${event.id}', this)" title="Copy for sharing">📋</button>
            <div class="card-header">
              <div style="flex:1;">
                <div class="card-meta">${formatDate(event.date)}${event.time ? ' • ' + event.time : ''}</div>
                <div class="card-title">${escapeHtml(event.title)}</div>
                ${event.location ? `<div class="text-muted" style="font-size:13px;margin-top:4px;">📍 ${escapeHtml(event.location)}</div>` : ''}
              </div>
              ${isPast ? '<span class="badge" style="background:var(--muted);">Past</span>' : ''}
            </div>
            ${event.description ? `
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                <p style="margin:0;">${escapeHtml(event.description)}</p>
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

  const sortedSchedule = [...scheduleState.volunteerSchedule].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  return `
    <button class="btn btn-primary" id="addVolunteerBtn" style="display:none;">+ Add Week</button>
    <div id="volunteerForm" style="display:none;margin-bottom:24px;">
      <div class="card">
        <h3 style="margin-bottom:16px;">${scheduleState.editingId ? 'Edit Week' : 'New Week'}</h3>
        <form id="volunteerFormElement">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" class="form-input" id="volDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">Location *</label>
            <input type="text" class="form-input" id="volLocation" required>
          </div>
          <div class="form-group">
            <label class="form-label">Set Up/Clean Up</label>
            <input type="text" class="form-input" id="volSetup" placeholder="Names, comma-separated">
          </div>
          <div class="form-group">
            <label class="form-label">Gospel</label>
            <input type="text" class="form-input" id="volGospel">
          </div>
          <div class="form-group">
            <label class="form-label">Kids</label>
            <input type="text" class="form-input" id="volKids" placeholder="Names, comma-separated">
          </div>
          <div class="form-group">
            <label class="form-label">IT</label>
            <input type="text" class="form-input" id="volIT">
          </div>
          <div class="form-group">
            <label class="form-label">Songs</label>
            <input type="text" class="form-input" id="volSongs">
          </div>
          <div class="form-group">
            <label class="form-label">Passage Theme</label>
            <input type="text" class="form-input" id="volPassage">
          </div>
          <div class="btn-group" style="margin-top:20px;">
            <button type="submit" class="btn btn-primary">${scheduleState.editingId ? 'Save Changes' : 'Add Week'}</button>
            <button type="button" class="btn btn-outline" id="cancelVolunteerBtn">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="volunteerList">
      ${sortedSchedule.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">No volunteer schedule yet</div>
          <div class="empty-sub">Add weeks to the schedule</div>
        </div>
      ` : sortedSchedule.map(week => {
        const weekDate = new Date(week.date);
        const isCurrentWeek = isThisWeek(weekDate);
        const isPast = weekDate < now && !isCurrentWeek;

        return `
          <div class="card" style="margin-bottom:10px;padding:12px 14px;${isCurrentWeek ? 'border:2px solid var(--accent);' : ''}${isPast ? 'opacity:0.5;' : ''}position:relative;">
            <button class="copy-card-btn" onclick="event.stopPropagation(); copyVolunteerCard('${week.id}', this)" title="Copy for sharing">📋</button>
            <div class="card-header" style="padding:0;margin-bottom:0;">
              <div style="flex:1;">
                <div class="card-title" style="font-size:15px;">${formatDate(week.date)}</div>
                <div class="text-muted" style="font-size:12px;margin-top:2px;">📍 ${escapeHtml(week.location)}</div>
              </div>
              ${isCurrentWeek ? '<span class="badge" style="background:var(--accent);color:white;font-size:10px;padding:3px 8px;">THIS WEEK</span>' : ''}
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
              <div style="display:grid;gap:3px;font-size:13px;">
                ${week.setupCleanup ? `<div>🧹 <strong>Set Up/Clean Up:</strong> ${escapeHtml(week.setupCleanup)}</div>` : ''}
                ${week.gospel ? `<div>📖 <strong>Gospel:</strong> ${escapeHtml(week.gospel)}</div>` : ''}
                ${week.kids ? `<div>👶 <strong>Kids:</strong> ${escapeHtml(week.kids)}</div>` : ''}
                ${week.it ? `<div>💻 <strong>IT:</strong> ${escapeHtml(week.it)}</div>` : ''}
                ${week.songs ? `<div>🎵 <strong>Songs:</strong> ${escapeHtml(week.songs)}</div>` : ''}
                ${week.passageTheme ? `<div>📜 <strong>Passage Theme:</strong> ${escapeHtml(week.passageTheme)}</div>` : ''}
              </div>
            </div>
            ${canEdit ? `
              <div class="btn-group" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;" onclick="editVolunteerWeek('${week.id}')">✏️ Edit</button>
                <button class="btn btn-outline" style="font-size:11px;padding:5px 12px;color:var(--red);" onclick="(async () => await deleteVolunteerWeek('${week.id}'))()">🗑️ Delete</button>
                <button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="document.getElementById('addVolunteerBtn').click()">+ New</button>
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
  const cancelBtn = document.getElementById('cancelVolunteerBtn');
  const form = document.getElementById('volunteerFormElement');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      scheduleState.showAddForm = true;
      scheduleState.editingId = null;
      document.getElementById('volunteerForm').style.display = 'block';
      document.getElementById('volLocation').focus();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      scheduleState.showAddForm = false;
      scheduleState.editingId = null;
      document.getElementById('volunteerForm').style.display = 'none';
      form.reset();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveVolunteerWeek();
    });
  }
}

async function saveVolunteerWeek() {
  const date = document.getElementById('volDate').value;
  const location = document.getElementById('volLocation').value.trim();
  const setupCleanup = document.getElementById('volSetup').value.trim();
  const gospel = document.getElementById('volGospel').value.trim();
  const kids = document.getElementById('volKids').value.trim();
  const it = document.getElementById('volIT').value.trim();
  const songs = document.getElementById('volSongs').value.trim();
  const passageTheme = document.getElementById('volPassage').value.trim();

  try {
    if (scheduleState.editingId) {
      // Update existing volunteer week in Firestore
      await db.collection('schedule_volunteers').doc(scheduleState.editingId).update({
        date,
        location,
        setupCleanup,
        gospel,
        kids,
        it,
        songs,
        passageTheme
      });

      // Update local state
      const week = scheduleState.volunteerSchedule.find(w => w.id === scheduleState.editingId);
      if (week) {
        week.date = date;
        week.location = location;
        week.setupCleanup = setupCleanup;
        week.gospel = gospel;
        week.kids = kids;
        week.it = it;
        week.songs = songs;
        week.passageTheme = passageTheme;
      }
    } else {
      // Add new volunteer week to Firestore
      const weekData = {
        date,
        location,
        setupCleanup,
        gospel,
        kids,
        it,
        songs,
        passageTheme,
        createdAt: firebase.firestore.Timestamp.now()
      };

      const docRef = await db.collection('schedule_volunteers').add(weekData);

      // Add to local state
      scheduleState.volunteerSchedule.push({
        id: docRef.id,
        ...weekData,
        createdAt: new Date().toISOString()
      });
    }

    scheduleState.showAddForm = false;
    scheduleState.editingId = null;
    renderScheduleContent();
  } catch (error) {
    console.error('Error saving volunteer week:', error);
    alert('Failed to save volunteer week. Please try again.');
  }
}

function editVolunteerWeek(id) {
  const week = scheduleState.volunteerSchedule.find(w => w.id === id);
  if (!week) return;

  scheduleState.editingId = id;
  scheduleState.showAddForm = true;

  document.getElementById('volDate').value = week.date;
  document.getElementById('volLocation').value = week.location;
  document.getElementById('volSetup').value = week.setupCleanup || '';
  document.getElementById('volGospel').value = week.gospel || '';
  document.getElementById('volKids').value = week.kids || '';
  document.getElementById('volIT').value = week.it || '';
  document.getElementById('volSongs').value = week.songs || '';
  document.getElementById('volPassage').value = week.passageTheme || '';
  document.getElementById('volunteerForm').style.display = 'block';
  document.getElementById('volLocation').focus();
}

async function deleteVolunteerWeek(id) {
  if (!confirm('Delete this week?')) return;

  try {
    // Delete from Firestore
    await db.collection('schedule_volunteers').doc(id).delete();

    // Remove from local state
    scheduleState.volunteerSchedule = scheduleState.volunteerSchedule.filter(w => w.id !== id);
    renderScheduleContent();
  } catch (error) {
    console.error('Error deleting volunteer week:', error);
    alert('Failed to delete volunteer week. Please try again.');
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
          <button class="copy-card-btn" onclick="event.stopPropagation(); copyOoSCard('${currentOoS.id}', this)" title="Copy for sharing">📋</button>
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
