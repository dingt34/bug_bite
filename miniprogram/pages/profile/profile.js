const mock = require('../../utils/mock.js');

Page({
  data: {
    displayName: '点击登录',
    avatarText: '登',
    loginTip: '未登录 · 点击登录',
    latestPlan: null,
    events: []
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    const latestPlan = wx.getStorageSync('latestPlan') || getApp().globalData.latestPlan;
    let events = wx.getStorageSync('events') || [];
    if (!events.length) {
      events = mock.DEMO_EVENTS;
    }
    // 补充风险等级中文名，供列表徽标显示
    events = events.map(function (ev) {
      const level = mock.RISK_LEVELS[ev.riskLevel] || {};
      return Object.assign({}, ev, { levelName: level.name || '' });
    });

    this.setData({
      displayName: userInfo ? userInfo.displayName : '点击登录',
      avatarText: userInfo ? userInfo.avatarText : '登',
      loginTip: userInfo ? '已登录 · 本地体验模式' : '未登录 · 点击登录',
      latestPlan: latestPlan,
      events: events
    });
  },

  goLogin() {
    if (!wx.getStorageSync('userInfo')) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  goPlans() {
    wx.navigateTo({ url: '/pages/my-plans/my-plans' });
  },

  goEventDetail(e) {
    wx.navigateTo({ url: '/pages/event-detail/event-detail?id=' + e.currentTarget.dataset.id });
  }
});
