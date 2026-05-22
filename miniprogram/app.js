// app.js
const { scheduleSyncToCloud, syncFromCloud } = require('./utils/cloud');

const APP_CONFIG = {
  password: 'xiaoyan2024'   // 修改为你设置的密码
};

App({
  globalData: {
    password: APP_CONFIG.password
  },

  // 挂载 scheduleSyncToCloud，data.js 的 _save 通过 getApp() 调用
  scheduleSyncToCloud,

  async onLaunch() {
    wx.cloud.init({ env: 'cloudbase-d5ggjnu290761c820', traceUser: false });

    const unlocked = wx.getStorageSync('fa_unlocked');
    if (!unlocked) {
      wx.reLaunch({ url: '/pages/lock/lock' });
      return;
    }

    // 已解锁：从云端拉取最新数据
    await syncFromCloud();
  },

  onShow() {
    const unlocked = wx.getStorageSync('fa_unlocked');
    if (!unlocked) {
      wx.reLaunch({ url: '/pages/lock/lock' });
    }
  }
});
