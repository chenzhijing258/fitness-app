// app.js
const APP_CONFIG = {
  // 修改为你想设置的密码
  password: 'xiaoyan2024'
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
    // 每次切回前台也检查锁定状态
    const unlocked = wx.getStorageSync('fa_unlocked');
    if (!unlocked) {
      wx.reLaunch({ url: '/pages/lock/lock' });
    }
  }
});
