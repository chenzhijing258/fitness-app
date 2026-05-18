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

function openSessionForm(sessionId) {
  const session = sessionId ? getSessionById(sessionId) : null;
  const students = getStudents();
  const venues = getVenues();
  const isEdit = !!session;

  if (students.length === 0) {
    showToast('请先在学员页面添加学员');
    return;
  }

  const defaultDate = session ? session.date : scheduleSelectedDate;
  const defaultTime = session ? session.time : '09:00';

  // Pre-fill content from student's last session if adding new
  let prefillContent = getTemplate();
  if (!isEdit && students.length > 0) {
    const firstStudentId = students[0].id;
    const lastSession = getSessions()
      .filter(s => s.student_id === firstStudentId)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
    if (lastSession) prefillContent = lastSession.content;
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
