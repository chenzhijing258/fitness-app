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
document.addEventListener('DOMContentLoaded', async function() {
  // Pull latest data from cloud before rendering.
  // syncFromCloud() is a no-op if no token/gist configured — app works offline too.
  await syncFromCloud();
  runAutoComplete();
  navigate('schedule');
});

function runAutoComplete() {
  const sessions = getSessions();
  let changed = false;
  sessions.forEach(session => {
    if (session.status === '已安排' && isBeforeToday(session.date) && !session.deducted) {
      session.status = '已完成';
      session.deducted = true;
      const student = getStudentById(session.student_id);
      if (student && student.remaining_sessions > 0) {
        saveStudent({ ...student, remaining_sessions: student.remaining_sessions - 1 });
      }
      changed = true;
    } else if (session.status === '已安排' && isBeforeToday(session.date) && session.deducted) {
      // Already deducted manually, just update status
      session.status = '已完成';
      changed = true;
    }
  });
  if (changed) {
    _save(KEYS.sessions, sessions);
  }
}
