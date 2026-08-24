const mock = require('../../utils/mock.js');

Page({
  data: {
    types: mock.CONTACT_TYPES
  },

  select(e) {
    const key = e.currentTarget.dataset.key;
    // 新建事件草稿，存入全局，供后续页面使用
    const app = getApp();
    app.globalData.draftEvent = {
      contactType: key,
      contactTypeName: mock.CONTACT_TYPES.find(t => t.key === key).name
    };
    wx.navigateTo({ url: '/pages/danger/danger?contactType=' + key });
  }
});
