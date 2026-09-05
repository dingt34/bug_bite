const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const flow = require('../../utils/safety-flow');

Page({
  data: {
    photo: '', error: '', flash: 'auto', identifying: false,
    candidates: [], visibleFeatures: [], visibleFeaturesText: '', uncertainty: '', usePlaceholder: false
  },
  onLoad() {
    try { this.setData({ usePlaceholder: wx.getSystemInfoSync().platform === 'devtools' }); }
    catch (_) { this.setData({ usePlaceholder: false }); }
  },
  onShow() { nav.syncTab(this, 2); },
  home() { wx.switchTab({ url: '/pages/home/home' }); },
  error(event) { this.setData({ error: event.detail.errMsg || '无法使用摄像头', usePlaceholder: true }); },
  clearResult() { this.setData({ candidates: [], visibleFeatures: [], visibleFeaturesText: '', uncertainty: '' }); },
  shutter() {
    if (this.data.photo) { this.retake(); return; }
    let context;
    try { context = wx.createCameraContext(); } catch (_) { wx.showToast({ title: '摄像头暂不可用，请从相册选择', icon: 'none' }); return; }
    context.takePhoto({
      quality: 'high',
      success: result => {
        if (!result || !result.tempImagePath) { wx.showToast({ title: '未获得照片，请重试', icon: 'none' }); return; }
        this.setData({ photo: result.tempImagePath, error: '' }); this.clearResult();
      },
      fail: error => wx.showToast({ title: error.errMsg || '拍摄失败', icon: 'none' })
    });
  },
  retake() { this.setData({ photo: '', error: '' }); this.clearResult(); },
  album() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'],
      success: result => {
        const file = result && result.tempFiles && result.tempFiles[0];
        if (!file || !file.tempFilePath) { wx.showToast({ title: '未选择有效图片', icon: 'none' }); return; }
        this.setData({ photo: file.tempFilePath, error: '' }); this.clearResult();
      },
      fail: error => { if (!/cancel/i.test(error.errMsg || '')) wx.showToast({ title: '相册打开失败，请重试', icon: 'none' }); }
    });
  },
  guidebook() { wx.navigateTo({ url: '/pages/guidebook/guidebook' }); },
  identify() {
    if (this.data.identifying) return;
    if (!this.data.photo) { wx.showToast({ title: '请先拍摄或选择图片', icon: 'none' }); return; }
    if (!cloud.available()) { wx.showToast({ title: '请先开通云开发环境', icon: 'none' }); return; }
    this.setData({ identifying: true }); this.clearResult(); wx.showLoading({ title: '正在识别…', mask: true });
    const cloudPath = `recognition/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    wx.cloud.uploadFile({ cloudPath, filePath: this.data.photo })
      .then(({ fileID }) => cloud.call('identifyInsect', { fileId: fileID }, { timeout: 35000 })
        .finally(() => wx.cloud.deleteFile({ fileList: [fileID] }).catch(() => {})))
      .then(result => {
        const visibleFeatures = result.visibleFeatures || [], candidates = result.candidates || [];
        this.setData({ candidates, visibleFeatures, visibleFeaturesText: visibleFeatures.join('、'), uncertainty: result.uncertainty || '' });
        wx.showToast({ title: candidates.length ? `找到 ${candidates.length} 个候选` : '没有匹配的候选，可翻图鉴对照', icon: 'none' });
      })
      .catch(error => wx.showToast({ title: error.message || '识别失败', icon: 'none' }))
      .finally(() => { wx.hideLoading(); this.setData({ identifying: false }); });
  },
  startSafetyRecord() {
    const draft = Object.assign(flow.newDraft(), { photo: this.data.photo || '' });
    if (!flow.persist(draft)) return;
    wx.navigateTo({ url: '/pages/danger/danger?source=camera' });
  },
  record() { this.startSafetyRecord(); },
  danger() { this.startSafetyRecord(); }
});
