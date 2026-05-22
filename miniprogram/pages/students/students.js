// pages/students/students.js
const { getStudents, saveStudent, getSettings } = require('../../utils/data');
const { generateId, showToast } = require('../../utils/utils');

Page({
  data: {
    all: [],
    filtered: [],
    query: '',
    showSheet: false,
    ns_name: '', ns_phone: '', ns_notes: '', ns_sessions: '10',
  },

  onLoad()  { this._refresh(); },
  onShow()  { this._refresh(); },

  _refresh() {
    const threshold = getSettings().renewal_threshold;
    const all = getStudents().map(s => ({ ...s, warn: s.remaining_sessions <= threshold }));
    const q = this.data.query.toLowerCase();
    const filtered = q ? all.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q)) : all;
    this.setData({ all, filtered });
  },

  onSearch(e) {
    const q = e.detail.value.toLowerCase();
    const filtered = this.data.all.filter(s =>
      s.name.toLowerCase().includes(q) || s.phone.includes(q)
    );
    this.setData({ query: e.detail.value, filtered });
  },

  onStudentTap(e) {
    wx.navigateTo({ url: '/pages/student-detail/student-detail?id=' + e.currentTarget.dataset.id });
  },

  onAddTap()   { this.setData({ showSheet: true, ns_name:'', ns_phone:'', ns_notes:'', ns_sessions:'10' }); },
  onCloseSheet() { this.setData({ showSheet: false }); },

  onNameInput(e)     { this.setData({ ns_name: e.detail.value }); },
  onPhoneInput(e)    { this.setData({ ns_phone: e.detail.value }); },
  onNotesInput(e)    { this.setData({ ns_notes: e.detail.value }); },
  onSessionsInput(e) { this.setData({ ns_sessions: e.detail.value }); },

  onConfirmAdd() {
    const name = this.data.ns_name.trim();
    if (!name) { showToast('请输入学员姓名'); return; }
    saveStudent({
      id: generateId(),
      name,
      phone: this.data.ns_phone.trim(),
      notes: this.data.ns_notes.trim(),
      remaining_sessions: parseInt(this.data.ns_sessions) || 0,
      packages: [], body_data: [], feedback: []
    });
    this.setData({ showSheet: false });
    this._refresh();
  },
});
