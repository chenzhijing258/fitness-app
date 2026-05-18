// Current navigation state
let currentView = 'schedule';
let currentParams = {};

function navigate(view, params) {
  params = params || {};
  currentView = view;
  currentParams = params;

  // Update nav button active state (only for top-level views)
  const topLevel = ['schedule', 'students', 'settings'];
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Hide nav for sub-views
  document.getElementById('bottom-nav').style.display =
    topLevel.includes(view) ? 'flex' : 'none';

  const view_el = document.getElementById('view');
  switch (view) {
    case 'schedule':  renderScheduleView(); break;
    case 'students':  renderStudentsView(); break;
    case 'settings':  renderSettingsView(); break;
    case 'student-detail': renderStudentDetailView(params.studentId); break;
    default: view_el.innerHTML = '<p class="empty-state">页面不存在</p>';
  }
}

// Bottom nav clicks
document.getElementById('bottom-nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (btn) navigate(btn.dataset.view);
});

// Startup
document.addEventListener('DOMContentLoaded', () => {
  runAutoComplete();
  navigate('schedule');
});

function runAutoComplete() {
  // Implemented in Task 8
}
