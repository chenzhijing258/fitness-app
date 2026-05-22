// app.js
// 云同步暂时关闭，待配置云开发环境 ID 后再开启
// const { scheduleSyncToCloud, syncFromCloud } = require('./utils/cloud');

const APP_CONFIG = {
  password: 'xiaoyan2024'   // 修改为你设置的密码
};

App({
  globalData: {
    password: APP_CONFIG.password
  },

  onLaunch() {
    const unlocked = wx.getStorageSync('fa_unlocked');
    if (!unlocked) {
      wx.reLaunch({ url: '/pages/lock/lock' });
    }
  },

  onShow() {
    const unlocked = wx.getStorageSync('fa_unlocked');
    if (!unlocked) {
      wx.reLaunch({ url: '/pages/lock/lock' });
    }
  }
});
