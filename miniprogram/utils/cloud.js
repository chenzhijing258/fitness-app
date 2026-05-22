// utils/cloud.js
// 使用微信云开发数据库同步所有 fa_* 数据
// 单用户应用：collection userData 中固定一条文档 ID = 'main'

const FA_KEYS = ['fa_students','fa_sessions','fa_venues','fa_courses','fa_settings'];

let _syncTimer = null;

function scheduleSyncToCloud() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_doSync, 2000);
}

async function _doSync() {
  const db = wx.cloud.database();
  const doc = {};
  FA_KEYS.forEach(key => {
    const val = wx.getStorageSync(key);
    doc[key] = val || null;
  });
  try {
    // set() 相当于 upsert：文档不存在则创建，存在则覆盖
    await db.collection('userData').doc('main').set({ data: doc });
  } catch (e) {
    console.warn('[cloud] upload failed', e);
  }
}

async function syncFromCloud() {
  const db = wx.cloud.database();
  try {
    const res = await db.collection('userData').doc('main').get();
    if (!res.data) return false;
    let changed = false;
    FA_KEYS.forEach(key => {
      const cloudVal = res.data[key];
      if (cloudVal == null) return;
      // wx.storage 直接存对象，用 JSON.stringify 做比较
      const local = wx.getStorageSync(key);
      if (JSON.stringify(local) !== JSON.stringify(cloudVal)) {
        wx.setStorageSync(key, cloudVal);
        changed = true;
      }
    });
    return changed;
  } catch (e) {
    // 文档不存在（首次使用）或网络错误，正常情况，忽略
    return false;
  }
}

module.exports = { scheduleSyncToCloud, syncFromCloud };
