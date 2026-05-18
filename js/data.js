const KEYS = {
  students: 'fa_students',
  sessions: 'fa_sessions',
  venues: 'fa_venues',
  courses: 'fa_courses',
  settings: 'fa_settings',
};

function _load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function _save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Settings
function getSettings() {
  return _load(KEYS.settings) || { renewal_threshold: 3 };
}
function saveSettings(s) { _save(KEYS.settings, s); }

// Courses
function getCourses() {
  const stored = _load(KEYS.courses);
  if (Array.isArray(stored)) return stored;
  // Migrate from legacy template string
  const legacy = localStorage.getItem('fa_template');
  if (legacy && legacy.trim()) {
    const migrated = legacy.split('\n').map(s => s.trim()).filter(Boolean)
      .map(name => ({ id: generateId(), name }));
    _save(KEYS.courses, migrated);
    return migrated;
  }
  return [];
}
function saveCourse(course) {
  const list = getCourses();
  const idx = list.findIndex(c => c.id === course.id);
  if (idx >= 0) list[idx] = course; else list.push(course);
  _save(KEYS.courses, list);
}
function deleteCourse(id) {
  _save(KEYS.courses, getCourses().filter(c => c.id !== id));
}

// Venues
function getVenues() { return _load(KEYS.venues) || []; }
function saveVenue(venue) {
  const list = getVenues();
  const idx = list.findIndex(v => v.id === venue.id);
  if (idx >= 0) list[idx] = venue; else list.push(venue);
  _save(KEYS.venues, list);
}
function deleteVenue(id) {
  _save(KEYS.venues, getVenues().filter(v => v.id !== id));
}

// Students
function getStudents() { return _load(KEYS.students) || []; }
function getStudentById(id) { return getStudents().find(s => s.id === id) || null; }
function saveStudent(student) {
  const list = getStudents();
  const idx = list.findIndex(s => s.id === student.id);
  if (idx >= 0) list[idx] = student; else list.push(student);
  _save(KEYS.students, list);
}
function deleteStudent(id) {
  _save(KEYS.students, getStudents().filter(s => s.id !== id));
}

// Sessions
function getSessions() { return _load(KEYS.sessions) || []; }
function getSessionById(id) { return getSessions().find(s => s.id === id) || null; }
function saveSession(session) {
  const list = getSessions();
  const idx = list.findIndex(s => s.id === session.id);
  if (idx >= 0) list[idx] = session; else list.push(session);
  _save(KEYS.sessions, list);
}
function deleteSession(id) {
  _save(KEYS.sessions, getSessions().filter(s => s.id !== id));
}
function getSessionsByDate(dateStr) {
  return getSessions().filter(s => s.date === dateStr);
}
function getSessionsByStudentId(studentId) {
  return getSessions().filter(s => s.student_id === studentId);
}