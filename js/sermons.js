/* ====================================
   SERMONS PAGE
   ==================================== */

let sermonsState = {
  sermons: [],
  searchQuery: '',
  showUploadForm: false,
  playingId: null,
  dataLoaded: false  // Cache flag
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
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:100%;">
              <div class="form-group" style="margin-bottom:0;min-width:0;">
                <label class="form-label">Speaker *</label>
                <input type="text" class="form-input" id="sermonSpeaker" required>
              </div>
              <div class="form-group" style="margin-bottom:0;min-width:0;">
                <label class="form-label">Date *</label>
                <input type="date" class="form-input" id="sermonDate" required style="min-width:0;">
              </div>
              <div class="form-group" style="margin-bottom:0;min-width:0;">
                <label class="form-label">Duration</label>
                <input type="text" class="form-input" id="sermonDuration" placeholder="e.g., 35:42">
              </div>
              <div class="form-group" style="margin-bottom:0;min-width:0;">
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
              <input type="file" class="form-input" id="sermonAudioFile" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.wma,.flac,.caf" required>
              <div id="uploadProgress" style="display:none;margin-top:12px;">
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                  <div id="uploadProgressBar" style="height:100%;width:0%;background:var(--accent);transition:width 0.3s;"></div>
                </div>
                <div style="margin-top:6px;font-size:12px;color:var(--muted);text-align:center;" id="uploadProgressText">Uploading...</div>
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

async function loadSermons(forceRefresh = false) {
  if (sermonsState.dataLoaded && !forceRefresh) return;
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
    sermonsState.dataLoaded = true;
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

    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    // Show upload progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Uploading...';

    // Disable submit button
    const submitBtn = document.querySelector('#sermonForm button[type="submit"]');
    submitBtn.disabled = true;

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_${audioFile.name}`;
    await ensureStorage();
    const storageRef = storage.ref(`sermons/${fileName}`);

    // Upload file with progress tracking
    const uploadTask = storageRef.put(audioFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        // Track upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
      },
      (error) => {
        // Handle upload error
        console.error('Upload error:', error);
        alert('Error uploading file: ' + error.message);
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
      },
      async () => {
        // Upload complete - get download URL
        try {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          progressText.textContent = 'Upload complete! Saving...';

          // Save sermon data to Firestore
          await db.collection('sermons').add({
            title,
            speaker,
            date,
            duration: duration || 'Unknown',
            scriptureRef: scripture,
            description,
            audioUrl: downloadURL,
            audioFileName: audioFile.name,
            storageFileName: fileName,
            uploadedBy: user.uid,
            uploaderName: user.name,
            createdAt: firebase.firestore.Timestamp.now()
          });

          // Reset form
          sermonsState.showUploadForm = false;
          document.getElementById('sermonUploadForm').style.display = 'none';
          document.getElementById('sermonForm').reset();
          progressDiv.style.display = 'none';
          submitBtn.disabled = false;

          // Reload sermons list
          await loadSermons(true);
          renderSermons();
        } catch (error) {
          console.error('Error saving sermon:', error);
          alert('Error saving sermon. Please try again.');
          progressDiv.style.display = 'none';
          submitBtn.disabled = false;
        }
      }
    );
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

  list.innerHTML = '<div class="sermon-grid">' + sermons.map(sermon => {
    const isPlaying = sermonsState.playingId === sermon.id;

    return `
      <div class="card card-clickable sermon-card" onclick="openSermonModal('${sermon.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="flex:1;min-width:0;">
            <div class="card-meta" style="font-size:11px;">${formatDate(sermon.date)} · ${escapeHtml(sermon.speaker)}</div>
            <div class="card-title" style="font-size:14px;margin-top:2px;">${escapeHtml(sermon.title)}</div>
            ${sermon.scriptureRef ? `<div class="text-muted" style="font-size:11px;margin-top:3px;">📖 ${escapeHtml(sermon.scriptureRef)}</div>` : ''}
          </div>
          <div class="badge" style="background:var(--accent);color:white;font-size:10px;padding:3px 8px;flex-shrink:0;margin-left:8px;">${sermon.duration}</div>
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

function openSermonModal(id) {
  const sermon = sermonsState.sermons.find(s => s.id === id);
  if (!sermon) return;

  const modal = document.getElementById('bookDetailModal');
  if (!modal) return;

  const modalContent = modal.querySelector('.modal');
  modalContent.innerHTML = `
    <button class="modal-close" onclick="document.getElementById('bookDetailModal').classList.remove('active')">×</button>
    <div style="margin-bottom:16px;">
      <div class="card-meta" style="font-size:12px;">${formatDate(sermon.date)} · ${escapeHtml(sermon.speaker)}</div>
      <h2 style="font-size:20px;font-weight:700;margin-top:4px;">${escapeHtml(sermon.title)}</h2>
      ${sermon.scriptureRef ? `<div class="text-muted" style="font-size:13px;margin-top:4px;">📖 ${escapeHtml(sermon.scriptureRef)}</div>` : ''}
      <div class="badge" style="background:var(--accent);color:white;margin-top:8px;display:inline-block;">${sermon.duration}</div>
    </div>

    ${sermon.description ? `
      <div style="margin-bottom:20px;padding-top:16px;border-top:1px solid var(--border);">
        <strong>Description:</strong>
        <p style="margin:8px 0 0 0;line-height:1.6;color:var(--text);">${escapeHtml(sermon.description)}</p>
      </div>
    ` : ''}

    <div style="margin-bottom:20px;">
      <strong>Audio Player:</strong>
      <div style="margin-top:8px;padding:12px;background:var(--surface);border-radius:12px;">
        <audio id="audioPlayer_${sermon.id}" src="${sermon.audioUrl}" style="display:none;"></audio>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-primary" id="playBtn_${sermon.id}" style="width:44px;height:44px;min-width:44px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;" onclick="togglePlaySermon('${sermon.id}')">
            ▶︎
          </button>
          <div style="flex:1;min-width:0;">
            <div id="progressBarContainer_${sermon.id}" style="height:6px;background:var(--border);border-radius:3px;position:relative;cursor:pointer;" onclick="seekAudio('${sermon.id}', event)">
              <div id="progressBar_${sermon.id}" style="position:absolute;top:0;left:0;height:100%;width:0%;background:var(--accent);border-radius:3px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--muted);">
              <span id="currentTime_${sermon.id}">0:00</span>
              <span id="totalTime_${sermon.id}">${sermon.duration}</span>
            </div>
          </div>
          <button class="btn btn-outline" style="width:36px;height:36px;min-width:36px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;" onclick="downloadSermon('${sermon.id}')">
            ⬇︎
          </button>
        </div>
      </div>
    </div>

    ${isEditor() ? `
      <div class="btn-group" style="padding-top:16px;border-top:1px solid var(--border);">
        <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;" onclick="document.getElementById('bookDetailModal').classList.remove('active');editSermon('${sermon.id}')">✏️ Edit</button>
        <button class="btn btn-outline" style="font-size:13px;padding:8px 16px;color:var(--red);" onclick="document.getElementById('bookDetailModal').classList.remove('active');deleteSermon('${sermon.id}')">🗑️ Delete</button>
      </div>
    ` : ''}
  `;

  modal.classList.add('active');

  // Setup audio player event listeners
  setupAudioPlayer(sermon.id);

  // Click outside to close
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}

function setupAudioPlayer(id) {
  const audio = document.getElementById(`audioPlayer_${id}`);
  const playBtn = document.getElementById(`playBtn_${id}`);
  const progressBar = document.getElementById(`progressBar_${id}`);
  const currentTimeEl = document.getElementById(`currentTime_${id}`);
  const totalTimeEl = document.getElementById(`totalTime_${id}`);

  if (!audio) return;

  // Update total time when metadata loads
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  // Update progress bar and time during playback
  audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = progress + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  // Reset play button when audio ends
  audio.addEventListener('ended', () => {
    playBtn.textContent = '▶︎';
    sermonsState.playingId = null;
  });
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlaySermon(id) {
  const audio = document.getElementById(`audioPlayer_${id}`);
  const playBtn = document.getElementById(`playBtn_${id}`);

  if (!audio) return;

  if (audio.paused) {
    // Pause any other playing sermon
    if (sermonsState.playingId && sermonsState.playingId !== id) {
      const otherAudio = document.getElementById(`audioPlayer_${sermonsState.playingId}`);
      const otherBtn = document.getElementById(`playBtn_${sermonsState.playingId}`);
      if (otherAudio) otherAudio.pause();
      if (otherBtn) otherBtn.textContent = '▶︎';
    }

    audio.play();
    playBtn.textContent = '⏸';
    sermonsState.playingId = id;
  } else {
    audio.pause();
    playBtn.textContent = '▶︎';
    sermonsState.playingId = null;
  }
}

function seekAudio(id, event) {
  const audio = document.getElementById(`audioPlayer_${id}`);
  const progressContainer = document.getElementById(`progressBarContainer_${id}`);

  if (!audio || !progressContainer) return;

  const rect = progressContainer.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const percentage = clickX / width;

  audio.currentTime = percentage * audio.duration;
}

function downloadSermon(id) {
  const sermon = sermonsState.sermons.find(s => s.id === id);
  if (!sermon || !sermon.audioUrl) return;

  // Open audio URL in new tab for download
  window.open(sermon.audioUrl, '_blank');
}

function editSermon(id) {
  const sermon = sermonsState.sermons.find(s => s.id === id);
  if (!sermon) return;

  // Show edit form in the modal
  const modal = document.getElementById('bookDetailModal');
  const modalContent = modal.querySelector('.modal');
  modalContent.innerHTML = `
    <button class="modal-close" onclick="document.getElementById('bookDetailModal').classList.remove('active')">×</button>
    <h2 style="font-size:18px;font-weight:700;margin-bottom:16px;">✏️ Edit Sermon</h2>
    <form id="editSermonForm">
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="editSermonTitle" value="${escapeHtml(sermon.title)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Speaker *</label>
        <input type="text" class="form-input" id="editSermonSpeaker" value="${escapeHtml(sermon.speaker)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Scripture Reference</label>
        <input type="text" class="form-input" id="editSermonScripture" value="${escapeHtml(sermon.scriptureRef || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Duration</label>
        <input type="text" class="form-input" id="editSermonDuration" value="${escapeHtml(sermon.duration || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="editSermonDescription" rows="4">${escapeHtml(sermon.description || '')}</textarea>
      </div>
      <div class="btn-group" style="margin-top:16px;">
        <button type="submit" class="btn btn-primary">💾 Save</button>
        <button type="button" class="btn btn-outline" onclick="openSermonModal('${id}')">Cancel</button>
      </div>
    </form>
  `;

  document.getElementById('editSermonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await db.collection('sermons').doc(id).update({
        title: document.getElementById('editSermonTitle').value.trim(),
        speaker: document.getElementById('editSermonSpeaker').value.trim(),
        scriptureRef: document.getElementById('editSermonScripture').value.trim(),
        duration: document.getElementById('editSermonDuration').value.trim(),
        description: document.getElementById('editSermonDescription').value.trim(),
        updatedAt: firebase.firestore.Timestamp.now()
      });
      await loadSermons(true);
      renderSermons();
      modal.classList.remove('active');
    } catch (error) {
      console.error('Error editing sermon:', error);
      alert('Error saving. Please try again.');
    }
  });
}

async function deleteSermon(id) {
  if (!confirm('Delete this sermon? This cannot be undone.')) return;

  try {
    // Get sermon data to find the storage file
    const sermon = sermonsState.sermons.find(s => s.id === id);

    // Delete from Firestore
    await db.collection('sermons').doc(id).delete();

    // Delete audio file from Storage (if it exists)
    if (sermon && sermon.storageFileName) {
      try {
        await ensureStorage();
        const storageRef = storage.ref(`sermons/${sermon.storageFileName}`);
        await storageRef.delete();
        console.log('Audio file deleted from Storage');
      } catch (storageError) {
        console.warn('Error deleting audio file from Storage (may not exist):', storageError.message);
      }
    }

    // Optimistic update: remove from local state immediately
    sermonsState.sermons = sermonsState.sermons.filter(s => s.id !== id);
    renderSermons();
    await db.collection('sermons').doc(id).delete().catch(async (error) => {
      console.error('Error deleting sermon:', error);
      alert('Error deleting sermon. Please try again.');
      await loadSermons(true);
      renderSermons();
    });
  } catch (error) {
    console.error('Error deleting sermon:', error);
    alert('Error deleting sermon. Please try again.');
    await loadSermons(true);
    renderSermons();
  }
}
