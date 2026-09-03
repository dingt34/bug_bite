const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

Page({
  data: {
    photo: '',
    error: '',
    flash: 'auto',
    identifying: false,
    candidates: [],
    visibleFeatures: [],
    visibleFeaturesText: '',
    uncertainty: '',
    // 模拟器没有真实摄像头，用设计稿的自然主题插画占位；真机上仍走 <camera>
    usePlaceholder: false
  },

  onLoad() {
    try {
      const info = wx.getSystemInfoSync();
      this.setData({ usePlaceholder: info.platform === 'devtools' });
    } catch (err) {
      this.setData({ usePlaceholder: false });
    }
  },

  // 设计稿第 17 页是全屏取景，底部不出现 tabBar
  onShow() {
    nav.syncTab(this, 2);
    wx.hideTabBar({ animation: false, fail() {} });
  },

  onHide() {
    wx.showTabBar({ animation: false, fail() {} });
  },

  onUnload() {
    wx.showTabBar({ animation: false, fail() {} });
  },

  // 摄像头不可用时也回落到插画，画面不会变成一块空黑底
  error(e) {
    this.setData({
      error: e.detail.errMsg || '无法使用摄像头',
      usePlaceholder: true
    });
  },

  clearResult() {
    this.setData({
      candidates: [],
      visibleFeatures: [],
      visibleFeaturesText: '',
      uncertainty: ''
    });
  },

  shutter() {
    if (this.data.photo) {
      this.setData({ photo: '' });
      this.clearResult();
      return;
    }
    const ctx = wx.createCameraContext();
    ctx.takePhoto({
      quality: 'high',
      success: res => {
        this.setData({ photo: res.tempImagePath });
        this.clearResult();
      },
      fail: err => wx.showToast({ title: err.errMsg || '拍摄失败', icon: 'none' })
    });
  },

  retake() {
    this.setData({ photo: '' });
    this.clearResult();
  },

  album() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: res => {
        this.setData({ photo: res.tempFiles[0].tempFilePath });
        this.clearResult();
      }
    });
  },

  guidebook() {
    wx.navigateTo({ url: '/pages/guidebook/guidebook' });
  },

  identify() {
    if (this.data.identifying) return;
    if (!this.data.photo) {
      wx.showToast({ title: '请先拍摄或选择图片', icon: 'none' });
      return;
    }
    if (!cloud.available()) {
      wx.showToast({ title: '请先开通云开发环境', icon: 'none' });
      return;
    }

    this.setData({ identifying: true });
    this.clearResult();
    wx.showLoading({ title: '正在识别…', mask: true });

    const cloudPath = `recognition/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    wx.cloud.uploadFile({ cloudPath, filePath: this.data.photo })
      .then(({ fileID }) =>
        cloud.call('identifyInsect', { fileId: fileID }, { timeout: 30000 })
          .finally(() => wx.cloud.deleteFile({ fileList: [fileID] }).catch(() => {}))
      )
      .then(result => {
        const visibleFeatures = result.visibleFeatures || [];
        const candidates = result.candidates || [];
        this.setData({
          candidates,
          visibleFeatures,
          visibleFeaturesText: visibleFeatures.join('、'),
          uncertainty: result.uncertainty || ''
        });
        // 识别成功但没有候选时也要给用户一个明确结果，不能静默结束
        wx.showToast({
          title: candidates.length ? `找到 ${candidates.length} 个候选` : '没有匹配的候选，可翻图鉴对照',
          icon: 'none'
        });
      })
      .catch(error => wx.showToast({ title: error.message || '识别失败', icon: 'none' }))
      .finally(() => {
        wx.hideLoading();
        this.setData({ identifying: false });
      });
  },

  // 点候选结果直接跳到对应的图鉴详情
  openCandidate(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.navigateTo({ url: '/pages/guidebook/guidebook' });
      return;
    }
    wx.navigateTo({ url: `/pages/insect-detail/insect-detail?id=${id}` });
  },

  record() {
    wx.navigateTo({ url: '/pages/guide/guide?type=unknown' });
  },

  danger() {
    wx.navigateTo({ url: '/pages/danger/danger?source=camera' });
  }
});
