const store = require('../../utils/store');
const nav = require('../../utils/nav');
const flow = require('../../utils/safety-flow');
const labels = ['红肿', '瘙痒', '疼痛', '发热感', '水疱', '出血', '麻木', '其他', '暂无明显表现'];
Page({
  data: {
    type: 'unknown', typeName: '', symptoms: [], options: [], facts: {}, questions: [],
    ranges: ['1 处', '2–5 处', '多处 / 成片', '不确定'],
    trends: ['正在减轻', '基本不变', '逐渐加重', '刚发现 / 不确定'],
    range: '', trend: '', photo: '', photoSaving: false, submitting: false, saveStatus: '内容仅保存在本机'
  },
  onLoad(query = {}) {
    const draft = store.get('safetyDraft', {});
    if (!draft.screened || (draft.dangerSignals || []).length) {
      wx.redirectTo({ url: '/pages/danger/danger' }); return;
    }
    this.sessionId = draft.sessionId;
    const type = flow.normalizeType(query.type || draft.contactType);
    const facts = type === flow.normalizeType(draft.contactType) ? draft.facts || {} : {};
    const symptoms = (draft.symptoms || []).filter(s => labels.includes(s));
    this.setData({ type, typeName: flow.typeNames[type], facts, questions: flow.questions(type, facts), symptoms,
      options: labels.map(label => ({ label, selected: symptoms.includes(label) })),
      range: draft.range || '', trend: draft.trend || '', photo: draft.photo || '' });
  },
  onShow() { this.setData({ submitting: false }); },
  onUnload() { this.persist(false); this.gone = true; },
  back() { nav.back(); },
  persist(showToast) {
    const previous = store.get('safetyDraft', {});
    if (!this.sessionId || previous.sessionId !== this.sessionId) return false;
    const saved = flow.persist({ ...previous, step: Math.max(3, previous.step || 1), contactType: this.data.type,
      symptoms: this.data.symptoms, range: this.data.range, trend: this.data.trend,
      facts: this.data.facts, photo: this.data.photo, completedAt: this.edited ? null : previous.completedAt });
    if (!this.gone) this.setData({ saveStatus: saved ? '草稿已保存到本机 · 可离线继续' : '草稿保存失败，请重试' });
    if (saved && showToast) wx.showToast({ title: '草稿已保存' });
    return saved;
  },
  change(values) { this.edited = true; this.setData(values, () => this.persist(false)); },
  toggle(event) {
    const value = event.currentTarget.dataset.value;
    if (!labels.includes(value)) return;
    let symptoms = this.data.symptoms.filter(s => s !== '暂无明显表现');
    if (value === '暂无明显表现') symptoms = this.data.symptoms.includes(value) ? [] : [value];
    else if (symptoms.includes(value)) symptoms = symptoms.filter(s => s !== value);
    else symptoms.push(value);
    this.change({ symptoms, options: labels.map(label => ({ label, selected: symptoms.includes(label) })) });
  },
  answer(event) {
    const { key, value } = event.currentTarget.dataset;
    const question = this.data.questions.find(q => q.key === key);
    if (!question || !question.options.some(o => o.value === value)) return;
    const facts = { ...this.data.facts, [key]: value };
    this.change({ facts, questions: flow.questions(this.data.type, facts) });
  },
  setRange(event) { if (this.data.ranges.includes(event.currentTarget.dataset.value)) this.change({ range: event.currentTarget.dataset.value }); },
  setTrend(event) { if (this.data.trends.includes(event.currentTarget.dataset.value)) this.change({ trend: event.currentTarget.dataset.value }); },
  addPhoto() {
    if (this.data.photoSaving) return;
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: result => {
      if (this.gone || !result.tempFiles[0]) return;
      this.setData({ photoSaving: true });
      wx.saveFile({ tempFilePath: result.tempFiles[0].tempFilePath,
        success: saved => { if (!this.gone) this.change({ photo: saved.savedFilePath }); },
        fail: () => wx.showToast({ title: '照片未保存，可不添加照片继续', icon: 'none' }),
        complete: () => { if (!this.gone) this.setData({ photoSaving: false }); }
      });
    }, fail: error => {
      if (!/cancel/.test(error.errMsg || '')) wx.showToast({ title: '未获得照片，可继续填写', icon: 'none' });
    } });
  },
  removePhoto() { this.change({ photo: '' }); },
  save() { this.persist(true); },
  emergency() {
    this.persist(false);
    const draft = store.get('safetyDraft', {});
    flow.persist({ ...draft, dangerSignals: ['reported'], level: 'emergency', step: 4 });
    this.edited = false;
    wx.redirectTo({ url: '/pages/result/result?level=emergency&from=guide' });
  },
  next() {
    if (this.data.submitting || !this.persist(false)) return;
    const draft = store.get('safetyDraft', {});
    if (!flow.complete(draft)) {
      wx.showToast({ title: '请补全表现、范围、变化和分支问题', icon: 'none' }); return;
    }
    const result = flow.evaluate(draft);
    if (!flow.persist({ ...draft, ...result, step: 4 })) return;
    this.edited = false;
    this.setData({ submitting: true });
    wx.navigateTo({ url: '/pages/result/result', fail: () => this.setData({ submitting: false }) });
  }
});
