const store = require('../../utils/store');
const nav = require('../../utils/nav');
const flow = require('../../utils/safety-flow');
const labels = ['红肿', '瘙痒', '疼痛', '发热感', '水疱', '出血', '麻木', '其他', '暂无明显表现'];
Page({
  data: {
    type: 'unknown', typeName: '', symptoms: [], bodyParts: [], bodyPartOptions: [], systemicSymptoms: [], systemicOptions: [], dailyImpact: '', dailyImpactOptions: [], facts: {}, questions: [],
    ranges: ['1 处', '2–5 处', '多处 / 成片', '不确定'],
    trends: ['正在减轻', '基本不变', '逐渐加重', '刚发现 / 不确定'],
    occurredAtOptions: ['不确定', '刚发现', '1 小时内', '今天', '1–3 天前', '4–7 天前', '1–2 周前', '超过 2 周'],
    occurredAt: '', occurredAtIndex: 0, range: '', trend: '', photo: '', photoSaving: false, submitting: false,
    supplementOpen: false, extraQuestions: [], supplementDone: 0, supplementTotal: 6, saveStatus: '内容仅保存在本机'
  },
  onLoad(query = {}) {
    const draft = store.get('safetyDraft', {});
    if (!draft.screened || (draft.dangerSignals || []).length) {
      wx.redirectTo({ url: '/pages/danger/danger' }); return;
    }
    this.sessionId = draft.sessionId;
    const type = flow.normalizeType(query.type || draft.contactType);
    const savedFacts = type === flow.normalizeType(draft.contactType) ? draft.facts || {} : {};
    // 发生时间属于通用事实；无法判断时明确记录为“不确定”，而不是留空。
    const facts = { occurredAt: '不确定', ...savedFacts };
    const symptoms = (draft.symptoms || []).filter(s => labels.includes(s));
    const systemicSymptoms = draft.systemicSymptoms || [];
    const bodyParts = facts.bodyParts || (facts.bodyPart ? [facts.bodyPart] : []);
    this.setData({ type, typeName: flow.typeNames[type], facts, questions: flow.questions(type, facts), extraQuestions: this.extraQuestions(facts, type), symptoms, bodyParts, bodyPartOptions: this.bodyPartOptions(bodyParts), systemicSymptoms,
      options: labels.map(label => ({ label, selected: symptoms.includes(label) })),
      systemicOptions: this.systemicOptions(systemicSymptoms), dailyImpact: facts.dailyImpact || '', dailyImpactOptions: this.dailyImpactOptions(facts.dailyImpact || ''),
      occurredAt: facts.occurredAt, occurredAtIndex: Math.max(0, this.data.occurredAtOptions.indexOf(facts.occurredAt)),
      range: draft.range || '', trend: draft.trend || '', photo: draft.photo || '', supplementDone: this.countSupplement(facts, type, draft) });
  },
  onShow() { this.setData({ submitting: false }); },
  onUnload() { this.persist(false); this.gone = true; },
  back() { nav.back(); },
  persist(showToast) {
    const previous = store.get('safetyDraft', {});
    if (!this.sessionId || previous.sessionId !== this.sessionId) return false;
    const saved = flow.persist({ ...previous, step: Math.max(3, previous.step || 1), contactType: this.data.type,
      symptoms: this.data.symptoms, bodyParts: this.data.bodyParts, systemicSymptoms: this.data.systemicSymptoms, range: this.data.range, trend: this.data.trend,
      facts: this.data.facts, photo: this.data.photo, completedAt: this.edited ? null : previous.completedAt });
    if (!this.gone) this.setData({ saveStatus: saved ? '草稿已保存到本机 · 可离线继续' : '草稿保存失败，请重试' });
    if (saved && showToast) wx.showToast({ title: '草稿已保存' });
    return saved;
  },
  change(values) {
    this.edited = true;
    this.setData(values, () => this.setData({ supplementDone: this.countSupplement(this.data.facts, this.data.type, { photo: this.data.photo }) }, () => this.persist(false)));
  },
  countSupplement(facts = {}, type = this.data.type, draft = {}) {
    const branch = flow.questions(type, facts).filter(question => facts[question.key]).length;
    const generic = ['environment', 'insectSeen', 'actionsTaken'].filter(key => facts[key]).length;
    return Math.min(6, branch + generic + (draft.photo ? 1 : 0));
  },
  toggle(event) {
    const value = event.currentTarget.dataset.value;
    if (!labels.includes(value)) return;
    let symptoms = this.data.symptoms.filter(s => s !== '暂无明显表现');
    if (value === '暂无明显表现') symptoms = this.data.symptoms.includes(value) ? [] : [value];
    else if (symptoms.includes(value)) symptoms = symptoms.filter(s => s !== value);
    else symptoms.push(value);
    this.change({ symptoms, options: labels.map(label => ({ label, selected: symptoms.includes(label) })) });
  },
  bodyPartOptions(selected = []) {
    return ['头皮 / 耳后', '眼周', '口唇 / 口腔', '颈部', '上肢', '下肢', '躯干', '手足', '其他 / 不确定'].map(label => ({ label, selected: selected.includes(label) }));
  },
  toggleBodyPart(event) {
    const value = event.currentTarget.dataset.value;
    let bodyParts = [...this.data.bodyParts];
    if (bodyParts.includes(value)) bodyParts = bodyParts.filter(item => item !== value); else bodyParts.push(value);
    const facts = { ...this.data.facts, bodyParts };
    this.change({ bodyParts, bodyPartOptions: this.bodyPartOptions(bodyParts), facts });
  },
  dailyImpactOptions(selected = '') {
    return ['无影响', '轻微影响', '影响睡眠或活动', '无法正常活动'].map(label => ({ label, selected: label === selected }));
  },
  setDailyImpact(event) {
    const dailyImpact = event.currentTarget.dataset.value;
    const facts = { ...this.data.facts, dailyImpact };
    this.change({ dailyImpact, dailyImpactOptions: this.dailyImpactOptions(dailyImpact), facts });
  },
  systemicOptions(selected = []) {
    const options = ['恶心或呕吐', '头晕或明显乏力', '发热或发冷', '无明显全身不适'];
    return options.map(label => ({ label, selected: selected.includes(label) }));
  },
  toggleSystemic(event) {
    const value = event.currentTarget.dataset.value;
    if (!this.systemicOptions().some(item => item.label === value)) return;
    let systemicSymptoms = this.data.systemicSymptoms.filter(item => item !== '无明显全身不适');
    if (value === '无明显全身不适') systemicSymptoms = this.data.systemicSymptoms.includes(value) ? [] : [value];
    else if (systemicSymptoms.includes(value)) systemicSymptoms = systemicSymptoms.filter(item => item !== value);
    else systemicSymptoms.push(value);
    this.change({ systemicSymptoms, systemicOptions: this.systemicOptions(systemicSymptoms) });
  },
  answer(event) {
    const { key, value } = event.currentTarget.dataset;
    const question = this.data.questions.find(q => q.key === key);
    if (!question || !question.options.some(o => o.value === value)) return;
    const facts = { ...this.data.facts, [key]: value };
    this.change({ facts, questions: flow.questions(this.data.type, facts) });
  },
  extraQuestions(facts = {}, type = this.data.type) {
    const specificKeys = flow.questions(type, facts).map(question => question.key);
    return [
      { key: 'environment', title: '当时的环境', options: ['室内', '草地 / 林地', '近水户外', '不确定'] },
      { key: 'insectSeen', title: '是否看清虫体', options: ['看清了', '没有看到', '不确定'] },
      { key: 'actionsTaken', title: '已做过的处理', options: ['清洁过', '冷敷过', '涂过药或止痒品', '尚未处理'] }
    ].filter(question => !specificKeys.includes(question.key))
      .map(question => ({ ...question, options: question.options.map(value => ({ value, selected: facts[question.key] === value })) }));
  },
  answerExtra(event) {
    const { key, value } = event.currentTarget.dataset;
    const question = this.data.extraQuestions.find(q => q.key === key);
    if (!question || !question.options.some(o => o.value === value)) return;
    const facts = { ...this.data.facts, [key]: value };
    this.change({ facts, extraQuestions: this.extraQuestions(facts) });
  },
  setOccurredAt(event) {
    const index = Number(event.detail.value);
    const occurredAt = this.data.occurredAtOptions[index];
    if (!occurredAt) return;
    const facts = { ...this.data.facts, occurredAt };
    this.change({ occurredAt, occurredAtIndex: index, facts });
  },
  toggleSupplement() { this.setData({ supplementOpen: !this.data.supplementOpen }); },
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
  missingRequired(draft) {
    if (!(draft.symptoms || []).length) return '请选择主要表现';
    if (!draft.range) return '请选择影响范围';
    if (!draft.trend) return '请选择症状变化';
    const facts = draft.facts || {};
    const missingQuestion = flow.questions(draft.contactType, facts).find(question => !facts[question.key]);
    return missingQuestion ? `请完成：${missingQuestion.title}` : '';
  },
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
      wx.showToast({ title: this.missingRequired(draft) || '请补全必填信息', icon: 'none' }); return;
    }
    const result = flow.evaluate(draft);
    if (!flow.persist({ ...draft, ...result, step: 4 })) return;
    this.edited = false;
    this.setData({ submitting: true });
    wx.navigateTo({ url: '/pages/result/result', fail: () => this.setData({ submitting: false }) });
  }
});
