const mock = require('../../utils/mock.js');

Page({
  data: {
    types: mock.CONTACT_TYPES
  },

  select(e) {
    const key = e.currentTarget.dataset.key;
    // 新建事件草稿，存入全局，供后续页面使用
    const app = getApp();
    const timestamp = Date.now();
    const existing = app.globalData.draftEvent || {};
    app.globalData.draftEvent = Object.assign({}, existing, {
      id: existing.id || 'event_' + timestamp,
      contactType: key,
      contactTypeName: mock.CONTACT_TYPES.find(t => t.key === key).name,
      createdAt: existing.createdAt || '刚刚',
      createdAtTimestamp: existing.createdAtTimestamp || timestamp
    });
    wx.navigateTo({ url: '/pages/guide/guide?contactType=' + key });
  },

  onStepChange(e) {
    const target = Number(e.detail.step);
    if (target === 1) wx.navigateBack({ delta: 1 });
  }
});
