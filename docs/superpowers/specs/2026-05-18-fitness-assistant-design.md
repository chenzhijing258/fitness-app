# Fitness Assistant — Design Spec
**Date:** 2026-05-18

## Overview

A mobile-first web app for a single personal trainer to manage their weekly schedule, student information, and session records. Runs entirely in the browser with no backend — data persists via localStorage. Built with plain HTML / CSS / JS (no framework).

---

## Tech Stack

| Item | Decision |
|---|---|
| Language | Vanilla HTML / CSS / JS |
| Storage | localStorage (JSON) |
| Deployment | Open index.html directly in mobile browser |
| Dependencies | None |

---

## File Structure

```
fitness-app/
├── index.html
├── style.css
└── app.js
```

---

## Navigation

Bottom navigation bar with three tabs:

1. **课程表** — Weekly schedule (default view)
2. **学员** — Student management
3. **设置** — Settings

---

## Views

### 1. 课程表 (Schedule)

Two sub-tabs at the top: **本周** / **下周**

**Week strip** (top):
- Displays Mon–Sun with date numbers
- Highlighted day = selected day
- Days with sessions show a small dot indicator

**Session list** (below strip):
- Shows all sessions for the selected day, sorted by time
- Each row: `HH:MM  学员姓名  —  课程内容  场所`
- Tap a row → open Edit Session sheet
- **＋ 添加课程** button → open Add Session sheet

**Renewal reminder banner** (top of page, above sub-tabs):
- Appears when any student has ≤ 3 remaining sessions
- Shows: `⚠️ 张三 剩余 2 节  李四 剩余 1 节`

**Auto-complete logic** (runs on every app load):
- Find all sessions with status `已安排` and date < today
- Mark them `已完成`
- Deduct 1 from the corresponding student's remaining session count
- Runs once per app launch, silently

---

### 2. Add / Edit Session (bottom sheet)

Triggered by tapping a session row or the ＋ button.

| Field | Behaviour |
|---|---|
| 学员 | Dropdown from student list |
| 场所 | Dropdown from venue list |
| 日期 | Date picker, defaults to selected day |
| 时间 | Time picker |
| 时长 | Select: 1h / 1.5h / 2h (default 1h) |
| 课程内容 | Text area, auto-filled with the global course template; editable |
| 状态 | Toggle: 已安排 / 已完成 |
| 删除课程 | Red button, visible in edit mode only; removes session from schedule |

On save (已完成): deduct 1 from student remaining count if not already deducted.
On delete: remove session record entirely.

---

### 3. 学员 (Students)

**Student list page:**
- Search bar at top
- Each row: `姓名  剩余 N 节  [⚠️]  ›`
- ⚠️ shown when remaining sessions ≤ renewal threshold (default 3)
- **＋ 添加学员** button at bottom

**Student detail page** (scroll, collapsible sections):

| Section | Content |
|---|---|
| 基本信息 | Name, phone, notes — inline editable |
| 课包记录 | List of packages (purchase date, quantity); ＋ add new package |
| 历史课程 | Most recent 10 sessions (date, content, status); 「查看全部」 expands all |
| 身体数据 | Entries (date + metrics); line trend chart; ＋ add record |
| Feedback | Free-text entries sorted by date; ＋ add entry |

---

### 4. 设置 (Settings)

| Section | Content |
|---|---|
| 课程模板 | Single text area; content auto-fills session form |
| 健身房管理 | List of venues with delete; ＋ add venue |
| 续费提醒阈值 | Number input, default 3 |

---

## Data Model (localStorage keys)

### `students` — array
```json
[
  {
    "id": "uuid",
    "name": "张三",
    "phone": "138xxxx",
    "notes": "",
    "remaining_sessions": 8,
    "packages": [
      { "id": "uuid", "date": "2026-05-01", "quantity": 10 }
    ],
    "body_data": [
      { "id": "uuid", "date": "2026-05-01", "weight": 70.5, "notes": "" }
    ],
    "feedback": [
      { "id": "uuid", "date": "2026-05-01", "text": "进步明显" }
    ]
  }
]
```

### `sessions` — array
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "venue_id": "uuid",
    "date": "2026-05-18",
    "time": "09:00",
    "duration_hours": 1,
    "content": "深蹲\n硬拉\n卧推",
    "status": "已安排",
    "deducted": false
  }
]
```

`deducted` prevents double-counting: a session's count deduction happens exactly once, regardless of whether it was completed manually or via auto-complete on app load.

### `venues` — array
```json
[
  { "id": "uuid", "name": "朝阳健身房" }
]
```

### `template` — string
```
深蹲\n硬拉\n卧推\n...
```

### `settings` — object
```json
{ "renewal_threshold": 3 }
```

---

## Key Behaviours Summary

| Behaviour | Rule |
|---|---|
| Auto-complete sessions | On app load: sessions with date < today and status `已安排` → set `已完成`, deduct student count |
| Course content prefill | When adding a session, content field prefills with global template |
| Renewal warning | Student list ⚠️ + top banner when remaining ≤ threshold |
| Session deletion | Removes record only; does not affect student remaining count |
| Manual status change to 已完成 | Deducts 1 from student remaining count only if `deducted = false`; sets `deducted = true` |
| History sessions | Student detail shows latest 10; expandable to all |

---

## Out of Scope (v1)

- Cloud sync / multi-device
- Push notifications
- Multiple coaches
- Authentication / login
- Export / print
