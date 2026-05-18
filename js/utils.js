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
