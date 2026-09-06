const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const flow = require('../../utils/safety-flow');
const species = require('../../utils/species');

Page({
  data: {
    photo: '', error: '', flash: 'auto', identifying: false,
    candidates: [], visibleFeatures: [], visibleFeaturesText: '', uncertainty: '', usePlaceholder: false,
    recognitionResultReady: false, recognitionModalVisible: false,
    recognitionSummary: '', recognitionDisclaimer: '', recognitionStage: ''
  },
  onLoad() {
    try {
      const isDevtools = wx.getSystemInfoSync().platform === 'devtools';
      this.setData({ usePlaceholder: isDevtools });
    } catch (_) { this.setData({ usePlaceholder: false }); }
  },
  onShow() { nav.syncTab(this, 2); },
  onUnload() { if (this.recognitionPollTimer) clearTimeout(this.recognitionPollTimer); },
  home() { wx.switchTab({ url: '/pages/home/home' }); },
  error(event) { this.setData({ error: event.detail.errMsg || '无法使用摄像头', usePlaceholder: true }); },
  clearResult() {
    this.setData({
      candidates: [], visibleFeatures: [], visibleFeaturesText: '', uncertainty: '',
      recognitionResultReady: false, recognitionModalVisible: false,
      recognitionSummary: '', recognitionDisclaimer: ''
    });
  },
  buildRecognitionPresentation(result) {
    const rawCandidates = Array.isArray(result && result.candidates) ? result.candidates.slice(0, 3) : [];
    const visibleFeatures = Array.isArray(result && result.visibleFeatures) ? result.visibleFeatures.filter(Boolean).slice(0, 8) : [];
    const uncertainty = String(result && result.uncertainty || '').trim();
    const disclaimer = String(result && result.disclaimer || '图片分析仅提供候选方向，不用于确诊、病原体判断或安全分级。').trim();
    const candidates = rawCandidates.map((candidate, index) => {
        const detail = species.getById(candidate.objectId);
        const name = candidate.name || (detail && detail.name) || '未命名候选';
        const scientificName = candidate.scientificName || (detail && detail.latin) || '';
        const summary = candidate.summary || (detail && detail.summary) || '';
        const score = Number(candidate.score);
        return Object.assign({}, candidate, {
          rank: index + 1,
          name,
          scientificName,
          summary,
          photo: detail && detail.photo || '',
          scoreText: score > 0 ? `${Math.round(score * 100)}%` : ''
        });
      });

    return {
      candidates,
      visibleFeatures,
      uncertainty,
      summary: candidates.length ? `找到 ${candidates.length} 个候选方向，点击查看图片与分析` : '照片信息不足，点击查看补拍建议',
      disclaimer
    };
  },
  openRecognitionResult() {
    if (this.data.recognitionResultReady) this.setData({ recognitionModalVisible: true });
  },
  closeRecognitionResult() { this.setData({ recognitionModalVisible: false }); },
  noop() {},
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
  identifyThroughCloud() {
    const cloudPath = `recognition/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    let enqueued = false;
    this.setData({ recognitionStage: '正在上传图片…' });
    return wx.cloud.uploadFile({ cloudPath, filePath: this.data.photo })
      .then(({ fileID }) => cloud.call('identifyInsect', { action: 'enqueue', fileId: fileID }, { timeout: 15000 })
        .then(job => {
          if (!job || !job.jobId) throw new Error('云端未返回识别任务编号');
          enqueued = true;
          this.setData({ recognitionStage: '云端排队中…' });
          return this.waitForRecognitionJob(job.jobId, 0);
        })
        .catch(error => {
          if (!enqueued) wx.cloud.deleteFile({ fileList: [fileID] }).catch(() => {});
          throw error;
        }));
  },
  waitForRecognitionJob(jobId, attempt) {
    if (attempt >= 60) return Promise.reject(new Error('CLOUD_TIMEOUT'));
    return cloud.call('identifyInsect', { action: 'status', jobId }, { timeout: 15000 })
      .then(job => {
        if (job.status === 'done' && job.result) return job.result;
        if (job.status === 'failed') throw new Error(job.message || '本机识别失败，请重试');
        this.setData({ recognitionStage: job.status === 'processing' ? 'BioCLIP 2 正在识别…' : '等待识别工作端…' });
        return new Promise(resolve => {
          this.recognitionPollTimer = setTimeout(() => resolve(this.waitForRecognitionJob(jobId, attempt + 1)), 2000);
        });
      });
  },
  identify() {
    if (this.data.identifying) return;
    if (!this.data.photo) { wx.showToast({ title: '请先拍摄或选择图片', icon: 'none' }); return; }
    if (!cloud.available()) { wx.showToast({ title: '请先开通云开发环境', icon: 'none' }); return; }
    this.setData({ identifying: true }); this.clearResult(); wx.showLoading({ title: '正在识别…', mask: true });
    this.identifyThroughCloud()
      .then(result => {
        const presentation = this.buildRecognitionPresentation(result || {});
        this.setData({
          candidates: presentation.candidates,
          visibleFeatures: presentation.visibleFeatures,
          visibleFeaturesText: presentation.visibleFeatures.join('、'),
          uncertainty: presentation.uncertainty,
          recognitionResultReady: true,
          recognitionModalVisible: true,
          recognitionSummary: presentation.summary,
          recognitionDisclaimer: presentation.disclaimer
        });
      })
      .catch(error => {
        const raw = String(error && (error.message || error.errMsg || error.code) || '');
        const title = /云端未返回识别任务编号|UNKNOWN_ACTION|INVALID_ACTION|不支持的识别操作/.test(raw)
          ? '请重新部署识别云函数'
          : (/timeout|超时|CLOUD_TIMEOUT/i.test(raw) ? '分析时间较长，请重试，照片已保留' : (raw || '识别失败'));
        wx.showToast({ title, icon: 'none' });
      })
      .finally(() => { wx.hideLoading(); this.setData({ identifying: false, recognitionStage: '' }); });
  },
  startSafetyRecord() {
    this.setData({ recognitionModalVisible: false });
    const draft = Object.assign(flow.newDraft(), { photo: this.data.photo || '' });
    if (!flow.persist(draft)) return;
    wx.navigateTo({ url: '/pages/danger/danger?source=camera' });
  },
  record() { this.startSafetyRecord(); },
  danger() { this.startSafetyRecord(); }
});
