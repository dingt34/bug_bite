const LEVEL_COLOR = {
  emergency: '#E53935',
  consult: '#F57C00',
  observe: '#2E7D5B'
};

Page({
  data: {
    event: null,
    eventColor: '#2E7D5B',
    timeline: [],
    latestReview: null,
    communicationSummary: '',
    imageGroups: []
  },

  onLoad(options) {
    const events = wx.getStorageSync('events') || [];
    let event = events.find(e => e.id === options.id);
    if (!event) {
      wx.showModal({
        title: '记录不存在',
        content: '该事件可能已被删除。',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }
    const reviews = event.reviews || [];
    this.setData({
      event: event,
      eventColor: LEVEL_COLOR[event.riskLevel] || '#2E7D5B',
      timeline: this.buildTimeline(event),
      latestReview: reviews.length ? reviews[reviews.length - 1] : null,
      communicationSummary: [event.summary, event.latestReviewSummary].filter(Boolean).join('\n\n最新复查：\n'),
      imageGroups: this.buildImageGroups(event)
    });
  },

  buildImageGroups(event) {
    const records = Array.isArray(event.imageRecords) ? event.imageRecords : [];
    const groups = [];
    const categorizedPaths = [];
    const categories = [
      { key: 'insect', label: '虫体照片' },
      { key: 'wound', label: '伤口/皮肤表现照片' }
    ];
    categories.forEach(category => {
      const images = records.filter(item => item.category === category.key).map(item => item.path);
      if (!images.length) {
        const legacyPath = category.key === 'insect' ? event.insectImageRef : event.woundImageRef;
        if (legacyPath) images.push(legacyPath);
      }
      images.forEach(path => categorizedPaths.push(path));
      if (images.length) groups.push({ key: category.key, label: category.label, images });
    });
    const otherImages = (event.imageRefs || []).filter(path => categorizedPaths.indexOf(path) === -1);
    if (otherImages.length) groups.push({ key: 'other', label: '其他现场/复查图片', images: otherImages });
    return groups;
  },

  buildTimeline(event) {
    const timeline = [
      { id: event.id, time: event.createdAt || event.occurredAt, text: '创建事件：' + event.contactTypeName + ' · ' + event.levelName }
    ];
    (event.reviews || []).forEach(review => {
      timeline.push({
        id: review.id,
        time: review.createdAt,
        text: '症状复查：' + review.levelName + (review.downgradeBlocked ? '（紧急等级保持不变）' : '')
      });
    });
    return timeline;
  },

  copySummary() {
    wx.setClipboardData({ data: this.data.communicationSummary || '', success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  previewImage(e) {
    const urls = this.data.event.imageRefs || [];
    if (!urls.length) {
      return;
    }
    wx.previewImage({
      current: e.currentTarget.dataset.src || urls[0],
      urls: urls
    });
  },

  updateSymptom() {
    wx.navigateTo({ url: '/pages/event-review/event-review?id=' + this.data.event.id });
  }
});
