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
    // 初始化云开发（替换 YOUR-ENV-ID 为真实环境 ID）
    wx.cloud.init({ env: 'YOUR-ENV-ID', traceUser: false });

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
