const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const records = require('../../utils/event-records');
const mediaStorage = require('../../utils/media-storage');

const DEFAULT_CHOICES = ['红肿', '瘙痒', '疼痛', '发热感', '水疱', '麻木', '其他'];
const SYSTEMIC_CHOICES = ['头晕', '恶心', '全身乏力'];
const MEASURE_CHOICES = ['清洁', '冷敷', '避免抓挠', '标记边界'];

Page({
  data: {
    id: '', event: {}, reviewNumber: 1, elapsedText: '', trends: ['明显减轻', '基本不变', '逐渐加重', '不确定'],
    ranges: ['缩小', '不变', '扩大', '不确定'], trend: '', symptoms: [], symptomChoices: [],
    otherSelected: false, customSymptomText: '',
    systemicSymptoms: [], systemicChoices: [], measures: [], measureChoices: [], range: '', photo: '', photoFileId: '', saving: false,
    previousSystemicText: '', previousMeasuresText: ''
  },

  onLoad(query) {
    const id = query.id || '';
    const source = store.get('events', []).find(item => item.id === id);
    if (!source) { wx.showToast({ title: '事件记录不存在', icon: 'none' }); nav.back(); return; }
    const event = records.normalizeEvent(source);
    const drafts = store.get('reviewDrafts', {});
    const draft = drafts[id] || {};
    const rawSymptoms = draft.symptoms || event.symptoms || [];
    const inheritedCustom = rawSymptoms.filter(item => DEFAULT_CHOICES.indexOf(item) < 0).join('、');
    const customSymptomText = draft.customSymptomText || inheritedCustom;
    const otherSelected = Boolean(draft.otherSelected || customSymptomText || rawSymptoms.indexOf('其他') >= 0);
    const symptoms = rawSymptoms.filter(item => DEFAULT_CHOICES.indexOf(item) >= 0 && item !== '其他');
    if (otherSelected) symptoms.push('其他');
    const systemicSymptoms = draft.systemicSymptoms || [];
    const measures = draft.measures || [];
    this.setData({
      id, event, reviewNumber: (event.recoveryLogs || []).length + 1, elapsedText: records.formatElapsed(event.createdAtTimestamp),
      trend: draft.trend || '', range: draft.range || '', symptoms,
      otherSelected, customSymptomText,
      symptomChoices: DEFAULT_CHOICES.map(label => ({ label, selected: symptoms.indexOf(label) >= 0 })),
      systemicSymptoms,
      systemicChoices: SYSTEMIC_CHOICES.map(label => ({ label, selected: systemicSymptoms.indexOf(label) >= 0 })),
      measures,
      measureChoices: MEASURE_CHOICES.map(label => ({ label, selected: measures.indexOf(label) >= 0 })),
      photo: draft.photo || '', photoFileId: draft.photoFileId || '',
      previousSystemicText: event.systemicText, previousMeasuresText: event.measuresText
    });
  },

  onHide() { if (!this.reviewSaved && this.data.id) this.saveDraft(false); },
  onUnload() { if (!this.reviewSaved && this.data.id) this.saveDraft(false); },
  back() { this.saveDraft(false); this.reviewSaved = true; nav.back(); },
  setTrend(e) { this.setData({ trend: e.currentTarget.dataset.value }); },
  setRange(e) { this.setData({ range: e.currentTarget.dataset.value }); },

  toggleSymptom(e) {
    const value = e.currentTarget.dataset.value;
    const symptoms = this.data.symptoms.slice();
    const index = symptoms.indexOf(value);
    const selected = index < 0;
    if (index >= 0) symptoms.splice(index, 1); else symptoms.push(value);
    const update = {
      symptoms,
      symptomChoices: this.data.symptomChoices.map(item => Object.assign({}, item, { selected: symptoms.indexOf(item.label) >= 0 }))
    };
    if (value === '其他') {
      update.otherSelected = selected;
      if (!selected) update.customSymptomText = '';
    }
    this.setData(update);
  },

  onCustomSymptomInput(e) { this.setData({ customSymptomText: e.detail.value }); },

  toggleSystemic(e) {
    const value = e.currentTarget.dataset.value;
    const systemicSymptoms = this.data.systemicSymptoms.slice();
    const index = systemicSymptoms.indexOf(value);
    if (index >= 0) systemicSymptoms.splice(index, 1); else systemicSymptoms.push(value);
    this.setData({
      systemicSymptoms,
      systemicChoices: this.data.systemicChoices.map(item => Object.assign({}, item, { selected: systemicSymptoms.indexOf(item.label) >= 0 }))
    });
  },

  toggleMeasure(e) {
    const value = e.currentTarget.dataset.value;
    const measures = this.data.measures.slice();
    const index = measures.indexOf(value);
    if (index >= 0) measures.splice(index, 1); else measures.push(value);
    this.setData({
      measures,
      measureChoices: this.data.measureChoices.map(item => Object.assign({}, item, { selected: measures.indexOf(item.label) >= 0 }))
    });
  },

  choosePhoto() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: result => {
      const photo = result.tempFiles && result.tempFiles[0] && result.tempFiles[0].tempFilePath;
      if (photo) mediaStorage.persistImage(wx, photo, `events/${this.data.id}/reviews`).then(image => this.setData({ photo: image.localPath, photoFileId: image.cloudFileId }));
    } });
  },

  removePhoto() { this.setData({ photo: '', photoFileId: '' }); },

  saveDraft(showFeedback = true) {
    const drafts = store.get('reviewDrafts', {});
    drafts[this.data.id] = { trend: this.data.trend, range: this.data.range, symptoms: this.data.symptoms, otherSelected: this.data.otherSelected, customSymptomText: this.data.customSymptomText, systemicSymptoms: this.data.systemicSymptoms, measures: this.data.measures, photo: this.data.photo, photoFileId: this.data.photoFileId };
    store.set('reviewDrafts', drafts);
    if (showFeedback !== false) wx.showToast({ title: '复查草稿已保存', icon: 'success' });
  },

  goDanger() { wx.navigateTo({ url: '/pages/danger/danger?source=review' }); },

  save() {
    if (this.data.saving) return;
    if (!this.data.trend || !this.data.range) {
      wx.showToast({ title: '请选择变化趋势和范围变化', icon: 'none' });
      return;
    }
    const customSymptomText = (this.data.customSymptomText || '').trim();
    if (this.data.otherSelected && !customSymptomText) {
      wx.showToast({ title: '请填写其他表现的描述', icon: 'none' });
      return;
    }
    const symptoms = this.data.symptoms.filter(item => item !== '其他');
    if (this.data.otherSelected) symptoms.push(customSymptomText.slice(0, 100));
    this.setData({ saving: true });
    const now = Date.now();
    const review = {
      id: store.id('review'), trend: this.data.trend, range: this.data.range,
      symptoms, systemicSymptoms: this.data.systemicSymptoms,
      measures: this.data.measures, imageRefs: this.data.photo ? [this.data.photo] : [],
      imageFileIds: this.data.photoFileId ? [this.data.photoFileId] : []
    };
    const updated = records.applyReview(this.data.event, review, now);
    const list = store.get('events', []);
    const index = list.findIndex(item => item.id === this.data.id);
    if (index >= 0) list[index] = updated;
    store.set('events', list);
    const drafts = store.get('reviewDrafts', {});
    delete drafts[this.data.id];
    store.set('reviewDrafts', drafts);
    this.reviewSaved = true;

    if (updated.status === '待复查' && updated.nextReviewAtTimestamp) {
      cloud.background('reminder', { action: 'create', eventId: updated.id, dueAt: new Date(updated.nextReviewAtTimestamp).toISOString(), title: `${updated.type}复查提醒` });
    }

    const syncTasks = [
      cloud.background('userData', { action: 'upsert', type: 'event', clientId: updated.id, record: records.toCloudRecord(updated) }),
      cloud.background('userData', { action: 'upsert', type: 'review', clientId: review.id, record: {
        eventClientId: updated.id, trend: review.trend, range: review.range, symptoms: review.symptoms,
        systemicSymptoms: review.systemicSymptoms, measures: review.measures,
        imageFileIds: review.imageFileIds, resultLevel: updated.riskLevel, recordedAtTimestamp: now,
        nextReviewAtTimestamp: updated.nextReviewAtTimestamp
      } })
    ];
    Promise.all(syncTasks).then(() => {
      const title = updated.riskLevel === 'emergency' ? '已保存，请立即进行安全判断' : updated.riskLevel === 'consult' ? '已保存，建议尽快咨询' : '复查已保存';
      wx.showToast({ title, icon: 'none' });
      setTimeout(() => wx.navigateBack(), 500);
    }).then(() => this.setData({ saving: false }));
  }
});
