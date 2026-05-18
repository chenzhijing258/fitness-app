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

  setTimeout(() => drawBodyChart(studentId), 50);
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
