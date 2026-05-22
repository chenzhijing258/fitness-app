// pages/student-detail/student-detail.js
const {
  getStudentById, saveStudent, deleteStudent,
  getSessionsByStudentId, deleteSession,
} = require('../../utils/data');
const { getTodayStr, formatDisplayDate, generateId, showToast } = require('../../utils/utils');

const BODY_METRICS = [
  { key: 'weight',       label: '体重',   unit: 'kg' },
  { key: 'body_fat',     label: '体脂',   unit: '%'  },
  { key: 'shoulder',     label: '肩宽',   unit: 'cm' },
  { key: 'chest',        label: '胸围',   unit: 'cm' },
  { key: 'waist',        label: '腰围',   unit: 'cm' },
  { key: 'hip',          label: '臀围',   unit: 'cm' },
  { key: 'left_arm',     label: '左臂',   unit: 'cm' },
  { key: 'right_arm',    label: '右臂',   unit: 'cm' },
  { key: 'left_thigh',   label: '左大腿', unit: 'cm' },
  { key: 'right_thigh',  label: '右大腿', unit: 'cm' },
];

// weight/body_fat: lower is better (rise=bad=red, drop=good=green)
// others: higher is better (rise=good=green, drop=bad=red)
const LOWER_IS_BETTER = new Set(['weight', 'body_fat']);
const COLOR_GOOD = '#22c55e';
const COLOR_BAD  = '#ef4444';
const COLOR_NEUTRAL = '#94a3b8';

const EMPTY_BD = Object.fromEntries(BODY_METRICS.map(m => [m.key, '']));

Page({
  data: {
    student: {},
    warn: false,
    openSections: { info: false, packages: false, history: false, body: false, feedback: false },
    // info
    editName: '', editPhone: '', editNotes: '',
    // packages
    packages: [],
    showPkgSheet: false, pkgQty: '10', pkgDate: '',
    // history
    history: [], hasMoreHistory: false, totalHistory: 0, showAllHistory: false,
    // body
    bodyEntries: [], deltaCards: [], deltaLabel: '',
    showBodySheet: false, bodySheetTitle: '记录身体数据',
    editingBodyId: null,
    bdDate: '', bdValues: { ...EMPTY_BD },
    bodyMetrics: BODY_METRICS,
    // feedback
    feedbacks: [],
    showFbSheet: false, fbDate: '', fbText: '',
  },

  onLoad(options) {
    this._studentId = options.id;
    this._refresh();
  },

  onShow() { this._refresh(); },

  _refresh() {
    const s = getStudentById(this._studentId);
    if (!s) { wx.navigateBack(); return; }

    const sessions = getSessionsByStudentId(this._studentId)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    const displayHistory = this.data.showAllHistory ? sessions : sessions.slice(0, 10);

    // Body data
    const entries = (s.body_data || []).sort((a, b) => b.date.localeCompare(a.date));
    const deltaCards = this._buildDeltaCards(entries);
    const deltaLabel = entries.length >= 1
      ? '最新测量 ' + formatDisplayDate(entries[0].date) +
        (entries.length >= 2 ? '（对比 ' + formatDisplayDate(entries[1].date) + '）' : '')
      : '';

    this.setData({
      student: s,
      warn: s.remaining_sessions <= 3,
      editName:  s.name,
      editPhone: s.phone  || '',
      editNotes: s.notes  || '',

      packages: (s.packages || [])
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(p => ({ ...p, dateLabel: formatDisplayDate(p.date) })),

      history: displayHistory.map(se => ({
        id: se.id,
        dateTime: formatDisplayDate(se.date) + ' ' + se.time,
        content:  se.content || '',
        status:   se.status,
        statusClass: se.status === '已完成' ? 'status-done' : 'status-scheduled',
      })),
      hasMoreHistory: sessions.length > 10 && !this.data.showAllHistory,
      totalHistory: sessions.length,

      bodyEntries: entries.map(e => ({
        id: e.id,
        dateLabel: formatDisplayDate(e.date),
        chips: BODY_METRICS
          .filter(m => e[m.key] != null && e[m.key] !== '')
          .map(m => m.label + ' ' + e[m.key] + m.unit),
      })),
      deltaCards,
      deltaLabel,

      feedbacks: (s.feedback || [])
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(f => ({ ...f, dateLabel: formatDisplayDate(f.date) })),
    });
  },

  _buildDeltaCards(entries) {
    if (entries.length === 0) return [];
    const latest = entries[0];
    const prev   = entries[1] || null;
    return BODY_METRICS
      .filter(m => latest[m.key] != null && latest[m.key] !== '')
      .map(m => {
        let diffText = '', diffColor = COLOR_NEUTRAL;
        if (prev && prev[m.key] != null && prev[m.key] !== '') {
          const diff = +(latest[m.key] - prev[m.key]).toFixed(1);
          if (diff !== 0) {
            const isGood = diff > 0 ? !LOWER_IS_BETTER.has(m.key) : LOWER_IS_BETTER.has(m.key);
            diffColor = isGood ? COLOR_GOOD : COLOR_BAD;
            diffText  = diff > 0 ? '↑' + diff : '↓' + Math.abs(diff);
          } else {
            diffText = '—';
          }
        }
        return { key: m.key, label: m.label, unit: m.unit, value: latest[m.key], diffText, diffColor };
      });
  },

  onBack() { wx.navigateBack(); },

  toggleSection(e) {
    const sec = e.currentTarget.dataset.sec;
    const openSections = { ...this.data.openSections, [sec]: !this.data.openSections[sec] };
    this.setData({ openSections });
  },

  // ---- 基本信息 ----
  onEditName(e)  { this.setData({ editName:  e.detail.value }); },
  onEditPhone(e) { this.setData({ editPhone: e.detail.value }); },
  onEditNotes(e) { this.setData({ editNotes: e.detail.value }); },
  onSaveInfo() {
    const name = this.data.editName.trim();
    if (!name) { showToast('姓名不能为空'); return; }
    const s = getStudentById(this._studentId);
    saveStudent({ ...s, name, phone: this.data.editPhone.trim(), notes: this.data.editNotes.trim() });
    showToast('已保存');
    this._refresh();
  },
  onDeleteStudent() {
    wx.showModal({ title: '确认删除', content: '确认删除该学员？此操作不可撤销。',
      success: res => {
        if (res.confirm) {
          getSessionsByStudentId(this._studentId).forEach(s => deleteSession(s.id));
          deleteStudent(this._studentId);
          wx.navigateBack();
        }
      }
    });
  },

  // ---- 历史课程 ----
  onShowAllHistory() {
    this.setData({ showAllHistory: true });
    this._refresh();
  },

  // ---- 课包 ----
  onAddPackage() {
    this.setData({ showPkgSheet: true, pkgQty: '10', pkgDate: getTodayStr() });
  },
  onClosePkgSheet()    { this.setData({ showPkgSheet: false }); },
  onPkgQtyInput(e)    { this.setData({ pkgQty: e.detail.value }); },
  onPkgDateChange(e)  { this.setData({ pkgDate: e.detail.value }); },
  onConfirmPkg() {
    const qty = parseInt(this.data.pkgQty) || 0;
    if (qty <= 0) { showToast('请输入有效节数'); return; }
    const s = getStudentById(this._studentId);
    const pkg = { id: generateId(), date: this.data.pkgDate, quantity: qty };
    saveStudent({ ...s, packages: [...(s.packages || []), pkg], remaining_sessions: s.remaining_sessions + qty });
    this.setData({ showPkgSheet: false });
    this._refresh();
  },
  onDelPackage(e) {
    wx.showModal({ title: '确认删除', content: '确认删除此课包记录？不会自动调整剩余课数。',
      success: res => {
        if (res.confirm) {
          const s = getStudentById(this._studentId);
          saveStudent({ ...s, packages: s.packages.filter(p => p.id !== e.currentTarget.dataset.id) });
          this._refresh();
        }
      }
    });
  },

  // ---- 身体数据 ----
  onAddBody() {
    this.setData({
      showBodySheet: true, bodySheetTitle: '记录身体数据',
      editingBodyId: null, bdDate: getTodayStr(), bdValues: { ...EMPTY_BD },
    });
  },
  onEditBody(e) {
    const entryId = e.currentTarget.dataset.id;
    const s = getStudentById(this._studentId);
    const entry = (s.body_data || []).find(x => x.id === entryId);
    if (!entry) return;
    const bdValues = {};
    BODY_METRICS.forEach(m => { bdValues[m.key] = entry[m.key] != null ? String(entry[m.key]) : ''; });
    this.setData({
      showBodySheet: true, bodySheetTitle: '编辑身体数据',
      editingBodyId: entryId, bdDate: entry.date, bdValues,
    });
  },
  onCloseBodySheet() { this.setData({ showBodySheet: false }); },
  onBdDateChange(e)  { this.setData({ bdDate: e.detail.value }); },
  onBdInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['bdValues.' + key]: e.detail.value });
  },
  onConfirmBody() {
    const entry = { id: this.data.editingBodyId || generateId(), date: this.data.bdDate };
    BODY_METRICS.forEach(m => {
      const raw = this.data.bdValues[m.key];
      const val = parseFloat(raw);
      if (raw !== '' && !isNaN(val) && val >= 0) entry[m.key] = val;
    });
    if (Object.keys(entry).length <= 2) { showToast('请至少填写一项数据'); return; }
    const s = getStudentById(this._studentId);
    let bodyData = s.body_data || [];
    if (this.data.editingBodyId) {
      bodyData = bodyData.map(x => x.id === this.data.editingBodyId ? entry : x);
    } else {
      bodyData = [...bodyData, entry];
    }
    saveStudent({ ...s, body_data: bodyData });
    this.setData({ showBodySheet: false });
    this._refresh();
  },
  onDelBody(e) {
    wx.showModal({ title: '确认删除', content: '确认删除此条数据？',
      success: res => {
        if (res.confirm) {
          const s = getStudentById(this._studentId);
          saveStudent({ ...s, body_data: s.body_data.filter(x => x.id !== e.currentTarget.dataset.id) });
          this._refresh();
        }
      }
    });
  },

  // ---- Feedback ----
  onAddFeedback() {
    this.setData({ showFbSheet: true, fbDate: getTodayStr(), fbText: '' });
  },
  onCloseFbSheet()   { this.setData({ showFbSheet: false }); },
  onFbDateChange(e)  { this.setData({ fbDate: e.detail.value }); },
  onFbInput(e)       { this.setData({ fbText: e.detail.value }); },
  onConfirmFeedback() {
    const text = this.data.fbText.trim();
    if (!text) { showToast('请输入内容'); return; }
    const s = getStudentById(this._studentId);
    const entry = { id: generateId(), date: this.data.fbDate, text };
    saveStudent({ ...s, feedback: [...(s.feedback || []), entry] });
    this.setData({ showFbSheet: false });
    this._refresh();
  },
  onDelFeedback(e) {
    wx.showModal({ title: '确认删除', content: '确认删除此条 Feedback？',
      success: res => {
        if (res.confirm) {
          const s = getStudentById(this._studentId);
          saveStudent({ ...s, feedback: s.feedback.filter(f => f.id !== e.currentTarget.dataset.id) });
          this._refresh();
        }
      }
    });
  },
});
