const store = require('../../utils/store');

Page({
  login() {
    store.set('wechatAuthorized', true);
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },
  openPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  }
});
