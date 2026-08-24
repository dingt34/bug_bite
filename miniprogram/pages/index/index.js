Page({
  data: {},

  goPrecheck() {
    wx.navigateTo({ url: '/pages/precheck/precheck' });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },

  goIdentify() {
    wx.navigateTo({ url: '/pages/identify/identify' });
  }
});
