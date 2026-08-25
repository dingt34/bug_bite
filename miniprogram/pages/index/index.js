Page({
  data: {},

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
