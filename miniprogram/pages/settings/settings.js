// pages/settings/settings.js
const {
  getCourses, saveCourse, deleteCourse,
  getVenues, saveVenue, deleteVenue,
  getStudents, saveStudent,
  getSettings, saveSettings,
} = require('../../utils/data');
const { generateId, showToast } = require('../../utils/utils');

Page({
  data: {
    courses: [],
    venues: [],
    threshold: 3,
    showCourseSheet: false,
    showVenueSheet: false,
    newCourseName: '',
    newVenueName: '',
  },

  onLoad()  { this._refresh(); },
  onShow()  { this._refresh(); },

  _refresh() {
    this.setData({
      courses:   getCourses(),
      venues:    getVenues(),
      threshold: getSettings().renewal_threshold,
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出', content: '确认退出？需要重新输入密码才能进入。',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('fa_unlocked');
          wx.reLaunch({ url: '/pages/lock/lock' });
        }
      }
    });
  },

  // ---- 课程 ----
  onAddCourse() { this.setData({ showCourseSheet: true, newCourseName: '' }); },
  onCourseNameInput(e) { this.setData({ newCourseName: e.detail.value }); },
  onConfirmCourse() {
    const name = this.data.newCourseName.trim();
    if (!name) return;
    saveCourse({ id: generateId(), name });
    this.setData({ showCourseSheet: false });
    this._refresh();
  },
  onDelCourse(e) {
    deleteCourse(e.currentTarget.dataset.id);
    showToast('已删除');
    this._refresh();
  },

  // ---- 健身房 ----
  onAddVenue() { this.setData({ showVenueSheet: true, newVenueName: '' }); },
  onVenueNameInput(e) { this.setData({ newVenueName: e.detail.value }); },
  onConfirmVenue() {
    const name = this.data.newVenueName.trim();
    if (!name) return;
    saveVenue({ id: generateId(), name });
    this.setData({ showVenueSheet: false });
    this._refresh();
  },
  onDelVenue(e) {
    deleteVenue(e.currentTarget.dataset.id);
    showToast('已删除');
    this._refresh();
  },

  onCloseSheet() {
    this.setData({ showCourseSheet: false, showVenueSheet: false });
  },

  // ---- 阈值 ----
  onThresholdInput(e) { this.setData({ threshold: e.detail.value }); },
  onSaveThreshold() {
    const val = Math.max(1, parseInt(this.data.threshold) || 3);
    saveSettings({ ...getSettings(), renewal_threshold: val });
    showToast('已保存');
  },

  // ---- 导出 ----
  onExport() {
    const data = getStudents().map(s => ({ name: s.name, remaining_sessions: s.remaining_sessions }));
    if (data.length === 0) { showToast('暂无学员数据'); return; }
    const json = JSON.stringify(data, null, 2);
    const fs = wx.getFileSystemManager();
    const path = wx.env.USER_DATA_PATH + '/学员数据.json';
    try {
      fs.writeFileSync(path, json, 'utf8');
      wx.openDocument({ filePath: path, fileType: 'other',
        fail: () => {
          wx.setClipboardData({ data: json, success: () => showToast('已复制到剪贴板') });
        }
      });
    } catch (e) {
      wx.setClipboardData({ data: json, success: () => showToast('已复制到剪贴板') });
    }
  },

  // ---- 导入 ----
  onImport() {
    wx.chooseMessageFile({
      count: 1, type: 'file',
      success: res => {
        const filePath = res.tempFiles[0].path;
        const fs = wx.getFileSystemManager();
        fs.readFile({ filePath, encoding: 'utf8',
          success: r => {
            try {
              const imported = JSON.parse(r.data);
              if (!Array.isArray(imported)) throw new Error();
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
              showToast('导入完成：新增 ' + added + ' 人，更新 ' + updated + ' 人');
              this._refresh();
            } catch {
              showToast('文件格式有误');
            }
          },
          fail: () => showToast('读取文件失败'),
        });
      },
      fail: () => {} // 用户取消
    });
  },
});
