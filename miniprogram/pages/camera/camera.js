const nav = require('../../utils/nav');
const flow = require('../../utils/safety-flow');
const species = require('../../utils/species');

const LOCAL_RECOGNITION_URL = 'http://127.0.0.1:8000';
const LOCAL_RECOGNITION_KEY = 'local-bioclip-deployment-key';

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
  requestLocal(options) {
    return new Promise((resolve, reject) => {
      wx.request(Object.assign({}, options, {
        success: response => {
          if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data || {});
          else reject(new Error(response.data && response.data.detail || `本机识别服务返回 ${response.statusCode}`));
        },
        fail: error => reject(new Error(error && error.errMsg || '无法连接本机识别服务'))
      }));
    });
  },
  readPhotoBase64() {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: this.data.photo,
        encoding: 'base64',
        success: result => resolve(result.data),
        fail: error => reject(new Error(error && error.errMsg || '无法读取所选图片'))
      });
    });
  },
  identifyLocally() {
    this.setData({ recognitionStage: '正在连接本机模型…' });
    return this.requestLocal({ url: `${LOCAL_RECOGNITION_URL}/health`, method: 'GET', timeout: 8000 })
      .then(health => {
        if (!health.ready) throw new Error(health.error || '本机模型尚未就绪');
        this.setData({ recognitionStage: '正在读取图片…' });
        return this.readPhotoBase64();
      })
      .then(imageBase64 => {
        this.setData({ recognitionStage: 'BioCLIP 2 正在识别…' });
        return this.requestLocal({
          url: `${LOCAL_RECOGNITION_URL}/v1/identify`,
          method: 'POST',
          timeout: 120000,
          header: {
            Authorization: `Bearer ${LOCAL_RECOGNITION_KEY}`,
            'content-type': 'application/json'
          },
          data: { imageBase64 }
        });
      });
  },
  identify() {
    if (this.data.identifying) return;
    if (!this.data.photo) { wx.showToast({ title: '请先拍摄或选择图片', icon: 'none' }); return; }
    this.setData({ identifying: true }); this.clearResult(); wx.showLoading({ title: '正在识别…', mask: true });
    this.identifyLocally()
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
        const offline = /request:fail|无法连接|ECONNREFUSED|本机模型尚未就绪/i.test(raw);
        if (offline) {
          wx.showModal({
            title: '本机模型未启动',
            content: '请在电脑运行 start-local-demo.ps1，看到 ready=true 后再试。当前图片不会上传云端。',
            showCancel: false
          });
          return;
        }
        const title = /timeout|超时/i.test(raw) ? '本机分析时间较长，请重试' : (raw || '识别失败');
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
