const tabBar = require('../../utils/tab-bar.js');

Page({
  data: {},

  onShow() {
    tabBar.syncSelected(this, 0);
  },

  goPrecheck() {
    wx.navigateTo({ url: '/pages/precheck/precheck' });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/danger/danger' });
  },

  goInsectGuide() {
    wx.navigateTo({ url: '/pages/insect-guide/insect-guide' });
  },

  goAiChat() {
    wx.switchTab({ url: '/pages/ai/ai' });
  }
});
