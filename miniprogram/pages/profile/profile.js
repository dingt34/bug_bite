const store = require('../../utils/store');
const nav = require('../../utils/nav');
const eventRecords = require('../../utils/event-records');

Page({
  data: {
    user: {}, event: {}, plan: {}, eventCount: 0, pendingEventCount: 0, aiNoteCount: 0
  },

  onShow() {
    nav.syncTab(this, 4);
    const events = store.withoutDemoEvents(store.get('events', []))
      .map(item => eventRecords.normalizeEvent(item))
      .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    const pendingEvents = events
      .filter(item => item.status === '待复查')
      .sort((a, b) => a.nextReviewAtTimestamp - b.nextReviewAtTimestamp);
    if (events.length !== store.get('events', []).length) store.set('events', events);
    this.setData({
      user: store.get('user', { nickname: '林间观察员', region: '浙江省 · 杭州市' }),
      event: pendingEvents[0] || {},
      eventCount: events.length,
      pendingEventCount: pendingEvents.length,
      plan: store.get('plans', [])[0] || {},
      aiNoteCount: store.get('aiNotes', []).length
    });
  },

  edit() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  events() { wx.navigateTo({ url: '/pages/events/events' }); },
  plans() { wx.navigateTo({ url: '/pages/my-plans/my-plans' }); },
  aiNotes() { wx.navigateTo({ url: '/pages/ai-notes/ai-notes' }); },
  privacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); }
});
