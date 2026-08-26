const mock = require('../../utils/mock.js');
const recognition = require('../../utils/recognition.js');

Page({
  data: {
    image: '',
    status: 'idle', // idle | ready | loading | done | error
    loading: false,
    result: null,
    errorMessage: ''
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const image = res.tempFilePaths && res.tempFilePaths[0];
        this.recognitionToken = (this.recognitionToken || 0) + 1;
        if (!image) {
          this.setData({ loading: false, status: 'error', result: null, errorMessage: '未能读取所选图片，请重新选择。' });
          return;
        }
        this.setData({ image, status: 'ready', loading: false, result: null, errorMessage: '' });
      },
      fail: (error) => {
        if (error && String(error.errMsg || '').indexOf('cancel') > -1) return;
        this.setData({ status: 'error', loading: false, result: null, errorMessage: '图片选择失败，请检查相册或相机权限后重试。' });
      }
    });
  },

  recognize() {
    if (!this.data.image || this.data.loading) {
      return;
    }
    const token = (this.recognitionToken || 0) + 1;
    this.recognitionToken = token;
    this.setData({ loading: true, status: 'loading', result: null, errorMessage: '' });
    setTimeout(() => {
      if (this.recognitionToken !== token) return;
      try {
        const result = recognition.buildDemoResult(mock.RECOGNITION_MOCK);
        this.setData({ loading: false, status: 'done', result, errorMessage: '' });
      } catch (error) {
        this.setData({ loading: false, status: 'error', result: null, errorMessage: '模拟识别暂时不可用，请稍后重试。' });
      }
    }, 700);
  },

  retry() {
    if (this.data.image) this.recognize();
    else this.chooseImage();
  },

  goContact() {
    wx.navigateTo({ url: '/pages/danger/danger' });
  },

  onUnload() {
    this.recognitionToken = (this.recognitionToken || 0) + 1;
  }
});
