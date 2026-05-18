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
