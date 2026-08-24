const mock = require('../../utils/mock.js');

const LEVEL_COLOR = {
  emergency: '#E53935',
  consult: '#F57C00',
  observe: '#2E7D5B'
};

Page({
  data: {
    event: null,
    eventColor: '#2E7D5B',
    timeline: []
  },

  onLoad(options) {
    const events = wx.getStorageSync('events') || [];
    let event = events.find(e => e.id === options.id);
    if (!event) {
      // 兜底演示
      event = mock.DEMO_EVENTS[0];
    }
    this.setData({
      event: event,
      eventColor: LEVEL_COLOR[event.riskLevel] || '#2E7D5B',
      timeline: this.buildTimeline(event)
    });
  },

  buildTimeline(event) {
    return [
      { time: event.createdAt || event.occurredAt, text: '记录事件：' + (event.summary || event.contactTypeName) },
      { time: '刚刚', text: '已生成复查提醒，待观察期间保持记录' }
    ];
  },

  copySummary() {
    wx.setClipboardData({ data: this.data.event.summary || '', success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  updateSymptom() {
    wx.showToast({ title: '初稿暂未接入复查流程', icon: 'none' });
  }
});
