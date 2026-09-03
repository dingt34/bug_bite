Page({
  data: {
    events: []
  },

  onShow() {
    const events = wx.getStorageSync('events') || [];
    this.setData({ events: events });
  },

  viewEvent(e) {
    wx.navigateTo({ url: '/pages/event-detail/event-detail?id=' + e.currentTarget.dataset.id });
  }
});
