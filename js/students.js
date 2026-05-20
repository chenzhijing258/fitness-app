// students.js — student list + detail views

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
  getSessions().filter(s => s.student_id === studentId).forEach(s => deleteSession(s.id));
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

const BODY_METRICS = [
  { key: 'weight',      label: '体重',   unit: 'kg' },
  { key: 'body_fat',   label: '体脂',   unit: '%'  },
  { key: 'shoulder',   label: '肩宽',   unit: 'cm' },
  { key: 'chest',      label: '胸围',   unit: 'cm' },
  { key: 'waist',      label: '腰围',   unit: 'cm' },
  { key: 'hip',        label: '臀围',   unit: 'cm' },
  { key: 'left_arm',   label: '左臂',   unit: 'cm' },
  { key: 'right_arm',  label: '右臂',   unit: 'cm' },
  { key: 'left_thigh', label: '左大腿', unit: 'cm' },
  { key: 'right_thigh',label: '右大腿', unit: 'cm' },
];

function renderBodyDataSection(student) {
  const entries = (student.body_data || []).sort((a, b) => b.date.localeCompare(a.date));

  // Latest entry delta card
  let deltaHtml = '';
  if (entries.length >= 1) {
    const latest = entries[0];
    const prev = entries[1] || null;
    const measured = BODY_METRICS.filter(m => latest[m.key] != null && latest[m.key] !== '');
    if (measured.length > 0) {
      deltaHtml = `
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
            最新测量 ${formatDisplayDate(latest.date)}${prev ? '（对比 ' + formatDisplayDate(prev.date) + '）' : ''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${measured.map(m => {
              const val = latest[m.key];
              let deltaHtml = '';
              if (prev != null && prev[m.key] != null && prev[m.key] !== '') {
                const diff = +(val - prev[m.key]).toFixed(1);
                // weight & body_fat: lower is better → rise = red, drop = green
                // all other metrics: higher is better → rise = green, drop = red
                const lowerIsBetter = m.key === 'weight' || m.key === 'body_fat';
                const goodColor = 'var(--success)';
                const badColor  = 'var(--danger)';
                deltaHtml = diff > 0
                  ? ` <span style="font-size:11px;color:${lowerIsBetter ? badColor : goodColor};">↑${diff}</span>`
                  : diff < 0
                  ? ` <span style="font-size:11px;color:${lowerIsBetter ? goodColor : badColor};">↓${Math.abs(diff)}</span>`
                  : ` <span style="font-size:11px;color:var(--text-muted);">—</span>`;
              }
              return `
                <div style="background:var(--card-2);border-radius:var(--radius-sm);padding:10px 12px;">
                  <div style="font-size:11px;color:var(--text-muted);">${m.label}</div>
                  <div style="font-size:16px;font-weight:700;margin-top:2px;">
                    ${val}<span style="font-size:11px;font-weight:400;color:var(--text-muted);"> ${m.unit}</span>${deltaHtml}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }
  }

  // Full history list
  const historyHtml = entries.length === 0
    ? '<p style="color:var(--text-muted);font-size:14px;margin:8px 0;">暂无数据</p>'
    : `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">历史记录</div>` +
      entries.map(e => {
        const measured = BODY_METRICS.filter(m => e[m.key] != null && e[m.key] !== '');
        return `
          <div style="padding:10px 0;border-bottom:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:13px;color:var(--text-muted);">${formatDisplayDate(e.date)}</span>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-ghost" style="padding:3px 10px;font-size:12px;min-height:28px;"
                  onclick="showEditBodySheet('${student.id}','${e.id}')">编辑</button>
                <button class="btn btn-danger" style="padding:3px 10px;font-size:12px;min-height:28px;"
                  onclick="deleteBodyEntry('${student.id}','${e.id}')">删除</button>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              ${measured.map(m =>
                `<span style="font-size:12px;background:var(--card-2);padding:3px 8px;border-radius:6px;">${m.label} ${e[m.key]}${m.unit}</span>`
              ).join('')}
            </div>
          </div>`;
      }).join('');

  return `${deltaHtml}${historyHtml}
    <button class="btn btn-ghost btn-full mt-16" onclick="showAddBodySheet('${student.id}')">＋ 记录身体数据</button>`;
}

function showEditBodySheet(studentId, entryId) {
  const student = getStudentById(studentId);
  const entry = (student.body_data || []).find(e => e.id === entryId);
  if (!entry) return;

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'body-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">编辑身体数据</div>
      <div class="form-group">
        <label class="form-label">日期</label>
        <input type="date" class="form-control" id="bd-date" value="${entry.date}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${BODY_METRICS.map(m => `
          <div class="form-group" style="margin-bottom:10px;">
            <label class="form-label">${m.label}（${m.unit}）</label>
            <input type="number" class="form-control" id="bd-${m.key}" placeholder="选填" step="0.1" min="0"
              ${entry[m.key] != null ? `value="${entry[m.key]}"` : ''}></div>`).join('')}
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('body-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmEditBodyEntry('${studentId}','${entryId}')">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmEditBodyEntry(studentId, entryId) {
  const date = document.getElementById('bd-date').value;
  const updated = { id: entryId, date };
  BODY_METRICS.forEach(m => {
    const raw = document.getElementById('bd-' + m.key).value;
    const val = parseFloat(raw);
    if (raw !== '' && !isNaN(val) && val >= 0) updated[m.key] = val;
  });
  if (Object.keys(updated).length <= 2) { showToast('请至少填写一项数据'); return; }
  const student = getStudentById(studentId);
  saveStudent({ ...student, body_data: student.body_data.map(e => e.id === entryId ? updated : e) });
  document.getElementById('body-sheet').remove();
  renderStudentDetailView(studentId);
}

function showAddBodySheet(studentId) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'body-sheet';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">记录身体数据</div>
      <div class="form-group">
        <label class="form-label">日期</label>
        <input type="date" class="form-control" id="bd-date" value="${getTodayStr()}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${BODY_METRICS.map(m => `
          <div class="form-group" style="margin-bottom:10px;">
            <label class="form-label">${m.label}（${m.unit}）</label>
            <input type="number" class="form-control" id="bd-${m.key}" placeholder="选填" step="0.1" min="0">
          </div>`).join('')}
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('body-sheet').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddBodyEntry('${studentId}')">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmAddBodyEntry(studentId) {
  const date = document.getElementById('bd-date').value;
  const entry = { id: generateId(), date };
  BODY_METRICS.forEach(m => {
    const raw = document.getElementById('bd-' + m.key).value;
    const val = parseFloat(raw);
    if (raw !== '' && !isNaN(val) && val >= 0) entry[m.key] = val;
  });
  if (Object.keys(entry).length <= 2) { showToast('请至少填写一项数据'); return; }
  const student = getStudentById(studentId);
  saveStudent({ ...student, body_data: [...(student.body_data || []), entry] });
  document.getElementById('body-sheet').remove();
  renderStudentDetailView(studentId);
}

function deleteBodyEntry(studentId, entryId) {
  if (!confirm('确认删除此条数据？')) return;
  const student = getStudentById(studentId);
  saveStudent({ ...student, body_data: student.body_data.filter(e => e.id !== entryId) });
  renderStudentDetailView(studentId);
}
