// pages/schedule/schedule.js
const {
  getStudents, getStudentById, saveStudent,
  getSessions, getSessionById, saveSession, deleteSession,
  getVenues, getCourses, getSettings, KEYS
} = require('../../utils/data');
const {
  getTodayStr, getWeekDates, isBeforeToday,
  formatDisplayDate, getDayLabel, generateId, showToast
} = require('../../utils/utils');

const HOUR_OPTS = ['06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22'];
const MIN_OPTS  = ['00','15','30','45'];
const DUR_OPTS  = ['1小时','1.5小时','2小时'];
const DUR_VALS  = [1, 1.5, 2];
const STATUS_OPTS = ['已安排','已完成'];

Page({
  data: {
    weekOffset: 0,
    selectedDate: '',
    weekCells: [],
    daySessions: [],
    selectedDateLabel: '',
    showWarn: false,
    warnText: '',
    // form
    showForm: false,
    isEdit: false,
    editId: null,
    wasDeducted: false,
    fStuIdx: 0,
    fVenueIdx: 0,
    fDate: '',
    fTimeVal: [3, 0],   // [hourIdx, minIdx] → 09:00
    fDurIdx: 0,
    fStatusIdx: 0,
    fCourseIdx: 0,
    studentRange: [],
    venueRange: [],
    courseOpts: [],
    hourOpts: HOUR_OPTS,
    minOpts: MIN_OPTS,
    durOpts: DUR_OPTS,
    statusOpts: STATUS_OPTS,
    // raw data for save
    _students: [],
    _venues: [],
    _courses: [],
  },

  onLoad() { this._autoComplete(); this._refresh(); },
  onShow() { this._refresh(); },

  _autoComplete() {
    const sessions = getSessions();
    let anyChanged = false;
    sessions.forEach(s => {
      if (s.status === '已安排' && isBeforeToday(s.date)) {
        s.status = '已完成';
        if (!s.deducted) {
          s.deducted = true;
          const stu = getStudentById(s.student_id);
          if (stu && stu.remaining_sessions > 0) {
            saveStudent({ ...stu, remaining_sessions: stu.remaining_sessions - 1 });
          }
        }
        anyChanged = true;
      }
    });
    if (anyChanged) wx.setStorageSync(KEYS.sessions, sessions);
  },

  _refresh() {
    const today = getTodayStr();
    const weekDates = getWeekDates(this.data.weekOffset);
    let sel = this.data.selectedDate;
    if (!sel || !weekDates.includes(sel)) sel = weekDates[0];

    const students = getStudents();
    const sessions = getSessions();
    const settings = getSettings();
    const venues   = getVenues();

    const warnStudents = students.filter(s => s.remaining_sessions <= settings.renewal_threshold);

    const weekCells = weekDates.map(d => ({
      date: d,
      dayName: getDayLabel(d),
      dayNumber: parseInt(d.slice(8)),
      isToday: d === today,
      isActive: d === sel,
      hasSessions: sessions.some(s => s.date === d),
    }));

    const daySessions = sessions
      .filter(s => s.date === sel)
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(s => {
        const stu   = students.find(st => st.id === s.student_id);
        const venue = venues.find(v => v.id === s.venue_id);
        const parts = [];
        if (s.content) parts.push(s.content);
        if (venue)     parts.push(venue.name);
        parts.push(s.duration_hours + '小时');
        return {
          id: s.id,
          time: s.time,
          studentName: stu ? stu.name : '未知学员',
          meta: parts.join(' · '),
          status: s.status,
          statusClass: s.status === '已完成' ? 'status-done' : 'status-scheduled',
        };
      });

    this.setData({
      selectedDate: sel,
      weekCells,
      daySessions,
      selectedDateLabel: formatDisplayDate(sel) + ' ' + getDayLabel(sel),
      showWarn: warnStudents.length > 0,
      warnText: warnStudents.length > 0
        ? '续费提醒：' + warnStudents.map(s => s.name + ' 剩余 ' + s.remaining_sessions + ' 节').join('　')
        : '',
    });
  },

  onWeekTab(e) {
    const offset = Number(e.currentTarget.dataset.offset);
    const first = getWeekDates(offset)[0];
    this.setData({ weekOffset: offset, selectedDate: first });
    this._refresh();
  },

  onDayCell(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date });
    this._refresh();
  },

  // ---- Form open ----
  onAddTap() {
    const students = getStudents();
    if (students.length === 0) { showToast('请先在学员页面添加学员'); return; }
    const venues  = getVenues();
    const courses = getCourses();
    this.setData({
      showForm: true, isEdit: false, editId: null, wasDeducted: false,
      fDate: this.data.selectedDate,
      fStuIdx: 0, fVenueIdx: 0, fTimeVal: [3,0], fDurIdx: 0, fStatusIdx: 0, fCourseIdx: 0,
      studentRange: students.map(s => s.name + ' (' + s.remaining_sessions + '节)'),
      venueRange:   venues.map(v => v.name),
      courseOpts:   this._buildCourseOpts(students[0].id, null),
      _students: students, _venues: venues, _courses: courses,
    });
  },

  onSessionTap(e) {
    const session = getSessionById(e.currentTarget.dataset.id);
    if (!session) return;
    const students = getStudents();
    const venues   = getVenues();
    const courses  = getCourses();
    const stuIdx   = Math.max(0, students.findIndex(s => s.id === session.student_id));
    const venIdx   = Math.max(0, venues.findIndex(v => v.id === session.venue_id));
    const hIdx     = Math.max(0, HOUR_OPTS.indexOf(session.time.slice(0,2)));
    const mIdx     = Math.max(0, MIN_OPTS.indexOf(session.time.slice(3,5)));
    const dIdx     = Math.max(0, DUR_VALS.indexOf(session.duration_hours));
    const stIdx    = Math.max(0, STATUS_OPTS.indexOf(session.status));
    const courseOpts = this._buildCourseOpts(session.student_id, session.content);
    const cIdx = Math.max(0, courseOpts.findIndex(o => o.startsWith(session.content || '')));

    this.setData({
      showForm: true, isEdit: true, editId: session.id, wasDeducted: session.deducted || false,
      fDate: session.date, fStuIdx: stuIdx, fVenueIdx: venIdx,
      fTimeVal: [hIdx, mIdx], fDurIdx: dIdx, fStatusIdx: stIdx, fCourseIdx: cIdx,
      studentRange: students.map(s => s.name + ' (' + s.remaining_sessions + '节)'),
      venueRange:   venues.map(v => v.name),
      courseOpts,
      _students: students, _venues: venues, _courses: courses,
    });
  },

  onOverlayTap() { this.setData({ showForm: false }); },
  onFormClose()  { this.setData({ showForm: false }); },

  // ---- Form field changes ----
  onStuChange(e) {
    const idx = Number(e.detail.value);
    const stuId = this.data._students[idx].id;
    this.setData({ fStuIdx: idx, fCourseIdx: 0, courseOpts: this._buildCourseOpts(stuId, null) });
  },
  onVenueChange(e)  { this.setData({ fVenueIdx: Number(e.detail.value) }); },
  onDateChange(e)   { this.setData({ fDate: e.detail.value }); },
  onTimeChange(e)   { this.setData({ fTimeVal: e.detail.value }); },
  onDurChange(e)    { this.setData({ fDurIdx: Number(e.detail.value) }); },
  onStatusChange(e) { this.setData({ fStatusIdx: Number(e.detail.value) }); },
  onCourseChange(e) { this.setData({ fCourseIdx: Number(e.detail.value) }); },

  // ---- Save ----
  onFormSave() {
    const d = this.data;
    const student = d._students[d.fStuIdx];
    const venue   = d._venues[d.fVenueIdx];
    const time    = HOUR_OPTS[d.fTimeVal[0]] + ':' + MIN_OPTS[d.fTimeVal[1]];
    const duration = DUR_VALS[d.fDurIdx];
    const status   = STATUS_OPTS[d.fStatusIdx];
    // Strip recommendation tags to get clean course name
    const rawLabel = d.courseOpts[d.fCourseIdx] || '';
    const content  = rawLabel.split(' ✦')[0].split(' · ')[0].trim();

    if (!d.isEdit && student.remaining_sessions <= 0) {
      showToast('该学员课时已用完，请先续费'); return;
    }
    if (this._conflict(d.fDate, time, duration, d.editId)) {
      showToast('该时间段与已有课程重叠'); return;
    }

    const id = d.editId || generateId();
    let deducted = d.wasDeducted;
    if (status === '已完成' && !deducted) {
      if (student.remaining_sessions > 0) {
        saveStudent({ ...student, remaining_sessions: student.remaining_sessions - 1 });
      }
      deducted = true;
    }

    saveSession({
      id,
      student_id: student.id,
      venue_id:   venue ? venue.id : '',
      date: d.fDate, time, duration_hours: duration,
      content, status, deducted,
    });
    this.setData({ showForm: false });
    this._refresh();
  },

  onFormDelete() {
    wx.showModal({
      title: '确认删除', content: '确认删除这节课？',
      success: res => {
        if (res.confirm) {
          deleteSession(this.data.editId);
          this.setData({ showForm: false });
          this._refresh();
        }
      }
    });
  },

  // ---- Helpers ----
  _buildCourseOpts(studentId, selectedContent) {
    const courses  = getCourses();
    if (courses.length === 0) return [];
    const sessions = getSessions().filter(s => s.student_id === studentId);
    const today    = new Date();
    const sorted = courses.map(c => {
      const last = sessions
        .filter(s => s.content === c.name)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const days = last
        ? Math.floor((today - new Date(last.date + 'T00:00:00')) / 86400000)
        : Infinity;
      return { ...c, days };
    }).sort((a, b) => b.days - a.days);

    return sorted.map((c, i) => {
      const rec = i === 0 ? ' ✦ 推荐' : '';
      const day = c.days === Infinity ? ' · 从未安排' : ' · ' + c.days + '天前';
      return c.name + rec + day;
    });
  },

  _conflict(date, time, dur, excludeId) {
    const toMins = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const ns = toMins(time), ne = ns + dur * 60;
    return getSessions().some(s => {
      if (s.id === excludeId || s.date !== date) return false;
      const ss = toMins(s.time), se = ss + s.duration_hours * 60;
      return ns < se && ss < ne;
    });
  },
});
