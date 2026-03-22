/* ====================================
   SCHEDULE PAGE
   ==================================== */

let scheduleState = {
  events: [],
  volunteerSchedule: [],
  orderOfService: [],
  currentTab: 'events', // 'events', 'volunteering', 'oos'
  searchQuery: '',
  showAddForm: false,
  editingId: null
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
            <button class="btn ${scheduleState.currentTab === 'oos' ? 'btn-primary' : 'btn-outline'}" id="oosTabBtn">Friday OoS</button>
          </div>
          ${isEditor() ? `<button class="btn btn-primary" id="quickAddBtn" style="flex:none;padding:10px 16px;font-size:13px;min-height:44px;">+</button>` : ''}
        </div>
      </div>

      <div id="scheduleContent"></div>
    </div>
  `;
}

async function initSchedulePage() {
  await loadScheduleData();
  renderScheduleContent();

  document.getElementById('eventsTabBtn').addEventListener('click', () => {
    scheduleState.currentTab = 'events';
    renderScheduleContent();
  });

  document.getElementById('volunteeringTabBtn').addEventListener('click', () => {
    scheduleState.currentTab = 'volunteering';
    renderScheduleContent();
  });

  document.getElementById('oosTabBtn').addEventListener('click', () => {
    scheduleState.currentTab = 'oos';
    renderScheduleContent();
  });

  const quickAddBtn = document.getElementById('quickAddBtn');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
      if (scheduleState.currentTab === 'events') {
        document.getElementById('addEventBtn')?.click();
      } else if (scheduleState.currentTab === 'volunteering') {
        document.getElementById('addVolunteerBtn')?.click();
      } else if (scheduleState.currentTab === 'oos') {
        document.getElementById('addOoSBtn')?.click();
      }
    });
  }
}

async function loadScheduleData() {
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
        </div>
      ` : sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < now;

        return `
          <div class="card" style="margin-bottom:12px;${isPast ? 'opacity:0.5;' : ''}">
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
                <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editEvent('${event.id}')">✏️ Edit</button>
                <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="(async () => await deleteEvent('${event.id}'))()">🗑️ Delete</button>
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
          <div class="card" style="margin-bottom:16px;${isCurrentWeek ? 'border:2px solid var(--accent);' : ''}${isPast ? 'opacity:0.5;' : ''}">
            <div class="card-header">
              <div style="flex:1;">
                <div class="card-title">${formatDate(week.date)}</div>
                <div class="text-muted" style="font-size:13px;margin-top:4px;">📍 ${escapeHtml(week.location)}</div>
              </div>
              ${isCurrentWeek ? '<span class="badge" style="background:var(--accent);color:white;">This Week</span>' : ''}
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
              <div style="display:grid;gap:8px;">
                ${week.setupCleanup ? `<div><strong>Set Up/Clean Up:</strong> ${escapeHtml(week.setupCleanup)}</div>` : ''}
                ${week.gospel ? `<div><strong>Gospel:</strong> ${escapeHtml(week.gospel)}</div>` : ''}
                ${week.kids ? `<div><strong>Kids:</strong> ${escapeHtml(week.kids)}</div>` : ''}
                ${week.it ? `<div><strong>IT:</strong> ${escapeHtml(week.it)}</div>` : ''}
                ${week.songs ? `<div><strong>Songs:</strong> ${escapeHtml(week.songs)}</div>` : ''}
                ${week.passageTheme ? `<div><strong>Passage Theme:</strong> ${escapeHtml(week.passageTheme)}</div>` : ''}
              </div>
            </div>
            ${canEdit ? `
              <div class="btn-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editVolunteerWeek('${week.id}')">✏️ Edit</button>
                <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="(async () => await deleteVolunteerWeek('${week.id}'))()">🗑️ Delete</button>
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
      document.getElementById('volDate').focus();
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
  document.getElementById('volDate').focus();
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
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header">
            <div style="flex:1;">
              <div class="card-title">Order of Service</div>
              <div class="card-meta">${formatDate(currentOoS.date)}</div>
            </div>
          </div>

          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
            <div style="margin-bottom:16px;">
              <strong>Venue:</strong> ${escapeHtml(currentOoS.venueName)}
              ${currentOoS.venueUrl ? `<br><a href="${escapeHtml(currentOoS.venueUrl)}" target="_blank" style="color:var(--accent);text-decoration:none;">📍 View on Google Maps 🔗</a>` : ''}
            </div>

            <div style="margin-top:16px;">
              <strong>Service Items:</strong>
              <div style="margin-top:8px;display:grid;gap:8px;">
                ${currentOoS.items.map((item, idx) => `
                  <div style="display:flex;gap:12px;align-items:start;">
                    <span style="color:var(--muted);font-weight:bold;min-width:20px;">${idx + 1}.</span>
                    <div style="flex:1;">
                      ${item.time ? `<span style="font-weight:bold;">${escapeHtml(item.time)}</span> — ` : ''}
                      ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color:var(--accent);text-decoration:none;">${escapeHtml(item.title)} 🔗</a>` : escapeHtml(item.title)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            ${currentOoS.childrenSection ? `
              <div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:8px;">
                <strong>Children's Section:</strong>
                <p style="margin:8px 0 0 0;">${escapeHtml(currentOoS.childrenSection)}</p>
              </div>
            ` : ''}
          </div>

          ${canEdit ? `
            <div class="btn-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
              <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editOoS('${currentOoS.id}')">✏️ Edit</button>
              <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="(async () => await deleteOoS('${currentOoS.id}'))()">🗑️ Delete</button>
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
      document.getElementById('oosDate').focus();
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
  document.getElementById('oosDate').focus();
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
