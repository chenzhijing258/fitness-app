// settings.js — settings view

function renderSettingsView() {
  const venues = getVenues();
  const courses = getCourses();
  const settings = getSettings();

  document.getElementById('view').innerHTML = `
    <div class="page-header">设置</div>

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
