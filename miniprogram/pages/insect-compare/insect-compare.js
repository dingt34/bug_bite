const guide = require('../../utils/insect-guide.js');

Page({
  data: {
    comparison: null,
    errorMessage: ''
  },

  onLoad(options) {
    const rawIds = decodeURIComponent((options && options.ids) || '');
    const ids = rawIds.split(',').filter(Boolean);
    try {
      this.setData({ comparison: guide.buildComparison(ids), errorMessage: '' });
    } catch (error) {
      this.setData({ comparison: null, errorMessage: '请先选择至少 2 个物种进行对比。' });
    }
  },

  backToGuide() {
    wx.navigateBack();
  },

  goContact() {
    wx.navigateTo({ url: '/pages/danger/danger' });
  }
});
