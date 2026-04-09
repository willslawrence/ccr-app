/* ====================================
   DOCUMENTS PAGE
   Church document library with categories
   ==================================== */

let documentsState = {
  documents: [],
  expandedCategories: {},
  dataLoaded: false,
  editingDoc: null
};

const DOC_CATEGORIES = [
  { key: 'governance',  icon: '📜', label: 'Governance' },
  { key: 'financial',   icon: '💰', label: 'Financial Reports' },
  { key: 'safety',      icon: '👶', label: 'Safety & Policies' },
  { key: 'membership',  icon: '📋', label: 'Membership' },
  { key: 'other',       icon: '📄', label: 'Other' }
];

function renderDocumentsPage() {
  return `
    <div class="page">
      <div class="page-sticky-banner">
        <div class="page-header">
          <h1 class="page-title">📄 Documents</h1>
          <p class="page-subtitle">Church documents & resources</p>
        </div>
        <div class="btn-group">
          ${isEditor() ? '<button class="btn btn-primary" id="uploadDocBtn">+ Upload Document</button>' : ''}
        </div>
      </div>

      <!-- Upload Form (hidden by default) -->
      <div id="docUploadForm" style="display:none;margin:24px 0;">
        <div class="card">
          <h3 style="margin-bottom:16px;" id="docFormTitle">Upload Document</h3>
          <form id="documentForm">
            <div class="form-group">
              <label class="form-label">Document Name *</label>
              <input type="text" class="form-input" id="docName" required placeholder="e.g., Church Covenant">
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select class="form-input" id="docCategory" required>
                ${DOC_CATEGORIES.map(c => `<option value="${c.key}">${c.icon} ${c.label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" id="docFileGroup">
              <label class="form-label">PDF File *</label>
              <input type="file" class="form-input" id="docFile" accept=".pdf,application/pdf" required>
              <div id="docUploadProgress" style="display:none;margin-top:12px;">
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                  <div id="docUploadProgressBar" style="height:100%;width:0%;background:var(--accent);transition:width 0.3s;"></div>
                </div>
                <div style="margin-top:6px;font-size:12px;color:var(--muted);text-align:center;" id="docUploadProgressText">Uploading...</div>
              </div>
            </div>
            <div class="btn-group" style="margin-top:20px;">
              <button type="submit" class="btn btn-primary" id="docSubmitBtn">Upload Document</button>
              <button type="button" class="btn btn-outline" id="cancelDocBtn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div id="docCategoryList"></div>
      <div id="docEmpty" class="empty-state" style="display:none;">
        <div class="empty-icon">📄</div>
        <div class="empty-text">No documents yet</div>
        <div class="empty-sub">Uploaded documents will appear here</div>
      </div>
    </div>
  `;
}

async function initDocumentsPage() {
  await loadDocuments();
  renderDocumentCategories();

  const uploadBtn = document.getElementById('uploadDocBtn');
  const cancelBtn = document.getElementById('cancelDocBtn');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      documentsState.editingDoc = null;
      const form = document.getElementById('documentForm');
      form.reset();
      document.getElementById('docFormTitle').textContent = 'Upload Document';
      document.getElementById('docSubmitBtn').textContent = 'Upload Document';
      document.getElementById('docFileGroup').style.display = 'block';
      document.getElementById('docFile').required = true;
      document.getElementById('docUploadForm').style.display = 'block';
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      documentsState.editingDoc = null;
      document.getElementById('docUploadForm').style.display = 'none';
      document.getElementById('documentForm').reset();
    });
  }

  const form = document.getElementById('documentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (documentsState.editingDoc) {
        await handleDocumentEdit(e);
      } else {
        await handleDocumentUpload(e);
      }
    });
  }
}

async function loadDocuments(forceRefresh = false) {
  if (documentsState.dataLoaded && !forceRefresh) return;
  try {
    const snapshot = await db.collection('documents').orderBy('uploadedAt', 'desc').get();
    documentsState.documents = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt instanceof firebase.firestore.Timestamp
          ? data.uploadedAt.toDate().toISOString()
          : data.uploadedAt
      };
    });
    documentsState.dataLoaded = true;
  } catch (error) {
    console.error('Error loading documents:', error);
    documentsState.documents = [];
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderDocumentCategories() {
  const container = document.getElementById('docCategoryList');
  const emptyEl = document.getElementById('docEmpty');
  if (!container) return;

  if (documentsState.documents.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  // Group documents by category
  const grouped = {};
  DOC_CATEGORIES.forEach(c => { grouped[c.key] = []; });
  documentsState.documents.forEach(doc => {
    const cat = grouped[doc.category] ? doc.category : 'other';
    grouped[cat].push(doc);
  });

  // Default collapse all categories
  DOC_CATEGORIES.forEach(c => {
    if (documentsState.expandedCategories[c.key] === undefined) {
      documentsState.expandedCategories[c.key] = false;
    }
  });

  let html = '';
  DOC_CATEGORIES.forEach(cat => {
    const docs = grouped[cat.key];
    if (docs.length === 0) return;

    const isExpanded = documentsState.expandedCategories[cat.key];
    html += `
      <div class="doc-category-section">
        <button class="doc-category-header" data-category="${cat.key}">
          <span class="doc-category-title">${cat.icon} ${cat.label}</span>
          <span class="doc-category-count">${docs.length}</span>
          <span class="doc-category-chevron ${isExpanded ? 'expanded' : ''}">▸</span>
        </button>
        <div class="doc-category-body ${isExpanded ? 'expanded' : ''}">
          ${docs.map(doc => renderDocCard(doc)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind accordion toggles
  container.querySelectorAll('.doc-category-header').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.dataset.category;
      documentsState.expandedCategories[key] = !documentsState.expandedCategories[key];
      const chevron = header.querySelector('.doc-category-chevron');
      const body = header.nextElementSibling;
      chevron.classList.toggle('expanded');
      body.classList.toggle('expanded');
    });
  });

  // Bind doc card actions
  container.querySelectorAll('.doc-download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });
  });

  // View-only buttons for members (embedded PDF viewer, no download)
  // URL is resolved from state at click time — not stored in DOM
  container.querySelectorAll('.doc-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const docId = btn.dataset.docId;
      const name = btn.dataset.name;
      const doc = documentsState.documents.find(d => d.id === docId);
      if (doc && doc.storageUrl) {
        openDocViewer(doc.storageUrl, name);
      }
    });
  });

  container.querySelectorAll('.doc-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const docId = btn.dataset.id;
      startEditDocument(docId);
    });
  });

  container.querySelectorAll('.doc-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const docId = btn.dataset.id;
      deleteDocument(docId);
    });
  });
}

function renderDocCard(doc) {
  const canEdit = isEditor();
  const canDownload = isEditor();
  return `
    <div class="doc-card card">
      <div class="doc-card-main">
        <div class="doc-card-icon">📄</div>
        <div class="doc-card-info">
          <div class="doc-card-name">${escapeHtml(doc.name)}</div>
          <div class="doc-card-meta">
            ${formatDate(doc.uploadedAt)} · ${formatFileSize(doc.fileSize)}
          </div>
        </div>
        ${canDownload ? `
          <button class="doc-download-btn btn btn-outline" data-url="${doc.storageUrl || ''}" data-name="${escapeHtml(doc.name)}" style="font-size:13px;padding:8px 14px;white-space:nowrap;">
            ⬇️ Open
          </button>
        ` : `
          <button class="doc-view-btn btn btn-outline" data-url="" data-name="${escapeHtml(doc.name)}" data-doc-id="${doc.id}" style="font-size:13px;padding:8px 14px;white-space:nowrap;">
            👁️ View
          </button>
        `}
      </div>
      ${canEdit ? `
        <div class="doc-card-actions">
          <button class="doc-edit-btn btn-link" data-id="${doc.id}" style="font-size:12px;color:var(--accent);">✏️ Edit</button>
          <button class="doc-delete-btn btn-link" data-id="${doc.id}" style="font-size:12px;color:var(--red, #c0392b);">🗑️ Delete</button>
        </div>
      ` : ''}
    </div>
  `;
}

async function handleDocumentUpload(e) {
  const name = document.getElementById('docName').value.trim();
  const category = document.getElementById('docCategory').value;
  const file = document.getElementById('docFile').files[0];
  const user = getCurrentUser();

  if (!file) {
    alert('Please select a PDF file');
    return;
  }

  if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
    alert('Please upload a PDF file');
    return;
  }

  const progressDiv = document.getElementById('docUploadProgress');
  const progressBar = document.getElementById('docUploadProgressBar');
  const progressText = document.getElementById('docUploadProgressText');
  progressDiv.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = 'Uploading...';

  const submitBtn = document.getElementById('docSubmitBtn');
  submitBtn.disabled = true;

  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = storage.ref(`documents/${fileName}`);

    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = progress + '%';
        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
      },
      (error) => {
        console.error('Upload error:', error);
        alert('Error uploading file: ' + error.message);
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
      },
      async () => {
        try {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          progressText.textContent = 'Upload complete! Saving...';

          await db.collection('documents').add({
            name,
            category,
            fileName: file.name,
            storageFileName: fileName,
            storageUrl: downloadURL,
            uploadedBy: user.uid,
            uploaderName: user.name,
            uploadedAt: firebase.firestore.Timestamp.now(),
            fileSize: file.size
          });

          // Reset form
          document.getElementById('docUploadForm').style.display = 'none';
          document.getElementById('documentForm').reset();
          progressDiv.style.display = 'none';
          submitBtn.disabled = false;

          // Reload
          documentsState.dataLoaded = false;
          await loadDocuments(true);
          renderDocumentCategories();
        } catch (error) {
          console.error('Error saving document:', error);
          alert('Error saving document. Please try again.');
          progressDiv.style.display = 'none';
          submitBtn.disabled = false;
        }
      }
    );
  } catch (error) {
    console.error('Error uploading document:', error);
    alert('Error uploading document. Please try again.');
    progressDiv.style.display = 'none';
    submitBtn.disabled = false;
  }
}

function startEditDocument(docId) {
  const doc = documentsState.documents.find(d => d.id === docId);
  if (!doc) return;

  documentsState.editingDoc = doc;
  document.getElementById('docFormTitle').textContent = 'Edit Document';
  document.getElementById('docSubmitBtn').textContent = 'Save Changes';
  document.getElementById('docName').value = doc.name;
  document.getElementById('docCategory').value = doc.category;
  // Hide file input when editing (file can't be changed, only metadata)
  document.getElementById('docFileGroup').style.display = 'none';
  document.getElementById('docFile').required = false;
  document.getElementById('docUploadForm').style.display = 'block';
  document.getElementById('docUploadForm').scrollIntoView({ behavior: 'smooth' });
}

async function handleDocumentEdit(e) {
  const doc = documentsState.editingDoc;
  if (!doc) return;

  const name = document.getElementById('docName').value.trim();
  const category = document.getElementById('docCategory').value;

  const submitBtn = document.getElementById('docSubmitBtn');
  submitBtn.disabled = true;

  try {
    await db.collection('documents').doc(doc.id).update({
      name,
      category
    });

    documentsState.editingDoc = null;
    document.getElementById('docUploadForm').style.display = 'none';
    document.getElementById('documentForm').reset();
    submitBtn.disabled = false;

    documentsState.dataLoaded = false;
    await loadDocuments(true);
    renderDocumentCategories();
  } catch (error) {
    console.error('Error updating document:', error);
    alert('Error updating document. Please try again.');
    submitBtn.disabled = false;
  }
}

function openDocViewer(url, name) {
  // Create full-screen overlay with embedded PDF viewer
  const overlay = document.createElement('div');
  overlay.id = 'docViewerOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;flex-direction:column;';
  
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card-bg,#1e1e1e);border-bottom:1px solid var(--border,#333);';
  header.innerHTML = `
    <div style="font-size:16px;font-weight:600;color:var(--text,#fff);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">📄 ${name || 'Document'}</div>
    <button id="closeDocViewer" style="background:none;border:none;color:var(--text,#fff);font-size:24px;cursor:pointer;padding:4px 8px;">✕</button>
  `;
  
  const iframe = document.createElement('iframe');
  // Use Google Docs viewer to prevent direct download
  iframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  iframe.style.cssText = 'flex:1;border:none;width:100%;background:#fff;';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  
  overlay.appendChild(header);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  
  document.getElementById('closeDocViewer').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = '';
  });
  
  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

async function deleteDocument(docId) {
  if (!confirm('Delete this document? This cannot be undone.')) return;

  try {
    const doc = documentsState.documents.find(d => d.id === docId);

    await db.collection('documents').doc(docId).delete();

    if (doc && doc.storageFileName) {
      try {
        const storageRef = storage.ref(`documents/${doc.storageFileName}`);
        await storageRef.delete();
      } catch (storageError) {
        console.warn('Error deleting file from Storage:', storageError.message);
      }
    }

    documentsState.dataLoaded = false;
    await loadDocuments(true);
    renderDocumentCategories();
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('Error deleting document. Please try again.');
  }
}
