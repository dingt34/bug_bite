Page({
  data: {
    loading: false
  },

  doLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    // 模拟登录耗时，真实接入需调用 wx.login + 云函数换取自定义登录态
    setTimeout(() => {
      wx.setStorageSync('userInfo', {
        displayName: '山野观察员',
        avatarText: '山'
      });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 600);
    }, 1500);
  }
});
