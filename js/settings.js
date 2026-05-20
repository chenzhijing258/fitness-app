// settings.js — settings view

function renderSettingsView() {
  const venues = getVenues();
  const courses = getCourses();
  const settings = getSettings();
  const hasToken = !!getGistToken();
  const gistId   = getGistId();
  const gistUrl  = gistId ? 'https://gist.github.com/' + gistId : '';

  document.getElementById('view').innerHTML = `
    <div class="page-header">设置</div>

    <div class="card">
      <div style="font-weight:600;font-size:16px;margin-bottom:12px;">云端同步</div>
      ${hasToken ? `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="font-size:22px;">☁️</span>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--success);">同步已开启</div>
            ${gistUrl
              ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;word-break:break-all;">${gistUrl}</div>`
              : `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">首次保存后自动创建备份</div>`}
          </div>
        </div>
        <button class="btn btn-ghost btn-full" onclick="disconnectGist()">断开连接</button>
      ` : `
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
          输入 GitHub Personal Access Token（需勾选 gist 权限）即可自动备份数据到私密 Gist。
        </p>
        <div class="form-group">
          <label class="form-label">GitHub Token</label>
          <input type="password" class="form-control" id="gist-token-input"
                 placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
        </div>
        <button class="btn btn-primary btn-full" onclick="saveGistSettings()">保存并测试</button>
        <p id="gist-test-result" style="font-size:13px;margin-top:10px;min-height:18px;"></p>
      `}
    </div>

    <div class="card">
      <div style="font-weight:600;font-size:16px;margin-bottom:12px;">学员数据</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">导出学员姓名与剩余课数，可在新设备上导入恢复。</p>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary btn-full" onclick="exportStudentData()">导出数据</button>
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('import-file-input').click()">导入数据</button>
      </div>
      <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="importStudentData(this)">
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-weight:600;font-size:16px;">课程管理</span>
        <button class="btn btn-primary" style="padding:6px 14px;font-size:13px;min-height:36px;" onclick="showAddCourseSheet()">＋ 添加</button>
      </div>
      <div id="courses-list">
        ${courses.length === 0
          ? '<p class="empty-state" style="padding:12px 0">暂无课程，请先添加</p>'
          : courses.map(c => `
            <div class="list-item" style="border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:6px;">
              <span style="flex:1;font-size:15px;">${escapeHtml(c.name)}</span>
              <button class="btn btn-danger" style="padding:5px 12px;font-size:13px;min-height:34px;" onclick="deleteCourseFromUI('${c.id}')">删除</button>
            </div>
          `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="form-group">
        <label class="form-label">续费提醒阈值（节）</label>
        <input type="number" class="form-control" id="threshold-input" min="1" max="20" value="${settings.renewal_threshold}">
      </div>
      <button class="btn btn-primary" onclick="saveThresholdFromUI()">保存</button>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-weight:600;font-size:16px;">健身房管理</span>
        <button class="btn btn-primary" style="padding:6px 14px;font-size:13px;min-height:36px;" onclick="showAddVenueSheet()">＋ 添加</button>
      </div>
      <div id="venues-list">
        ${venues.length === 0
          ? '<p class="empty-state" style="padding:12px 0">暂无健身房</p>'
          : venues.map(v => `
            <div class="list-item" style="border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:6px;">
              <span style="flex:1;font-size:15px;">${escapeHtml(v.name)}</span>
              <button class="btn btn-danger" style="padding:5px 12px;font-size:13px;min-height:34px;" onclick="deleteVenueFromUI('${v.id}')">删除</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function saveThresholdFromUI() {
  const val = parseInt(document.getElementById('threshold-input').value) || 3;
  saveSettings({ ...getSettings(), renewal_threshold: Math.max(1, val) });
  showToast('已保存');
}

function showAddCourseSheet() {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-title">添加课程</div>
      <div class="form-group">
        <label class="form-label">课程名称</label>
        <input type="text" class="form-control" id="new-course-name" placeholder="例如：腿部训练">
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-full" onclick="this.closest('.sheet-overlay').remove()">取消</button>
        <button class="btn btn-primary btn-full" onclick="confirmAddCourse()">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('new-course-name').focus();
}

function confirmAddCourse() {
  const name = document.getElementById('new-course-name').value.trim();
  if (!name) return;
  saveCourse({ id: generateId(), name });
  document.getElementById('new-course-name').closest('.sheet-overlay').remove();
  renderSettingsView();
}

function deleteCourseFromUI(id) {
  deleteCourse(id);
  showToast('已删除');
  renderSettingsView();
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
  document.getElementById('new-venue-name').closest('.sheet-overlay').remove();
  renderSettingsView();
}

function deleteVenueFromUI(id) {
  deleteVenue(id);
  showToast('已删除');
  renderSettingsView();
}

async function saveGistSettings() {
  const input = document.getElementById('gist-token-input');
  const resultEl = document.getElementById('gist-test-result');
  if (!input || !resultEl) return;

  const token = input.value.trim();
  if (!token) { resultEl.style.color = 'var(--danger)'; resultEl.textContent = '请输入 Token'; return; }

  resultEl.style.color = 'var(--text-muted)';
  resultEl.textContent = '测试中…';

  const { ok, msg } = await testGistConnection(token);
  if (ok) {
    saveGistToken(token);
    // Trigger first sync immediately so Gist is created and URL appears on next render
    await _doSyncToCloud();
    showToast('同步已开启');
    renderSettingsView();
  } else {
    resultEl.style.color = 'var(--danger)';
    resultEl.textContent = msg;
  }
}

function disconnectGist() {
  saveGistToken('');   // clears token + gist ID
  showToast('已断开同步');
  renderSettingsView();
}

function exportStudentData() {
  const data = getStudents().map(s => ({ name: s.name, remaining_sessions: s.remaining_sessions }));
  if (data.length === 0) { showToast('暂无学员数据'); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '学员数据.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`已导出 ${data.length} 名学员`);
}

function importStudentData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('格式错误');
      let added = 0, updated = 0;
      imported.forEach(entry => {
        if (!entry.name || typeof entry.remaining_sessions !== 'number') return;
        const existing = getStudents().find(s => s.name === entry.name);
        if (existing) {
          saveStudent({ ...existing, remaining_sessions: entry.remaining_sessions });
          updated++;
        } else {
          saveStudent({ id: generateId(), name: entry.name, phone: '', notes: '',
            remaining_sessions: entry.remaining_sessions, packages: [], body_data: [], feedback: [] });
          added++;
        }
      });
      input.value = '';
      showToast(`导入完成：新增 ${added} 人，更新 ${updated} 人`);
    } catch {
      showToast('文件格式有误，请选择正确的导出文件');
    }
  };
  reader.readAsText(file);
}
