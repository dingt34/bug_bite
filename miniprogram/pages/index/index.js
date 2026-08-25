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
    wx.navigateTo({ url: '/pages/contact/contact' });
  },

  goAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' });
  }
});
