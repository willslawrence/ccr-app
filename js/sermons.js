/* ====================================
   SERMONS PAGE
   ==================================== */

let sermonsState = {
  sermons: [],
  searchQuery: '',
  showUploadForm: false,
  playingId: null
};

function renderSermonsPage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">🎧 Sermons</h1>
          <p class="page-subtitle">Listen to past sermons and teachings</p>
        </div>

        <div class="btn-group">
          ${isEditor() ? '<button class="btn btn-primary" id="uploadSermonBtn">+ Upload Sermon</button>' : ''}
          <button class="btn btn-outline" id="searchSermonBtn">🔍 Search</button>
        </div>
      </div>

      <div class="search-bar" id="sermonSearchBar" style="display:none;">
        <span class="search-icon">🔍</span>
        <input type="text" id="sermonSearchInput" placeholder="Search sermons...">
      </div>

      <div id="sermonUploadForm" style="display:none;margin:24px 0;">
        <div class="card">
          <h3 style="margin-bottom:16px;">Upload Sermon</h3>
          <form id="sermonForm">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" id="sermonTitle" required placeholder="e.g., The Good Shepherd">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Speaker *</label>
                <input type="text" class="form-input" id="sermonSpeaker" required>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Date *</label>
                <input type="date" class="form-input" id="sermonDate" required>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Duration</label>
                <input type="text" class="form-input" id="sermonDuration" placeholder="e.g., 35:42">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Scripture Reference</label>
                <input type="text" class="form-input" id="sermonScripture" placeholder="e.g., John 10:1-18">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description / Notes</label>
              <textarea class="form-textarea" id="sermonDescription" rows="4" placeholder="Summary or key points from the sermon"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Audio File *</label>
              <input type="file" class="form-input" id="sermonAudioFile" accept="audio/*" required>
              <div style="margin-top:8px;padding:12px;background:var(--bg);border-radius:8px;font-size:13px;color:var(--muted);">
                <strong>Note:</strong> Audio upload functionality requires Firebase Storage.
                For now, this simulates the upload process with mock data.
                In production, files would be uploaded to Firebase Storage and URLs stored in Firestore.
              </div>
            </div>
            <div class="btn-group" style="margin-top:20px;">
              <button type="submit" class="btn btn-primary">Upload Sermon</button>
              <button type="button" class="btn btn-outline" id="cancelSermonBtn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div id="sermonList"></div>
      <div id="sermonEmpty" class="empty-state" style="display:none;">
        <div class="empty-icon">🎧</div>
        <div class="empty-text">No sermons yet</div>
        <div class="empty-sub">Uploaded sermons will appear here</div>
      </div>
    </div>
  `;
}

async function initSermonsPage() {
  await loadSermons();
  renderSermons();

  const uploadBtn = document.getElementById('uploadSermonBtn');
  const searchBtn = document.getElementById('searchSermonBtn');
  const searchInput = document.getElementById('sermonSearchInput');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      sermonsState.showUploadForm = !sermonsState.showUploadForm;
      document.getElementById('sermonUploadForm').style.display = sermonsState.showUploadForm ? 'block' : 'none';
      if (sermonsState.showUploadForm) {
        document.getElementById('sermonTitle').focus();
      }
    });
  }

  searchBtn.addEventListener('click', () => {
    const searchBar = document.getElementById('sermonSearchBar');
    const isVisible = searchBar.style.display === 'block';
    searchBar.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) searchInput.focus();
  });

  searchInput.addEventListener('input', (e) => {
    sermonsState.searchQuery = e.target.value.toLowerCase();
    renderSermons();
  });

  const cancelBtn = document.getElementById('cancelSermonBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      sermonsState.showUploadForm = false;
      document.getElementById('sermonUploadForm').style.display = 'none';
      document.getElementById('sermonForm').reset();
    });
  }

  const form = document.getElementById('sermonForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      await handleSermonUpload(e);
    });
  }
}

async function loadSermons() {
  try {
    const snapshot = await db.collection('sermons').orderBy('date', 'desc').get();
    sermonsState.sermons = snapshot.docs.map(doc => {
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
    console.error('Error loading sermons:', error);
    sermonsState.sermons = [];
  }
}

async function handleSermonUpload(e) {
  e.preventDefault();

  try {
    const title = document.getElementById('sermonTitle').value.trim();
    const speaker = document.getElementById('sermonSpeaker').value.trim();
    const date = document.getElementById('sermonDate').value;
    const duration = document.getElementById('sermonDuration').value.trim();
    const scripture = document.getElementById('sermonScripture').value.trim();
    const description = document.getElementById('sermonDescription').value.trim();
    const audioFile = document.getElementById('sermonAudioFile').files[0];
    const user = getCurrentUser();

    // Mock audio URL (in production, this would be Firebase Storage URL)
    const mockAudioUrl = audioFile ? `https://storage.firebase.app/sermons/${audioFile.name}` : '';

    await db.collection('sermons').add({
      title,
      speaker,
      date,
      duration: duration || 'Unknown',
      scriptureRef: scripture,
      description,
      audioUrl: mockAudioUrl,
      audioFileName: audioFile ? audioFile.name : '',
      uploadedBy: user.uid,
      uploaderName: user.name,
      createdAt: firebase.firestore.Timestamp.now()
    });

    sermonsState.showUploadForm = false;
    document.getElementById('sermonUploadForm').style.display = 'none';
    document.getElementById('sermonForm').reset();
    await loadSermons();
    renderSermons();
  } catch (error) {
    console.error('Error uploading sermon:', error);
    alert('Error uploading sermon. Please try again.');
  }
}

function renderSermons() {
  const list = document.getElementById('sermonList');
  const empty = document.getElementById('sermonEmpty');

  let sermons = sermonsState.sermons;

  // Apply search filter
  if (sermonsState.searchQuery) {
    sermons = sermons.filter(s =>
      s.title.toLowerCase().includes(sermonsState.searchQuery) ||
      s.speaker.toLowerCase().includes(sermonsState.searchQuery) ||
      s.scriptureRef.toLowerCase().includes(sermonsState.searchQuery) ||
      s.description.toLowerCase().includes(sermonsState.searchQuery)
    );
  }

  if (sermons.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  list.innerHTML = sermons.map(sermon => {
    const isPlaying = sermonsState.playingId === sermon.id;

    return `
      <div class="card card-clickable" style="margin-bottom:12px;" onclick="toggleSermonDetails('${sermon.id}')">
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-meta">${formatDate(sermon.date)} · ${escapeHtml(sermon.speaker)}</div>
            <div class="card-title">${escapeHtml(sermon.title)}</div>
            ${sermon.scriptureRef ? `<div class="text-muted" style="font-size:13px;margin-top:4px;">📖 ${escapeHtml(sermon.scriptureRef)}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div class="badge" style="background:var(--accent);color:white;">${sermon.duration}</div>
          </div>
        </div>

        <div id="sermonDetails_${sermon.id}" style="display:${isPlaying ? 'block' : 'none'};margin-top:16px;padding-top:16px;border-top:1px solid var(--border);" onclick="event.stopPropagation();">
          ${sermon.description ? `
            <div style="margin-bottom:16px;">
              <strong>Description:</strong>
              <p style="margin:8px 0 0 0;line-height:1.6;">${escapeHtml(sermon.description)}</p>
            </div>
          ` : ''}

          <div style="margin-bottom:16px;">
            <strong>Audio Player:</strong>
            <div style="margin-top:8px;padding:16px;background:var(--bg);border-radius:12px;display:flex;align-items:center;gap:12px;">
              <button class="btn ${isPlaying ? 'btn-outline' : 'btn-primary'}" style="font-size:24px;width:48px;height:48px;padding:0;border-radius:50%;" onclick="togglePlaySermon('${sermon.id}')">
                ${isPlaying ? '⏸' : '▶'}
              </button>
              <div style="flex:1;">
                <div style="height:4px;background:var(--border);border-radius:2px;position:relative;">
                  <div style="position:absolute;top:0;left:0;height:100%;width:${isPlaying ? '45%' : '0%'};background:var(--accent);border-radius:2px;transition:width 0.3s;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:12px;color:var(--muted);">
                  <span>${isPlaying ? '15:23' : '0:00'}</span>
                  <span>${sermon.duration}</span>
                </div>
              </div>
              <button class="btn btn-outline" style="font-size:20px;width:40px;height:40px;padding:0;border-radius:50%;" onclick="downloadSermon('${sermon.id}')">
                ⬇
              </button>
            </div>
            <div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--muted);">
              <strong>Mock Audio Player:</strong> In production, this would be a real HTML5 audio player connected to Firebase Storage.
              The play/pause button and progress bar would control actual audio playback.
            </div>
          </div>

          ${isEditor() ? `
            <div class="btn-group">
              <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="editSermon('${sermon.id}')">✏️ Edit</button>
              <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="deleteSermon('${sermon.id}')">🗑️ Delete</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleSermonDetails(id) {
  const details = document.getElementById(`sermonDetails_${id}`);
  const isVisible = details.style.display === 'block';

  // Close all other details
  document.querySelectorAll('[id^="sermonDetails_"]').forEach(el => {
    el.style.display = 'none';
  });

  // Toggle this one
  details.style.display = isVisible ? 'none' : 'block';
}

function togglePlaySermon(id) {
  if (sermonsState.playingId === id) {
    sermonsState.playingId = null;
  } else {
    sermonsState.playingId = id;
  }
  renderSermons();
}

function downloadSermon(id) {
  const sermon = sermonsState.sermons.find(s => s.id === id);
  if (!sermon) return;

  alert(`Download functionality:\n\nIn production, this would download the audio file from:\n${sermon.audioUrl}\n\nFile: ${sermon.audioFileName}`);
}

async function editSermon(id) {
  try {
    const sermon = sermonsState.sermons.find(s => s.id === id);
    if (!sermon) return;

    const title = prompt('Title:', sermon.title);
    if (title === null) return;

    const speaker = prompt('Speaker:', sermon.speaker);
    if (speaker === null) return;

    const scripture = prompt('Scripture reference:', sermon.scriptureRef);
    if (scripture === null) return;

    const description = prompt('Description:', sermon.description);
    if (description === null) return;

    await db.collection('sermons').doc(id).update({
      title: title.trim(),
      speaker: speaker.trim(),
      scriptureRef: scripture.trim(),
      description: description.trim(),
      updatedAt: firebase.firestore.Timestamp.now()
    });

    await loadSermons();
    renderSermons();
  } catch (error) {
    console.error('Error editing sermon:', error);
    alert('Error editing sermon. Please try again.');
  }
}

async function deleteSermon(id) {
  if (!confirm('Delete this sermon? This cannot be undone.')) return;

  try {
    await db.collection('sermons').doc(id).delete();
    await loadSermons();
    renderSermons();
  } catch (error) {
    console.error('Error deleting sermon:', error);
    alert('Error deleting sermon. Please try again.');
  }
}
