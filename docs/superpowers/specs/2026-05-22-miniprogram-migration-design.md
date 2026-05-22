# 微信小程序迁移设计文档

**目标：** 将现有 GitHub Pages web app 完整迁移为微信小程序，使用微信云开发替代 GitHub Gist 同步，用固定密码做访问门禁。

**背景：** 当前 web 版本部署于 GitHub Pages，在中国大陆访问不稳定。小程序原生运行于微信客户端，访问速度有保障，云开发后端在国内也可靠。

---

## 技术选型

| 方面 | Web 版（现在） | 小程序版（迁移后） |
|---|---|---|
| 渲染 | `innerHTML` + DOM 操作 | WXML 模板 + `this.setData()` 数据绑定 |
| 本地存储 | `localStorage` | `wx.getStorageSync / wx.setStorageSync` |
| 云同步 | GitHub Gist REST API | 微信云开发（CloudBase）数据库 |
| 用户认证 | 无（或 GitHub PAT） | 固定密码门禁（本地校验） |
| 样式 | CSS 变量 | WXSS（支持 CSS 变量，直接复用） |
| 底部导航 | 手写 HTML + JS | `app.json` tabBar 原生配置 |
| 框架 | 原生 Vanilla JS | 原生微信小程序（无 uni-app/Taro） |

---

## 项目结构

```
miniprogram/
├── app.js               # 全局生命周期 + 云开发初始化 + 解锁状态检查
├── app.json             # 全局配置（页面列表、tabBar、云开发 env）
├── app.wxss             # 全局样式（复制 style.css 的 CSS 变量和基础类）
├── pages/
│   ├── lock/            # 密码门禁页（首次打开时显示）
│   │   ├── lock.js
│   │   ├── lock.wxml
│   │   └── lock.wxss
│   ├── schedule/        # 课程表
│   │   ├── schedule.js
│   │   ├── schedule.wxml
│   │   └── schedule.wxss
│   ├── students/        # 学员列表
│   │   ├── students.js
│   │   ├── students.wxml
│   │   └── students.wxss
│   ├── student-detail/  # 学员详情（基本信息 / 课包 / 历史 / 身体数据 / Feedback）
│   │   ├── student-detail.js
│   │   ├── student-detail.wxml
│   │   └── student-detail.wxss
│   └── settings/        # 设置
│       ├── settings.js
│       ├── settings.wxml
│       └── settings.wxss
└── utils/
    ├── data.js           # 存储层（wx.storage，接口与现有 data.js 几乎一致）
    ├── utils.js          # 日期工具（直接复用现有代码）
    └── cloud.js          # 云开发同步层
```

---

## 数据层（`utils/data.js`）

存储接口与现有版本接口一致，仅替换底层两个函数：

```js
// 现在（web）
function _load(key) { return JSON.parse(localStorage.getItem(key)); }
function _save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// 迁移后（小程序）
function _load(key) { return wx.getStorageSync(key) || null; }
function _save(key, val) {
  wx.setStorageSync(key, val);  // wx.storage 直接存对象，无需 JSON.stringify
  if (typeof scheduleSyncToCloud === 'function') scheduleSyncToCloud();
}
```

注意：`wx.setStorageSync` 原生支持存储 JS 对象，不需要手动 JSON 序列化。读取时直接拿到对象，无需 `JSON.parse`。

所有上层函数（`getStudents / saveSession / deleteVenue` 等）以及 KEYS 常量保持不变。

---

## 工具函数（`utils/utils.js`）

直接复制现有 `js/utils.js`。所有日期函数（`getTodayStr / getWeekDates / formatDisplayDate / getDayLabel` 等）不依赖浏览器 API，可无修改运行于小程序环境。

---

## 访问控制（`pages/lock`）

### 逻辑

- 密码硬编码在 `app.js` 的配置对象中：`const APP_CONFIG = { password: 'your-password-here' }`
- `app.js` `onLaunch`：读取 `wx.getStorageSync('fa_unlocked')`，若为 `true` 则跳转首页（`schedule`），否则跳转 `lock` 页
- `lock` 页：输入框 + 确认按钮；输入正确 → `wx.setStorageSync('fa_unlocked', true)` → 跳转 `schedule`；输错 → 提示"密码错误"
- 设置页提供「退出」按钮：清除 `fa_unlocked` → 跳转 `lock` 页

### WXML（简化示意）

```xml
<!-- pages/lock/lock.wxml -->
<view class="lock-container">
  <text class="lock-title">🏋️ 健身课程助手</text>
  <input class="form-control" password bindinput="onInput" placeholder="请输入密码"/>
  <button class="btn btn-primary" bindtap="onConfirm">进入</button>
  <text class="error-text" wx:if="{{showError}}">密码错误，请重试</text>
</view>
```

---

## 云同步（`utils/cloud.js`）

### 方案

使用微信云开发数据库。集合名：`userData`，文档 ID 固定为 `"main"`（单用户，无需隔离）。

云开发环境归属开发者账号，非公开小程序无法从外部访问，安全性足够。

### 数据结构

```
userData 集合
└── { _id: "main", fa_students: [...], fa_sessions: [...], fa_venues: [...], fa_courses: [...], fa_settings: {...} }
```

### 接口

```js
// utils/cloud.js

const DB = () => wx.cloud.database();
let _syncTimer = null;

// 防抖上传（2秒）
function scheduleSyncToCloud() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_doSyncToCloud, 2000);
}

// 上传所有 fa_* 数据到云端
async function _doSyncToCloud() {
  const doc = {};
  Object.values(KEYS).forEach(key => { doc[key] = wx.getStorageSync(key) || null; });
  try {
    const result = await DB().collection('userData').doc('main').set({ data: doc });
  } catch (e) {
    console.warn('[cloud] upload failed:', e);
  }
}

// 启动时从云端拉取
async function syncFromCloud() {
  try {
    const res = await DB().collection('userData').doc('main').get();
    if (!res.data) return false;
    let changed = false;
    Object.values(KEYS).forEach(key => {
      const cloudVal = res.data[key];
      if (cloudVal != null && wx.getStorageSync(key) !== cloudVal) {
        wx.setStorageSync(key, cloudVal);
        changed = true;
      }
    });
    return changed;
  } catch (e) {
    console.warn('[cloud] download failed:', e);
    return false;
  }
}
```

---

## 页面设计

### 课程表页（`pages/schedule`）

对应现有 `renderScheduleView`。是最复杂的页面，包含：
- 本周/下周 tab（`data.weekOffset` + `bindtap`）
- 7 天横向滚动条（`<scroll-view>` + `wx:for`）
- 当天课程列表
- 添加/编辑课程弹窗（用 `wx:if="{{showSessionForm}}"` 控制的页内 sheet）

底部弹窗（sheet）模式：不用 `document.createElement`，改为页面内预定义一个 `<view class="sheet-overlay">` 区块，通过 `this.setData({ showSessionForm: true })` 显示/隐藏。

### 学员列表页（`pages/students`）

- `wx:for` 渲染学员卡片
- `bindinput` 实现搜索过滤
- 点击跳转学员详情：`wx.navigateTo({ url: '/pages/student-detail/student-detail?id=xxx' })`

### 学员详情页（`pages/student-detail`）

通过 URL 参数获取学员 ID：`onLoad(options) { this.studentId = options.id; }`

包含 5 个折叠区块（基本信息 / 课包 / 历史课程 / 身体数据 / Feedback），用 `wx:if` 控制展开/收起。身体数据 delta 卡片、编辑弹窗均原样迁移，逻辑不变。

### 设置页（`pages/settings`）

移除「云端同步」Token 输入卡片（云开发无需配置）。新增「退出登录」按钮（清除 `fa_unlocked`）。其余卡片（续费阈值、课程管理、健身房管理、导出/导入）保持不变。

---

## 底部 tabBar

```json
// app.json (tabBar 部分)
"tabBar": {
  "color": "#94a3b8",
  "selectedColor": "#3b82f6",
  "backgroundColor": "#0f172a",
  "borderStyle": "black",
  "list": [
    { "pagePath": "pages/schedule/schedule", "text": "课程表" },
    { "pagePath": "pages/students/students", "text": "学员" },
    { "pagePath": "pages/settings/settings", "text": "设置" }
  ]
}
```

tabBar 图标使用微信小程序要求的 PNG 格式（非 emoji），需准备 3 组图标（默认 + 选中各一张）。

---

## 可直接复用的业务逻辑

以下函数不依赖浏览器 API，可直接复制到小程序 utils 或页面 JS 中：

- `_sortCoursesByRec(studentId)` — 课程推荐排序
- `_hasTimeConflict(date, time, durationHours, excludeId)` — 时间冲突检测
- `runAutoComplete()` — 自动将过期课程标记为已完成
- `generateId()` — ID 生成
- 所有日期工具函数

---

## 实现任务分解（7 个任务）

| # | 任务 | 主要内容 |
|---|---|---|
| 1 | 注册 + 初始化 | 注册小程序开发者账号、创建云开发环境、用微信开发者工具建项目 |
| 2 | 数据层 + 工具 | 迁移 `data.js`（替换 storage 接口）、复制 `utils.js` |
| 3 | 密码门禁页 | `lock` 页面 + `app.js` 启动逻辑 |
| 4 | 课程表页 | 最复杂，含周切换、日期条、课程列表、添加/编辑 sheet |
| 5 | 学员模块 | 学员列表页 + 学员详情页（含身体数据、历史、Feedback） |
| 6 | 设置页 | 续费阈值、课程/健身房管理、导出导入、退出按钮 |
| 7 | 云同步集成 | 接入云开发、端到端测试（多设备数据同步） |

---

## 前置准备（开始编码前）

1. 访问 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 注册 → 选择「小程序」→ 选「个人」类型
2. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
3. 新建小程序项目，勾选「使用云开发」
4. 在云开发控制台创建 `userData` 集合，将权限设为「仅创建者可读写」（虽然是单用户，这是默认安全设置）
5. 准备 3 组 tabBar 图标（PNG，81×81px）：课程表、学员、设置
