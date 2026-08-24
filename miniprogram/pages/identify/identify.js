const mock = require('../../utils/mock.js');

Page({
  data: {
    image: '',
    status: 'idle', // idle | ready | loading | done
    loading: false,
    result: null
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ image: res.tempFilePaths[0], status: 'ready', result: null });
      }
    });
  },

  recognize() {
    if (!this.data.image || this.data.loading) {
      return;
    }
    this.setData({ loading: true, status: 'loading' });
    // 真实接入：由云函数代理百度动物识别 API（前端不保存 API Key/Secret Key）
    setTimeout(() => {
      const r = mock.RECOGNITION_MOCK;
      const candidates = r.candidates.map(c => ({
        name: c.name,
        percent: Math.round(c.score * 100)
      }));
      this.setData({
        loading: false,
        status: 'done',
        result: Object.assign({}, r, { candidates: candidates })
      });
    }, 1000);
  }
});
