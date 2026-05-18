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
