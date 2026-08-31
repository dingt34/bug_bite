const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: { user: {}, plan: {}, event: {} },
  onShow() {
    nav.syncTab(this, 0);
    this.setData({ user: store.get('user', { nickname: '林间观察员' }), plan: store.get('plans', [])[0] || {}, event: store.get('events', [])[0] || {} });
  },
  danger() { wx.navigateTo({ url: '/pages/danger/danger?source=home' }); },
  precheck() { wx.navigateTo({ url: '/pages/precheck/precheck' }); },
  plans() { wx.navigateTo({ url: '/pages/my-plans/my-plans' }); },
  event() { wx.navigateTo({ url: `/pages/event-detail/event-detail?id=${this.data.event.id || 'event_mosquito'}` }); }
});
