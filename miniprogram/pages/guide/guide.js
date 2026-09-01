const store = require('../../utils/store');
const nav = require('../../utils/nav');

const DEFAULT_OPTIONS = [
  { label: '红肿', selected: false }, { label: '瘙痒', selected: false }, { label: '疼痛', selected: false },
  { label: '发热感', selected: false }, { label: '水疱', selected: false }, { label: '出血', selected: false },
  { label: '麻木', selected: false }, { label: '其他', selected: false }
];

Page({
  data: {
    type: 'bite', symptoms: [], options: DEFAULT_OPTIONS,
    ranges: ['1 处', '2–5 处', '多处 / 成片'], trends: ['正在减轻', '基本不变', '逐渐加重'],
    range: '1 处', trend: '基本不变', photo: ''
  },
  onLoad(query) {
    const type = query.type || 'bite';
    const draft = store.get('safetyDraft', {});
    const restored = draft.contactType === type && draft.step >= 3 ? draft : {};
    const symptoms = Array.isArray(restored.symptoms) ? restored.symptoms : [];
    const options = DEFAULT_OPTIONS.map(item => ({ ...item, selected: symptoms.includes(item.label) }));
    this.setData({
      type, symptoms, options,
      range: restored.range || '1 处', trend: restored.trend || '基本不变', photo: restored.photo || ''
    });
  },
  onUnload() { this.persist(false); },
  back() { nav.back(); },
  persist(showToast) {
    const previous = store.get('safetyDraft', {});
    store.set('safetyDraft', {
      ...previous, step: 3, contactType: this.data.type, symptoms: this.data.symptoms,
      range: this.data.range, trend: this.data.trend, photo: this.data.photo
    });
    if (showToast) wx.showToast({ title: '草稿已保存' });
  },
  toggle(event) {
    const value = event.currentTarget.dataset.value;
    const symptoms = [...this.data.symptoms];
    const index = symptoms.indexOf(value);
    if (index >= 0) symptoms.splice(index, 1); else symptoms.push(value);
    const options = this.data.options.map(item => ({ ...item, selected: symptoms.includes(item.label) }));
    this.setData({ symptoms, options }, () => this.persist(false));
  },
  setRange(event) { this.setData({ range: event.currentTarget.dataset.value }, () => this.persist(false)); },
  setTrend(event) { this.setData({ trend: event.currentTarget.dataset.value }, () => this.persist(false)); },
  addPhoto() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: result => {
      this.setData({ photo: result.tempFiles[0].tempFilePath }, () => this.persist(false));
    } });
  },
  save() { this.persist(true); },
  next() {
    if (!this.data.symptoms.length) {
      wx.showToast({ title: '请至少选择一项当前表现', icon: 'none' });
      return;
    }
    const needsConsult = this.data.trend === '逐渐加重'
      || this.data.range === '多处 / 成片'
      || this.data.symptoms.some(value => ['发热感', '水疱', '出血', '麻木'].includes(value));
    const level = needsConsult ? 'consult' : 'observe';
    this.persist(false);
    const draft = store.get('safetyDraft', {});
    store.set('safetyDraft', { ...draft, step: 4, level });
    wx.navigateTo({ url: `/pages/result/result?level=${level}` });
  }
});
