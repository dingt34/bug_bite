const mock = require('../../utils/mock.js');

Page({
  data: {
    events: []
  },

  onShow() {
    let events = wx.getStorageSync('events') || [];
    if (!events.length) {
      events = mock.DEMO_EVENTS;
    }
    this.setData({ events: events });
  },

  viewEvent(e) {
    wx.navigateTo({ url: '/pages/event-detail/event-detail?id=' + e.currentTarget.dataset.id });
  }
});
