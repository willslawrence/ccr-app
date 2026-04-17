/* ====================================
   HOME / LANDING PAGE
   3x3 grid of all app pages
   ==================================== */

function renderHomePage() {
  const pages = [
    { page: 'prayer',   icon: '🙏', label: 'Prayer',      color: 'var(--accent)' },
    { page: 'giving',   icon: '💰', label: 'Giving',      color: 'var(--green)' },
    { page: 'library',  icon: '📚', label: 'Library',     color: 'var(--blue)' },
    { page: 'bible',    icon: '📖', label: 'Bible',       color: 'var(--purple)' },
    { page: 'sermons',  icon: '🎧', label: 'Sermons',     color: 'var(--teal)' },
    { page: 'schedule', icon: '📅', label: 'Schedule',    color: 'var(--orange)' },
    { page: 'bulletin', icon: '📋', label: 'Bulletin',    color: 'var(--red, #c0392b)' },
    { page: 'documents',icon: '📄', label: 'Documents',  color: 'var(--accent)' },
    { page: 'tools',    icon: '🛠️', label: 'Tools',    color: 'var(--accent)' },
    { page: 'settings', icon: '⚙️', label: 'Settings',    color: 'var(--muted)' },
  ];

  const userName = AppState.currentUser ? AppState.currentUser.name.split(' ')[0] : '';

  return `
    <div class="page home-page">
      <div class="home-header">
        <h1 class="page-title" style="font-size:36px;margin-bottom:4px;">CCR</h1>
        <p class="page-subtitle" style="margin-bottom:20px;">Community Church App</p>
        <h2 class="home-greeting" style="font-size:22px;margin-bottom:12px;">Hey ${escapeHtml(userName)} 👋</h2>
      </div>
      <div class="home-grid">
        ${pages.map(p => `
          <button class="home-tile" data-page="${p.page}">
            <span class="home-tile-icon">${p.icon}</span>
            <span class="home-tile-label">${p.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function initHomePage() {
  document.querySelectorAll('.home-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      navigateTo(tile.dataset.page);
    });
  });
}
