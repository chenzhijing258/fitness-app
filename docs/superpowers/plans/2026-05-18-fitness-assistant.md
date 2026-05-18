# Fitness Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first personal trainer web app for managing weekly schedules, student info, and session records using vanilla HTML/CSS/JS and localStorage.

**Architecture:** Single HTML page with a `#view` container that gets swapped between views via a lightweight router. All state lives in localStorage as JSON. Six script files loaded via `<script>` tags (no ES modules — required for `file://` compatibility). View files expose render functions that write to `#view`; `app.js` owns routing and startup logic.

**Tech Stack:** HTML5, CSS3 (custom properties + flexbox), Vanilla ES6 JS (no modules), localStorage, Canvas API (body data trend chart). No build step — open `index.html` directly in a mobile browser.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | App shell: nav bar, `#view` container, script tags |
| `style.css` | All styles — mobile-first, CSS variables |
| `js/utils.js` | `generateId`, date helpers, `getWeekDates` |
| `js/data.js` | All localStorage read/write operations |
| `js/schedule.js` | Schedule view render + event handlers |
| `js/students.js` | Student list + detail view render + handlers |
| `js/settings.js` | Settings view render + handlers |
| `js/app.js` | Router, `navigate()`, startup auto-complete |
| `tests/test.html` | In-browser unit tests for utils.js + data.js |

---

## Task 1: Project Scaffold — HTML Shell + CSS Foundation

**Files:**
- Create: `fitness-app/index.html`
- Create: `fitness-app/style.css`
- Create: `fitness-app/js/utils.js` (stub)
- Create: `fitness-app/js/data.js` (stub)
- Create: `fitness-app/js/schedule.js` (stub)
- Create: `fitness-app/js/students.js` (stub)
- Create: `fitness-app/js/settings.js` (stub)
- Create: `fitness-app/js/app.js` (stub)

- [ ] **Step 1: Create folder structure**

```
fitness-app/
├── index.html
├── style.css
├── js/
│   ├── utils.js
│   ├── data.js
│   ├── schedule.js
│   ├── students.js
│   ├── settings.js
│   └── app.js
└── tests/
    └── test.html
```

- [ ] **Step 2: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>健身助手</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <div id="view"></div>
    <nav id="bottom-nav">
      <button class="nav-btn active" data-view="schedule">
        <span class="nav-icon">📅</span>
        <span class="nav-label">课程表</span>
      </button>
      <button class="nav-btn" data-view="students">
        <span class="nav-icon">👥</span>
        <span class="nav-label">学员</span>
      </button>
      <button class="nav-btn" data-view="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">设置</span>
      </button>
    </nav>
  </div>

  <script src="js/utils.js"></script>
  <script src="js/data.js"></script>
  <script src="js/schedule.js"></script>
  <script src="js/students.js"></script>
  <script src="js/settings.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `style.css`**

```css
:root {
  --primary: #2563eb;
  --primary-light: #dbeafe;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --bg: #f1f5f9;
  --card: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --nav-height: 64px;
  --radius: 12px;
  --radius-sm: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  background: var(--bg);
  color: var(--text);
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
}

#app { display: flex; flex-direction: column; min-height: 100vh; }

#view {
  flex: 1;
  padding-bottom: var(--nav-height);
  overflow-y: auto;
}

/* Bottom nav */
#bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: var(--nav-height);
  background: var(--card);
  border-top: 1px solid var(--border);
  display: flex;
  z-index: 100;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 11px;
  padding: 8px 0;
}

.nav-btn.active { color: var(--primary); }
.nav-icon { font-size: 20px; }

/* Cards */
.card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 16px;
  margin: 0 16px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* Page header */
.page-header {
  padding: 16px 16px 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-primary { background: var(--primary); color: #fff; }
.btn-danger { background: var(--danger); color: #fff; }
.btn-ghost { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.btn-full { width: 100%; }

/* Form elements */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--text-muted); }

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--text);
  background: var(--card);
  min-height: 44px;
}

select.form-control { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }

textarea.form-control { min-height: 100px; resize: vertical; }

/* Bottom sheet overlay */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.sheet {
  background: var(--card);
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 20px 16px 32px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  max-height: 90vh;
  overflow-y: auto;
}

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
}

.sheet-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* List items */
.list-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  min-height: 56px;
}

.list-item:last-child { border-bottom: none; }
.list-item:active { background: var(--bg); }

/* Warning banner */
.warning-banner {
  background: #fef3c7;
  border-left: 4px solid var(--warning);
  padding: 12px 16px;
  margin: 12px 16px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 14px;
  color: #92400e;
}

/* Section toggle */
.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  padding: 0;
}

.section-body { margin-top: 12px; }

/* Week strip */
.week-strip {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  gap: 8px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.week-strip::-webkit-scrollbar { display: none; }

.day-cell {
  flex-shrink: 0;
  width: 48px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  gap: 2px;
  background: var(--card);
  border: 2px solid transparent;
  position: relative;
}

.day-cell.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.day-cell.today { border-color: var(--primary); }
.day-name { font-size: 12px; color: var(--text-muted); }
.day-cell.active .day-name { color: rgba(255,255,255,0.8); }
.day-number { font-size: 18px; font-weight: 700; }
.day-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--primary); }
.day-cell.active .day-dot { background: #fff; }

/* Session row */
.session-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  gap: 12px;
}

.session-time { font-size: 15px; font-weight: 600; color: var(--text-muted); min-width: 50px; }
.session-info { flex: 1; }
.session-name { font-size: 15px; font-weight: 600; }
.session-meta { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.session-status { font-size: 12px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
.status-scheduled { background: var(--primary-light); color: var(--primary); }
.status-done { background: #dcfce7; color: var(--success); }

/* Student badge */
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 500; }
.badge-warn { background: #fef3c7; color: #92400e; }
.badge-ok { background: #dcfce7; color: var(--success); }

/* Chart */
#body-chart { width: 100%; height: 180px; border-radius: var(--radius-sm); }

/* Tab strip */
.tab-strip {
  display: flex;
  border-bottom: 2px solid var(--border);
  margin: 0 16px 12px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

/* Add FAB */
.add-btn {
  position: fixed;
  bottom: calc(var(--nav-height) + 16px);
  right: 50%;
  transform: translateX(calc(50% - 16px - max(0px, (100vw - 480px) / 2)));
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 28px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37,99,235,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

/* Back button row */
.back-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--primary);
  font-size: 15px;
}

/* Misc */
.empty-state { text-align: center; color: var(--text-muted); padding: 40px 16px; font-size: 15px; }
.text-danger { color: var(--danger); }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
```

- [ ] **Step 4: Write JS stub files** (each file just needs a comment for now)

`js/utils.js`:
```javascript
// utils.js — ID generation, date helpers
```

`js/data.js`:
```javascript
// data.js — localStorage CRUD
```

`js/schedule.js`:
```javascript
// schedule.js — schedule view
```

`js/students.js`:
```javascript
// students.js — student list + detail views
```

`js/settings.js`:
```javascript
// settings.js — settings view
```

`js/app.js`:
```javascript
// app.js — router, startup
```

- [ ] **Step 5: Open `index.html` in mobile browser (or Chrome DevTools mobile mode)**

You should see: blank page with a bottom nav bar showing 📅 👥 ⚙️.

- [ ] **Step 6: Commit**

```bash
cd "E:\claude projects\fitness-app"
git init
git add .
git commit -m "feat: project scaffold — HTML shell, CSS, JS stubs"
```

---

## Task 2: Utility Functions + Tests

**Files:**
- Modify: `fitness-app/js/utils.js`
- Create: `fitness-app/tests/test.html`

- [ ] **Step 1: Write failing tests in `tests/test.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Unit Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .pass { color: green; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Unit Tests</h2>
  <div id="results"></div>
  <script src="../js/utils.js"></script>
  <script>
    let passed = 0, failed = 0;
    const out = document.getElementById('results');

    function test(name, fn) {
      try {
        fn();
        passed++;
        out.innerHTML += `<div class="pass">✅ ${name}</div>`;
      } catch(e) {
        failed++;
        out.innerHTML += `<div class="fail">❌ ${name}: ${e.message}</div>`;
      }
    }

    function assert(cond, msg) {
      if (!cond) throw new Error(msg || 'assertion failed');
    }

    function assertEqual(a, b) {
      if (JSON.stringify(a) !== JSON.stringify(b))
        throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
    }

    // generateId
    test('generateId returns a non-empty string', () => {
      const id = generateId();
      assert(typeof id === 'string' && id.length > 0);
    });

    test('generateId returns unique values', () => {
      assert(generateId() !== generateId());
    });

    // getTodayStr
    test('getTodayStr returns YYYY-MM-DD format', () => {
      const today = getTodayStr();
      assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `got: ${today}`);
    });

    // getWeekDates
    test('getWeekDates(0) returns 7 dates starting on Monday', () => {
      const dates = getWeekDates(0);
      assertEqual(dates.length, 7);
      dates.forEach(d => assert(/^\d{4}-\d{2}-\d{2}$/.test(d)));
      const day0 = new Date(dates[0] + 'T00:00:00');
      assertEqual(day0.getDay(), 1); // Monday
    });

    test('getWeekDates(1) returns next week', () => {
      const thisWeek = getWeekDates(0);
      const nextWeek = getWeekDates(1);
      assert(nextWeek[0] > thisWeek[0]);
      const diff = new Date(nextWeek[0]) - new Date(thisWeek[0]);
      assertEqual(diff, 7 * 24 * 60 * 60 * 1000);
    });

    // getDayLabel
    test('getDayLabel returns Chinese weekday', () => {
      const labels = ['周一','周二','周三','周四','周五','周六','周日'];
      const dates = getWeekDates(0);
      dates.forEach((d, i) => assertEqual(getDayLabel(d), labels[i]));
    });

    // formatDisplayDate
    test('formatDisplayDate formats correctly', () => {
      assertEqual(formatDisplayDate('2026-05-18'), '5月18日');
    });

    // isBeforeToday
    test('isBeforeToday: yesterday is before today', () => {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0,10);
      assert(isBeforeToday(yStr));
    });

    test('isBeforeToday: today is NOT before today', () => {
      assert(!isBeforeToday(getTodayStr()));
    });

    out.innerHTML += `<br><strong>${passed} passed, ${failed} failed</strong>`;
  </script>
</body>
</html>
```

- [ ] **Step 2: Open `tests/test.html` — verify all tests FAIL** (functions not defined yet)

- [ ] **Step 3: Write `js/utils.js`**

```javascript
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDates(weekOffset) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ['周一','周二','周三','周四','周五','周六','周日'];

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  return DAY_LABELS[day === 0 ? 6 : day - 1];
}

function formatDisplayDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}月${parseInt(d)}日`;
}

function isBeforeToday(dateStr) {
  return dateStr < getTodayStr();
}
```

- [ ] **Step 4: Open `tests/test.html` — verify all tests PASS**

- [ ] **Step 5: Commit**

```bash
git add js/utils.js tests/test.html
git commit -m "feat: utility functions with passing unit tests"
```

---

## Task 3: Data Layer + Tests

**Files:**
- Modify: `fitness-app/js/data.js`
- Modify: `fitness-app/tests/test.html`

- [ ] **Step 1: Add data layer tests to `tests/test.html`** — add after the utils tests, before the final summary line:

```html
<script src="../js/data.js"></script>
<script>
  // Clear storage before data tests
  localStorage.clear();

  // getSettings / saveSettings
  test('getSettings returns default renewal_threshold of 3', () => {
    const s = getSettings();
    assertEqual(s.renewal_threshold, 3);
  });

  test('saveSettings persists and getSettings retrieves', () => {
    saveSettings({ renewal_threshold: 5 });
    assertEqual(getSettings().renewal_threshold, 5);
    saveSettings({ renewal_threshold: 3 }); // reset
  });

  // getTemplate / saveTemplate
  test('getTemplate returns empty string by default', () => {
    assertEqual(getTemplate(), '');
  });

  test('saveTemplate persists', () => {
    saveTemplate('深蹲\n硬拉');
    assertEqual(getTemplate(), '深蹲\n硬拉');
    saveTemplate('');
  });

  // getVenues / saveVenue / deleteVenue
  test('getVenues returns empty array by default', () => {
    assertEqual(getVenues().length, 0);
  });

  test('saveVenue adds a venue', () => {
    saveVenue({ id: 'v1', name: '朝阳健身房' });
    const venues = getVenues();
    assertEqual(venues.length, 1);
    assertEqual(venues[0].name, '朝阳健身房');
  });

  test('saveVenue updates existing venue', () => {
    saveVenue({ id: 'v1', name: '朝阳健身房Updated' });
    assertEqual(getVenues().length, 1);
    assertEqual(getVenues()[0].name, '朝阳健身房Updated');
  });

  test('deleteVenue removes venue', () => {
    deleteVenue('v1');
    assertEqual(getVenues().length, 0);
  });

  // getStudents / saveStudent / deleteStudent
  test('getStudents returns empty array by default', () => {
    assertEqual(getStudents().length, 0);
  });

  test('saveStudent adds a student', () => {
    saveStudent({ id: 's1', name: '张三', phone: '', notes: '', remaining_sessions: 10, packages: [], body_data: [], feedback: [] });
    assertEqual(getStudents().length, 1);
    assertEqual(getStudentById('s1').name, '张三');
  });

  test('saveStudent updates existing student', () => {
    saveStudent({ id: 's1', name: '张三Updated', phone: '', notes: '', remaining_sessions: 9, packages: [], body_data: [], feedback: [] });
    assertEqual(getStudents().length, 1);
    assertEqual(getStudentById('s1').remaining_sessions, 9);
  });

  test('deleteStudent removes student', () => {
    deleteStudent('s1');
    assertEqual(getStudents().length, 0);
    assert(getStudentById('s1') === null);
  });

  // getSessions / saveSession / deleteSession
  test('getSessions returns empty array by default', () => {
    assertEqual(getSessions().length, 0);
  });

  test('saveSession adds a session', () => {
    saveSession({ id: 'sess1', student_id: 's1', venue_id: 'v1', date: '2026-05-18', time: '09:00', duration_hours: 1, content: '深蹲', status: '已安排', deducted: false });
    assertEqual(getSessions().length, 1);
  });

  test('getSessionsByDate filters correctly', () => {
    assertEqual(getSessionsByDate('2026-05-18').length, 1);
    assertEqual(getSessionsByDate('2026-05-19').length, 0);
  });

  test('getSessionsByStudentId filters correctly', () => {
    saveSession({ id: 'sess2', student_id: 's2', venue_id: 'v1', date: '2026-05-18', time: '10:00', duration_hours: 1, content: '硬拉', status: '已安排', deducted: false });
    assertEqual(getSessionsByStudentId('s1').length, 1);
    assertEqual(getSessionsByStudentId('s2').length, 1);
  });

  test('deleteSession removes session', () => {
    deleteSession('sess1');
    deleteSession('sess2');
    assertEqual(getSessions().length, 0);
  });

  localStorage.clear();
</script>
```

- [ ] **Step 2: Open `tests/test.html` — verify data tests FAIL** (data functions not defined)

- [ ] **Step 3: Write `js/data.js`**

```javascript
const KEYS = {
  students: 'fa_students',
  sessions: 'fa_sessions',
  venues: 'fa_venues',
  template: 'fa_template',
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

// Template
function getTemplate() {
  return localStorage.getItem(KEYS.template) || '';
}
function saveTemplate(t) { localStorage.setItem(KEYS.template, t); }

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
```

- [ ] **Step 4: Open `tests/test.html` — verify all tests PASS**

- [ ] **Step 5: Commit**

```bash
git add js/data.js tests/test.html
git commit -m "feat: data layer with localStorage CRUD and passing tests"
```

---

## Task 4: App Router + Navigation

**Files:**
- Modify: `fitness-app/js/app.js`

- [ ] **Step 1: Write `js/app.js`**

```javascript
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
```

- [ ] **Step 2: Add `runAutoComplete` stub to `js/app.js`** (will be filled in Task 8):

```javascript
function runAutoComplete() {
  // Implemented in Task 8
}
```

- [ ] **Step 3: Open `index.html` — verify nav buttons respond without errors** (views will be blank — view functions not yet defined)

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: app router and bottom nav wiring"
```

---

## Task 5: Settings View

**Files:**
- Modify: `fitness-app/js/settings.js`

- [ ] **Step 1: Write `js/settings.js`**

```javascript
function renderSettingsView() {
  const venues = getVenues();
  const template = getTemplate();
  const settings = getSettings();

  document.getElementById('view').innerHTML = `
    <div class="page-header">设置</div>

    <div class="card">
      <div class="form-group">
        <label class="form-label">课程模板</label>
        <textarea class="form-control" id="template-input" placeholder="每行一个动作，例如：&#10;深蹲&#10;硬拉&#10;卧推">${escapeHtml(template)}</textarea>
      </div>
      <button class="btn btn-primary" onclick="saveTemplateFromUI()">保存模板</button>
    </div>

    <div class="card">
      <div class="form-group">
        <label class="form-label">续费提醒阈值</label>
        <input type="number" class="form-control" id="threshold-input" min="1" max="20" value="${settings.renewal_threshold}">
      </div>
      <button class="btn btn-primary" onclick="saveThresholdFromUI()">保存</button>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-weight:600;font-size:16px;">健身房管理</span>
        <button class="btn btn-primary" onclick="showAddVenueSheet()">＋ 添加</button>
      </div>
      <div id="venues-list">
        ${venues.length === 0
          ? '<p class="empty-state" style="padding:12px 0">暂无健身房</p>'
          : venues.map(v => `
            <div class="list-item" style="border-radius:var(--radius-sm);">
              <span style="flex:1">${escapeHtml(v.name)}</span>
              <button class="btn btn-danger" style="padding:6px 12px;font-size:13px;" onclick="deleteVenueFromUI('${v.id}')">删除</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function saveTemplateFromUI() {
  const val = document.getElementById('template-input').value;
  saveTemplate(val);
  showToast('模板已保存');
}

function saveThresholdFromUI() {
  const val = parseInt(document.getElementById('threshold-input').value) || 3;
  saveSettings({ ...getSettings(), renewal_threshold: Math.max(1, val) });
  showToast('已保存');
}

function showAddVenueSheet() {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">添加健身房</div>
      <div class="form-group">
        <label class="form-label">健身房名称</label>
        <input type="text" class="form-control" id="new-venue-name" placeholder="例如：朝阳健身房">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="this.closest('.sheet-overlay').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddVenue()">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('new-venue-name').focus();
}

function confirmAddVenue() {
  const name = document.getElementById('new-venue-name').value.trim();
  if (!name) return;
  saveVenue({ id: generateId(), name });
  document.querySelector('.sheet-overlay').remove();
  renderSettingsView();
}

function deleteVenueFromUI(id) {
  if (!confirm('确认删除该健身房？')) return;
  deleteVenue(id);
  renderSettingsView();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:999;white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
```

- [ ] **Step 2: Open `index.html`, tap ⚙️ Settings**

Verify: template textarea, threshold input, venues section all render. Add a venue — it should appear in the list. Delete it — it should disappear.

- [ ] **Step 3: Commit**

```bash
git add js/settings.js
git commit -m "feat: settings view — template, venues, renewal threshold"
```

---

## Task 6: Schedule View — Week Strip + Session List

**Files:**
- Modify: `fitness-app/js/schedule.js`

- [ ] **Step 1: Write `js/schedule.js`**

```javascript
// schedule view state
let scheduleWeekOffset = 0;
let scheduleSelectedDate = getTodayStr();

function renderScheduleView() {
  // Ensure selected date is in the current week being shown
  const weekDates = getWeekDates(scheduleWeekOffset);
  if (!weekDates.includes(scheduleSelectedDate)) {
    scheduleSelectedDate = weekDates[0];
  }

  const today = getTodayStr();
  const sessions = getSessions();
  const settings = getSettings();
  const students = getStudents();

  // Renewal warning
  const warnStudents = students.filter(s => s.remaining_sessions <= settings.renewal_threshold);
  const warningHtml = warnStudents.length > 0 ? `
    <div class="warning-banner">
      ⚠️ 续费提醒：${warnStudents.map(s => `${escapeHtml(s.name)} 剩余 ${s.remaining_sessions} 节`).join('　')}
    </div>
  ` : '';

  // Week tab
  const tabHtml = `
    <div class="tab-strip">
      <button class="tab-btn ${scheduleWeekOffset === 0 ? 'active' : ''}" onclick="switchScheduleWeek(0)">本周</button>
      <button class="tab-btn ${scheduleWeekOffset === 1 ? 'active' : ''}" onclick="switchScheduleWeek(1)">下周</button>
    </div>
  `;

  // Week strip
  const stripHtml = `
    <div class="week-strip" id="week-strip">
      ${weekDates.map(d => {
        const hasSessions = sessions.some(s => s.date === d);
        const isToday = d === today;
        const isActive = d === scheduleSelectedDate;
        return `
          <div class="day-cell ${isActive ? 'active' : ''} ${isToday && !isActive ? 'today' : ''}"
               onclick="selectScheduleDay('${d}')">
            <span class="day-name">${getDayLabel(d)}</span>
            <span class="day-number">${parseInt(d.slice(8))}</span>
            ${hasSessions ? `<span class="day-dot"></span>` : '<span style="height:5px"></span>'}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Sessions for selected day
  const daySessions = sessions
    .filter(s => s.date === scheduleSelectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const sessionListHtml = daySessions.length === 0
    ? '<p class="empty-state">今天暂无课程</p>'
    : daySessions.map(s => {
        const student = students.find(st => st.id === s.student_id);
        const venue = getVenues().find(v => v.id === s.venue_id);
        return `
          <div class="session-row" onclick="openSessionForm('${s.id}')">
            <span class="session-time">${s.time}</span>
            <div class="session-info">
              <div class="session-name">${student ? escapeHtml(student.name) : '未知学员'}</div>
              <div class="session-meta">${venue ? escapeHtml(venue.name) : ''} · ${s.duration_hours}小时</div>
            </div>
            <span class="session-status ${s.status === '已完成' ? 'status-done' : 'status-scheduled'}">${s.status}</span>
          </div>
        `;
      }).join('');

  document.getElementById('view').innerHTML = `
    ${warningHtml}
    <div class="page-header">课程表</div>
    ${tabHtml}
    ${stripHtml}
    <div style="margin:0 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 4px;">
        <span style="font-size:15px;color:var(--text-muted);">${formatDisplayDate(scheduleSelectedDate)} ${getDayLabel(scheduleSelectedDate)}</span>
      </div>
    </div>
    <div id="session-list" style="margin:0 16px;background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      ${sessionListHtml}
    </div>
    <button class="add-btn" onclick="openSessionForm(null)" title="添加课程">＋</button>
  `;
}

function switchScheduleWeek(offset) {
  scheduleWeekOffset = offset;
  const weekDates = getWeekDates(offset);
  scheduleSelectedDate = weekDates[0];
  renderScheduleView();
}

function selectScheduleDay(dateStr) {
  scheduleSelectedDate = dateStr;
  renderScheduleView();
}
```

- [ ] **Step 2: Open `index.html` — tap 📅 Schedule**

Verify: week strip with Mon–Sun renders, today's date is highlighted, dots appear on days with sessions (add some test data via console if needed), tab switches between 本周/下周.

- [ ] **Step 3: Commit**

```bash
git add js/schedule.js
git commit -m "feat: schedule view — week strip, day session list, renewal banner"
```

---

## Task 7: Session Form — Add / Edit / Delete

**Files:**
- Modify: `fitness-app/js/schedule.js` (add `openSessionForm`, `saveSessionFromForm`, `deleteSessionFromForm`)

- [ ] **Step 1: Add session form functions to `js/schedule.js`**

```javascript
function openSessionForm(sessionId) {
  const session = sessionId ? getSessionById(sessionId) : null;
  const students = getStudents();
  const venues = getVenues();
  const isEdit = !!session;

  if (students.length === 0) {
    showToast('请先在学员页面添加学员');
    return;
  }

  const defaultContent = session ? session.content : getTemplate();
  const defaultDate = session ? session.date : scheduleSelectedDate;
  const defaultTime = session ? session.time : '09:00';

  // Pre-fill content from student's last session if adding new
  let prefillContent = defaultContent;
  if (!isEdit && students.length > 0) {
    const firstStudentId = students[0].id;
    const lastSession = getSessions()
      .filter(s => s.student_id === firstStudentId)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
    if (lastSession) prefillContent = lastSession.content;
    else prefillContent = getTemplate();
  }

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'session-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">${isEdit ? '编辑课程' : '添加课程'}</div>

      <div class="form-group">
        <label class="form-label">学员</label>
        <select class="form-control" id="sf-student" onchange="prefillFromLastSession(this.value)">
          ${students.map(s => `<option value="${s.id}" ${session && session.student_id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">场所</label>
        <select class="form-control" id="sf-venue">
          ${venues.length === 0 ? '<option value="">（请先在设置中添加健身房）</option>' : venues.map(v => `<option value="${v.id}" ${session && session.venue_id === v.id ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
        </select>
      </div>

      <div style="display:flex;gap:10px;">
        <div class="form-group" style="flex:1">
          <label class="form-label">日期</label>
          <input type="date" class="form-control" id="sf-date" value="${defaultDate}">
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">时间</label>
          <input type="time" class="form-control" id="sf-time" value="${defaultTime}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">时长</label>
        <select class="form-control" id="sf-duration">
          <option value="1" ${(!session || session.duration_hours === 1) ? 'selected' : ''}>1 小时</option>
          <option value="1.5" ${session && session.duration_hours === 1.5 ? 'selected' : ''}>1.5 小时</option>
          <option value="2" ${session && session.duration_hours === 2 ? 'selected' : ''}>2 小时</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">课程内容</label>
        <textarea class="form-control" id="sf-content" placeholder="每行一个动作">${escapeHtml(session ? session.content : prefillContent)}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">状态</label>
        <select class="form-control" id="sf-status">
          <option value="已安排" ${!session || session.status === '已安排' ? 'selected' : ''}>已安排</option>
          <option value="已完成" ${session && session.status === '已完成' ? 'selected' : ''}>已完成</option>
        </select>
      </div>

      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('session-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="saveSessionFromForm(${sessionId ? `'${sessionId}'` : null}, ${session ? session.deducted : false})">保存</button>
      </div>

      ${isEdit ? `<div style="margin-top:12px;"><button class="btn btn-danger btn-full" onclick="deleteSessionFromForm('${sessionId}')">删除课程</button></div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
}

function prefillFromLastSession(studentId) {
  const sessions = getSessions()
    .filter(s => s.student_id === studentId)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const last = sessions[0];
  const contentEl = document.getElementById('sf-content');
  if (contentEl) {
    contentEl.value = last ? last.content : getTemplate();
  }
}

function saveSessionFromForm(existingId, wasDeducted) {
  const studentId = document.getElementById('sf-student').value;
  const venueId = document.getElementById('sf-venue').value;
  const date = document.getElementById('sf-date').value;
  const time = document.getElementById('sf-time').value;
  const duration = parseFloat(document.getElementById('sf-duration').value);
  const content = document.getElementById('sf-content').value.trim();
  const status = document.getElementById('sf-status').value;

  if (!studentId || !date || !time) { showToast('请填写必填项'); return; }

  const id = existingId || generateId();
  let deducted = wasDeducted || false;

  // Deduct session count when marking complete for the first time
  if (status === '已完成' && !deducted) {
    const student = getStudentById(studentId);
    if (student && student.remaining_sessions > 0) {
      saveStudent({ ...student, remaining_sessions: student.remaining_sessions - 1 });
    }
    deducted = true;
  }

  saveSession({ id, student_id: studentId, venue_id: venueId, date, time, duration_hours: duration, content, status, deducted });

  document.getElementById('session-sheet').remove();
  renderScheduleView();
}

function deleteSessionFromForm(sessionId) {
  if (!confirm('确认删除这节课？')) return;
  deleteSession(sessionId);
  document.getElementById('session-sheet').remove();
  renderScheduleView();
}
```

- [ ] **Step 2: Open `index.html` → tap ＋ on schedule**

Verify: bottom sheet opens, all fields present. Add a session — it appears in the list. Tap to edit — form pre-fills. Delete — session removed. Mark complete — check that student remaining count decreases by 1 (add a test student with sessions via console).

- [ ] **Step 3: Commit**

```bash
git add js/schedule.js
git commit -m "feat: session form — add, edit, delete, auto-deduct on completion"
```

---

## Task 8: Auto-Complete on Startup

**Files:**
- Modify: `fitness-app/js/app.js` (fill in `runAutoComplete`)

- [ ] **Step 1: Replace the `runAutoComplete` stub in `js/app.js`**

```javascript
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
      // Already deducted (manually), just update status
      session.status = '已完成';
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem('fa_sessions', JSON.stringify(sessions));
  }
}
```

- [ ] **Step 2: Test auto-complete manually**

In the browser console:
```javascript
// Add a session dated yesterday with status 已安排
const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
const yStr = yesterday.toISOString().slice(0,10);
saveSession({ id: 'test-auto', student_id: getStudents()[0]?.id || 's1', venue_id: '', date: yStr, time: '09:00', duration_hours: 1, content: '测试', status: '已安排', deducted: false });
```
Then reload the page. The session should now show status `已完成` and student remaining count should have decreased by 1.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: auto-complete past sessions on app startup"
```

---

## Task 9: Student List View

**Files:**
- Modify: `fitness-app/js/students.js`

- [ ] **Step 1: Write student list view in `js/students.js`**

```javascript
function renderStudentsView() {
  const students = getStudents();
  const settings = getSettings();

  document.getElementById('view').innerHTML = `
    <div class="page-header">学员</div>
    <div style="padding:0 16px 12px;">
      <input type="text" class="form-control" id="student-search"
        placeholder="搜索学员..." oninput="filterStudentList(this.value)"
        value="">
    </div>
    <div id="student-list-container">
      ${renderStudentListItems(students, settings.renewal_threshold)}
    </div>
    <button class="add-btn" onclick="showAddStudentSheet()" title="添加学员">＋</button>
  `;
}

function renderStudentListItems(students, threshold) {
  if (students.length === 0) return '<p class="empty-state">暂无学员，点击 ＋ 添加</p>';
  return `<div style="margin:0 16px;background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">` +
    students.map(s => {
      const warn = s.remaining_sessions <= threshold;
      return `
        <div class="list-item" onclick="navigate('student-detail', {studentId: '${s.id}'})">
          <div style="flex:1">
            <span style="font-size:16px;font-weight:600;">${escapeHtml(s.name)}</span>
          </div>
          <span class="badge ${warn ? 'badge-warn' : 'badge-ok'}">剩余 ${s.remaining_sessions} 节${warn ? ' ⚠️' : ''}</span>
          <span style="color:var(--text-muted);margin-left:8px;font-size:20px;">›</span>
        </div>
      `;
    }).join('') + `</div>`;
}

function filterStudentList(query) {
  const settings = getSettings();
  const filtered = getStudents().filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.phone.includes(query)
  );
  document.getElementById('student-list-container').innerHTML =
    renderStudentListItems(filtered, settings.renewal_threshold);
}

function showAddStudentSheet() {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'add-student-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">添加学员</div>
      <div class="form-group">
        <label class="form-label">姓名 *</label>
        <input type="text" class="form-control" id="ns-name" placeholder="学员姓名">
      </div>
      <div class="form-group">
        <label class="form-label">电话</label>
        <input type="tel" class="form-control" id="ns-phone" placeholder="手机号码">
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-control" id="ns-notes" placeholder="备注信息">
      </div>
      <div class="form-group">
        <label class="form-label">初始课数</label>
        <input type="number" class="form-control" id="ns-sessions" value="10" min="0">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('add-student-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddStudent()">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('ns-name').focus();
}

function confirmAddStudent() {
  const name = document.getElementById('ns-name').value.trim();
  if (!name) { showToast('请输入学员姓名'); return; }
  const phone = document.getElementById('ns-phone').value.trim();
  const notes = document.getElementById('ns-notes').value.trim();
  const sessions = parseInt(document.getElementById('ns-sessions').value) || 0;
  const id = generateId();
  saveStudent({ id, name, phone, notes, remaining_sessions: sessions, packages: [], body_data: [], feedback: [] });
  document.getElementById('add-student-sheet').remove();
  renderStudentsView();
}
```

- [ ] **Step 2: Open `index.html` → tap 👥 Students**

Verify: list renders, search filters, ＋ opens add sheet, adding a student shows it in list with correct remaining count and warning badge if ≤ threshold.

- [ ] **Step 3: Commit**

```bash
git add js/students.js
git commit -m "feat: student list view with search and add student sheet"
```

---

## Task 10: Student Detail — Info + Package Records

**Files:**
- Modify: `fitness-app/js/students.js`

- [ ] **Step 1: Add `renderStudentDetailView` and info/package sections to `js/students.js`**

```javascript
function renderStudentDetailView(studentId) {
  const student = getStudentById(studentId);
  if (!student) { navigate('students'); return; }
  const settings = getSettings();
  const warn = student.remaining_sessions <= settings.renewal_threshold;

  document.getElementById('view').innerHTML = `
    <div class="back-row" onclick="navigate('students')">← 学员列表</div>
    <div style="padding:0 16px 8px;display:flex;align-items:center;justify-content:space-between;">
      <h1 style="font-size:22px;font-weight:700;">${escapeHtml(student.name)}</h1>
      <span class="badge ${warn ? 'badge-warn' : 'badge-ok'}">剩余 ${student.remaining_sessions} 节</span>
    </div>

    <!-- Basic Info -->
    <div class="card">
      <button class="section-toggle" onclick="toggleSection('section-info')">
        <span>基本信息</span><span id="section-info-icon">▼</span>
      </button>
      <div class="section-body" id="section-info">
        <div class="form-group mt-8">
          <label class="form-label">姓名</label>
          <input type="text" class="form-control" id="edit-name" value="${escapeHtml(student.name)}">
        </div>
        <div class="form-group">
          <label class="form-label">电话</label>
          <input type="tel" class="form-control" id="edit-phone" value="${escapeHtml(student.phone)}">
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <input type="text" class="form-control" id="edit-notes" value="${escapeHtml(student.notes)}">
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary btn-full" onclick="saveStudentInfo('${studentId}')">保存</button>
          <button class="btn btn-danger" onclick="confirmDeleteStudent('${studentId}')" style="padding:10px 16px;">删除学员</button>
        </div>
      </div>
    </div>

    <!-- Packages -->
    <div class="card">
      <button class="section-toggle" onclick="toggleSection('section-packages')">
        <span>课包记录</span><span id="section-packages-icon">▼</span>
      </button>
      <div class="section-body" id="section-packages">
        ${renderPackagesSection(student)}
      </div>
    </div>

    <!-- History -->
    <div class="card">
      <button class="section-toggle" onclick="toggleSection('section-history')">
        <span>历史课程</span><span id="section-history-icon">▼</span>
      </button>
      <div class="section-body" id="section-history">
        ${renderHistorySection(studentId, false)}
      </div>
    </div>

    <!-- Body Data -->
    <div class="card">
      <button class="section-toggle" onclick="toggleSection('section-body')">
        <span>身体数据</span><span id="section-body-icon">▼</span>
      </button>
      <div class="section-body" id="section-body">
        ${renderBodyDataSection(student)}
      </div>
    </div>

    <!-- Feedback -->
    <div class="card">
      <button class="section-toggle" onclick="toggleSection('section-feedback')">
        <span>Feedback</span><span id="section-feedback-icon">▼</span>
      </button>
      <div class="section-body" id="section-feedback">
        ${renderFeedbackSection(student)}
      </div>
    </div>
  `;
}

function toggleSection(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  icon.textContent = hidden ? '▼' : '▶';
}

function saveStudentInfo(studentId) {
  const student = getStudentById(studentId);
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { showToast('姓名不能为空'); return; }
  saveStudent({ ...student, name, phone: document.getElementById('edit-phone').value.trim(), notes: document.getElementById('edit-notes').value.trim() });
  showToast('已保存');
  renderStudentDetailView(studentId);
}

function confirmDeleteStudent(studentId) {
  if (!confirm('确认删除该学员？此操作不可撤销。')) return;
  deleteStudent(studentId);
  navigate('students');
}

function renderPackagesSection(student) {
  const pkgs = student.packages || [];
  return `
    ${pkgs.length === 0 ? '<p style="color:var(--text-muted);font-size:14px;">暂无课包记录</p>' :
      pkgs.sort((a, b) => b.date.localeCompare(a.date)).map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-weight:600;">${p.quantity} 节课</div>
            <div style="font-size:13px;color:var(--text-muted);">${formatDisplayDate(p.date)}</div>
          </div>
          <button class="btn btn-danger" style="padding:6px 12px;font-size:13px;" onclick="deletePackage('${student.id}','${p.id}')">删除</button>
        </div>
      `).join('')}
    <button class="btn btn-ghost btn-full mt-16" onclick="showAddPackageSheet('${student.id}')">＋ 添加课包</button>
  `;
}

function showAddPackageSheet(studentId) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'pkg-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">添加课包</div>
      <div class="form-group">
        <label class="form-label">购买节数</label>
        <input type="number" class="form-control" id="pkg-qty" value="10" min="1">
      </div>
      <div class="form-group">
        <label class="form-label">购买日期</label>
        <input type="date" class="form-control" id="pkg-date" value="${getTodayStr()}">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('pkg-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddPackage('${studentId}')">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmAddPackage(studentId) {
  const qty = parseInt(document.getElementById('pkg-qty').value) || 0;
  const date = document.getElementById('pkg-date').value;
  if (qty <= 0) { showToast('请输入有效节数'); return; }
  const student = getStudentById(studentId);
  const pkg = { id: generateId(), date, quantity: qty };
  saveStudent({ ...student, packages: [...(student.packages || []), pkg], remaining_sessions: student.remaining_sessions + qty });
  document.getElementById('pkg-sheet').remove();
  renderStudentDetailView(studentId);
}

function deletePackage(studentId, pkgId) {
  if (!confirm('确认删除此课包记录？不会自动调整剩余课数。')) return;
  const student = getStudentById(studentId);
  saveStudent({ ...student, packages: student.packages.filter(p => p.id !== pkgId) });
  renderStudentDetailView(studentId);
}
```

- [ ] **Step 2: Open student detail — verify info section is editable and saves, packages can be added (remaining count increases) and deleted**

- [ ] **Step 3: Commit**

```bash
git add js/students.js
git commit -m "feat: student detail — basic info editing and package records"
```

---

## Task 11: Student Detail — History + Feedback

**Files:**
- Modify: `fitness-app/js/students.js`

- [ ] **Step 1: Add history and feedback render functions to `js/students.js`**

```javascript
function renderHistorySection(studentId, showAll) {
  const allSessions = getSessionsByStudentId(studentId)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const display = showAll ? allSessions : allSessions.slice(0, 10);
  if (allSessions.length === 0) return '<p style="color:var(--text-muted);font-size:14px;">暂无上课记录</p>';
  return display.map(s => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600;font-size:14px;">${formatDisplayDate(s.date)} ${s.time}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:2px;white-space:pre-wrap;">${escapeHtml(s.content)}</div>
      </div>
      <span class="session-status ${s.status === '已完成' ? 'status-done' : 'status-scheduled'}">${s.status}</span>
    </div>
  `).join('') + (allSessions.length > 10 && !showAll ? `
    <button class="btn btn-ghost btn-full mt-8" onclick="expandHistory('${studentId}')">查看全部 ${allSessions.length} 次</button>
  ` : '');
}

function expandHistory(studentId) {
  document.getElementById('section-history').innerHTML = renderHistorySection(studentId, true);
}

function renderFeedbackSection(student) {
  const items = (student.feedback || []).sort((a, b) => b.date.localeCompare(a.date));
  return `
    ${items.length === 0 ? '<p style="color:var(--text-muted);font-size:14px;">暂无 Feedback</p>' :
      items.map(f => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">${formatDisplayDate(f.date)}</div>
          <div style="font-size:15px;white-space:pre-wrap;">${escapeHtml(f.text)}</div>
          <button class="btn" style="padding:4px 10px;font-size:12px;color:var(--danger);margin-top:6px;" onclick="deleteFeedback('${student.id}','${f.id}')">删除</button>
        </div>
      `).join('')}
    <button class="btn btn-ghost btn-full mt-16" onclick="showAddFeedbackSheet('${student.id}')">＋ 添加 Feedback</button>
  `;
}

function showAddFeedbackSheet(studentId) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'fb-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">添加 Feedback</div>
      <div class="form-group">
        <label class="form-label">日期</label>
        <input type="date" class="form-control" id="fb-date" value="${getTodayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-control" id="fb-text" placeholder="记录学员状态、进步或需要注意的事项..."></textarea>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('fb-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddFeedback('${studentId}')">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('fb-text').focus();
}

function confirmAddFeedback(studentId) {
  const text = document.getElementById('fb-text').value.trim();
  const date = document.getElementById('fb-date').value;
  if (!text) { showToast('请输入内容'); return; }
  const student = getStudentById(studentId);
  const entry = { id: generateId(), date, text };
  saveStudent({ ...student, feedback: [...(student.feedback || []), entry] });
  document.getElementById('fb-sheet').remove();
  renderStudentDetailView(studentId);
}

function deleteFeedback(studentId, feedbackId) {
  if (!confirm('确认删除此条 Feedback？')) return;
  const student = getStudentById(studentId);
  saveStudent({ ...student, feedback: student.feedback.filter(f => f.id !== feedbackId) });
  renderStudentDetailView(studentId);
}
```

- [ ] **Step 2: Open student detail — verify history shows latest 10 sessions, "查看全部" expands, feedback can be added/deleted**

- [ ] **Step 3: Commit**

```bash
git add js/students.js
git commit -m "feat: student detail — session history (top 10, expandable) and feedback"
```

---

## Task 12: Student Detail — Body Data + Trend Chart

**Files:**
- Modify: `fitness-app/js/students.js`

- [ ] **Step 1: Add body data render + chart function to `js/students.js`**

```javascript
function renderBodyDataSection(student) {
  const entries = (student.body_data || []).sort((a, b) => b.date.localeCompare(a.date));
  return `
    <canvas id="body-chart"></canvas>
    ${entries.length === 0 ? '<p style="color:var(--text-muted);font-size:14px;margin:8px 0;">暂无数据</p>' :
      entries.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
          <div>
            <div style="font-weight:600;">${e.weight} kg</div>
            <div style="font-size:13px;color:var(--text-muted);">${formatDisplayDate(e.date)}${e.notes ? ' · ' + escapeHtml(e.notes) : ''}</div>
          </div>
          <button class="btn btn-danger" style="padding:6px 12px;font-size:13px;" onclick="deleteBodyEntry('${student.id}','${e.id}')">删除</button>
        </div>
      `).join('')}
    <button class="btn btn-ghost btn-full mt-16" onclick="showAddBodySheet('${student.id}')">＋ 记录体重</button>
  `;
}

function drawBodyChart(studentId) {
  const canvas = document.getElementById('body-chart');
  if (!canvas) return;
  const student = getStudentById(studentId);
  const entries = (student.body_data || []).sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 2) { canvas.style.display = 'none'; return; }

  canvas.style.display = 'block';
  canvas.width = canvas.offsetWidth || 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 16, bottom: 30, left: 40 };

  const weights = entries.map(e => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const toX = i => pad.left + (i / (entries.length - 1)) * (W - pad.left - pad.right);
  const toY = w => pad.top + (1 - (w - minW) / (maxW - minW)) * (H - pad.top - pad.bottom);

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    const label = (maxW - i * (maxW - minW) / 4).toFixed(1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, pad.left - 4, y + 4);
  }

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  entries.forEach((e, i) => {
    const x = toX(i), y = toY(e.weight);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots + date labels
  entries.forEach((e, i) => {
    const x = toX(i), y = toY(e.weight);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    if (i === 0 || i === entries.length - 1) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = i === 0 ? 'left' : 'right';
      ctx.fillText(formatDisplayDate(e.date), x, H - 4);
    }
  });
}

function showAddBodySheet(studentId) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'body-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">记录体重</div>
      <div class="form-group">
        <label class="form-label">日期</label>
        <input type="date" class="form-control" id="bd-date" value="${getTodayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">体重 (kg)</label>
        <input type="number" class="form-control" id="bd-weight" placeholder="70.5" step="0.1" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-control" id="bd-notes" placeholder="可选">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('body-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddBodyEntry('${studentId}')">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('bd-weight').focus();
}

function confirmAddBodyEntry(studentId) {
  const weight = parseFloat(document.getElementById('bd-weight').value);
  const date = document.getElementById('bd-date').value;
  const notes = document.getElementById('bd-notes').value.trim();
  if (!weight || weight <= 0) { showToast('请输入有效体重'); return; }
  const student = getStudentById(studentId);
  const entry = { id: generateId(), date, weight, notes };
  saveStudent({ ...student, body_data: [...(student.body_data || []), entry] });
  document.getElementById('body-sheet').remove();
  renderStudentDetailView(studentId);
  setTimeout(() => drawBodyChart(studentId), 50);
}

function deleteBodyEntry(studentId, entryId) {
  if (!confirm('确认删除此条数据？')) return;
  const student = getStudentById(studentId);
  saveStudent({ ...student, body_data: student.body_data.filter(e => e.id !== entryId) });
  renderStudentDetailView(studentId);
  setTimeout(() => drawBodyChart(studentId), 50);
}
```

- [ ] **Step 2: Call `drawBodyChart` after student detail renders — add to `renderStudentDetailView` at the end:**

In `renderStudentDetailView`, after the `innerHTML` assignment, add:
```javascript
  setTimeout(() => drawBodyChart(studentId), 50);
```

- [ ] **Step 3: Open student detail — add 3+ body weight entries, verify trend chart draws with line and dots. With < 2 entries, verify chart is hidden.**

- [ ] **Step 4: Commit**

```bash
git add js/students.js
git commit -m "feat: student detail — body data tracking with canvas trend chart"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Mobile-first, open in browser | Task 1 (HTML/CSS) |
| localStorage data store | Task 3 |
| Week strip + day session list | Task 6 |
| 本周 / 下周 tabs | Task 6 |
| Add/edit session with student, venue, content, duration | Task 7 |
| Session content pre-fills from last session / template | Task 7 (`prefillFromLastSession`) |
| Delete session | Task 7 |
| Status: 已安排 / 已完成 | Task 7 |
| Deduct course count on completion (no double-deduct) | Task 7 + Task 8 |
| Auto-complete past sessions on startup | Task 8 |
| Renewal reminder banner | Task 6 |
| Student list with ⚠️ badge | Task 9 |
| Search students | Task 9 |
| Add student | Task 9 |
| Student detail: basic info edit | Task 10 |
| Student detail: package records | Task 10 |
| Student detail: history (latest 10, expandable) | Task 11 |
| Student detail: feedback | Task 11 |
| Student detail: body data + trend chart | Task 12 |
| Settings: template | Task 5 |
| Settings: venues | Task 5 |
| Settings: renewal threshold (default 3) | Task 5 |
| Delete student | Task 10 |

All requirements covered. ✅

### Type Consistency Check

- `escapeHtml` — defined in `settings.js`, used in `schedule.js` and `students.js`. Since all scripts are loaded globally, this is fine — but `escapeHtml` must be defined **before** the views that use it. Load order in `index.html`: `utils.js → data.js → schedule.js → students.js → settings.js → app.js`. `escapeHtml` is in `settings.js` but needed by `schedule.js` and `students.js` which load earlier.

  **Fix:** Move `escapeHtml` and `showToast` to `utils.js` instead of `settings.js`. Update Task 2 step 3 to include these two functions in `utils.js`, and remove them from `settings.js` in Task 5.

- `getSessionsByStudentId` — defined in `data.js` Task 3, used in `students.js` Task 11. ✅
- `generateId` — defined in `utils.js`, used throughout. ✅
- `isBeforeToday` — defined in `utils.js`, used in `app.js`. ✅
- `navigate` — defined in `app.js`, called from `students.js`. Since `app.js` loads last, `navigate` is available at call time (onclick handler fires after load). ✅
- `drawBodyChart` — called with `setTimeout` after render, canvas element exists by then. ✅

**Fix applied:** Add `escapeHtml` and `showToast` to Task 2's `utils.js` content, and note their removal from `settings.js` in Task 5.

> **Note for implementer:** Add `escapeHtml` and `showToast` to `js/utils.js` (Task 2), not to `settings.js`. Remove them from the `settings.js` code in Task 5 — they'll already be globally available from `utils.js`.
