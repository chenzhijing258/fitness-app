// pages/lock/lock.js
const app = getApp();

Page({
  data: {
    inputVal: '',
    showError: false,
  },

  onInput(e) {
    this.setData({ inputVal: e.detail.value, showError: false });
  },

  onConfirm() {
    if (this.data.inputVal === app.globalData.password) {
      wx.setStorageSync('fa_unlocked', true);
      wx.switchTab({ url: '/pages/schedule/schedule' });
    } else {
      this.setData({ showError: true });
    }
  }
});
