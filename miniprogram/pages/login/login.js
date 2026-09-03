const store = require('../../utils/store');

Page({
  onShow() {
    if (store.get('profileComplete', false)) wx.reLaunch({ url: '/pages/home/home' });
  },
  login() {
    store.set('wechatAuthorized', true);
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },
  openPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  }
});
