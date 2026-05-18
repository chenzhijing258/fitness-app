// settings.js — settings view

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
  document.getElementById('new-venue-name').closest('.sheet-overlay').remove();
  renderSettingsView();
}

function deleteVenueFromUI(id) {
  if (!confirm('确认删除该健身房？')) return;
  deleteVenue(id);
  renderSettingsView();
}
