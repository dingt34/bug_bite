const store = require('../../utils/store');
const nav = require('../../utils/nav');
const flow = require('../../utils/safety-flow');
// 通用行动措辞参考 NHS /conditions/insect-bites-and-stings/；
// 复查时间仅是本地记录计划，不是医疗等待时限，也不表示已订阅通知。
const copy = {
  emergency: { title: '紧急求助', sub: '报告了危险信号，请立即行动', color: '#EA4038', action: '立即拨打 120，不要等待填写或拍照。' },
  consult: { title: '尽快咨询', sub: '以下表现需要专业评估', color: '#B86D09', action: '尽快联系医疗机构，带上本次变化记录。' },
  observe: { title: '观察记录', sub: '本次填写未触发咨询或紧急规则', color: '#2F7D5B', action: '记录当前表现，持续留意是否加重或出现新症状。' }
};
Page({
  data: { level: 'observe', info: copy.observe, eventId: '', rules: [], steps: [], saved: false, reviewLabel: '', primaryActionLabel: '', allowStepBack: true },
  onLoad(query = {}) {
    let draft = store.get('safetyDraft', {}) || {};
    // URL 只能提升到紧急级别，不能降低依据当前事实算出的级别。
    if (query.level === 'emergency') {
      if (query.from !== 'guide') draft = flow.newDraft();
      draft = { ...draft, dangerSignals: (draft.dangerSignals || []).length ? draft.dangerSignals : ['reported'] };
    }
    if (!(draft.dangerSignals || []).length && !flow.complete(draft)) {
      wx.redirectTo({ url: '/pages/danger/danger' }); return;
    }
    const result = flow.evaluate(draft);
    this.draft = { ...draft, ...result, step: 4 };
    const type = flow.normalizeType(draft.contactType);
    const steps = result.level === 'emergency' ? [] : [
      { title: type === 'attached' ? '先关注附着状态' : '清洁接触处', detail: type === 'attached' ? '仍附着、疑似残留或不确定时，请联系专业人员处理。' : '用清水和温和清洁用品清洁，避免抓挠。' },
      { title: '记录变化', detail: '记下发生时间、部位、范围与变化；照片选填，不用于确诊。' },
      { title: result.level === 'consult' ? '整理就医信息' : '持续留意新表现', detail: result.level === 'consult' ? '可复制下方摘要，向专业人员说明事实。' : '出现加重或新的不适时，及时重新判断，不必等到复查时间。' }
    ];
    this.setData({ level: result.level, info: copy[result.level], rules: result.matchedRules, steps,
      allowStepBack: result.level !== 'emergency',
      primaryActionLabel: result.level === 'emergency' ? '立即拨打 120' : result.level === 'consult' ? '复制就医沟通摘要' : '查看本次事件记录' });
    this.saveEvent();
  },
  back() { if (this.data.level === 'emergency') this.home(); else nav.back(); },
  saveEvent() {
    const draft = this.draft;
    if (!draft) return false;
    try {
      const events = store.get('events', []);
      const index = events.findIndex(item => item.id === draft.eventId || (draft.sessionId && item.sessionId === draft.sessionId));
      const previous = index >= 0 ? events[index] : {};
      const now = Date.now();
      const reviewDelay = this.data.level === 'observe' ? 2 * 3600000 : this.data.level === 'consult' ? 30 * 60000 : 0;
      const previousReviewAt = Number(previous.nextReviewAtTimestamp || previous.nextReviewAt) || 0;
      const nextReviewAt = reviewDelay ? (previousReviewAt > now ? previousReviewAt : now + reviewDelay) : null;
      const event = { ...previous, id: previous.id || store.id('event'), sessionId: draft.sessionId,
        type: flow.typeNames[flow.normalizeType(draft.contactType)], contactType: draft.contactType || 'unknown',
        level: flow.levelNames[this.data.level], riskLevel: this.data.level, place: previous.place || (draft.facts || {}).environment || '待补充',
        body: (draft.facts || {}).bodyPart || previous.body || '待补充', symptoms: draft.symptoms || [],
        range: draft.range || '', trend: draft.trend || '待观察', facts: draft.facts || {}, photo: draft.photo || '',
        dangerSignals: draft.dangerSignals || [], matchedRules: draft.matchedRules, ruleVersion: draft.ruleVersion,
        createdAt: previous.createdAt || flow.stamp(now), createdAtMs: previous.createdAtMs || now,
        createdAtTimestamp: previous.createdAtTimestamp || previous.createdAtMs || now, updatedAt: now,
        nextReviewAt, nextReviewAtTimestamp: nextReviewAt || 0,
        reviewAt: nextReviewAt ? flow.stamp(nextReviewAt) : '请及时求助',
        status: this.data.level === 'emergency' ? '待求助' : '待复查', syncStatus: 'local' };
      if (index >= 0) events[index] = event; else events.unshift(event);
      store.set('events', events);
      this.draft = { ...draft, eventId: event.id, completedAt: now };
      store.set('safetyDraft', this.draft);
      this.setData({ saved: true, eventId: event.id, reviewLabel: event.reviewAt });
      return true;
    } catch (_) {
      this.setData({ saved: false });
      wx.showToast({ title: '记录保存失败，不影响查看建议或求助', icon: 'none' }); return false;
    }
  },
  call() { wx.makePhoneCall({ phoneNumber: '120' }); },
  copySummary() {
    const draft = this.draft || {}, facts = draft.facts || {};
    const details = flow.questions(draft.contactType, facts).map(q => q.title + '：' + (facts[q.key] || '未填写'));
    const summary = [ '接触类型：' + flow.typeNames[flow.normalizeType(draft.contactType)],
      '当前表现：' + ((draft.symptoms || []).join('、') || '未填写'),
      '影响范围：' + (draft.range || '未填写'), '变化趋势：' + (draft.trend || '未填写'), ...details,
      '安全分流：' + flow.levelNames[this.data.level], '仅为事实记录与安全分流，不构成诊断。' ].join('\n');
    wx.setClipboardData({ data: summary });
  },
  primaryAction() {
    if (this.data.level === 'emergency') return this.call();
    if (this.data.level === 'consult') return this.copySummary();
    this.events();
  },
  adjustReview() {
    if (!this.data.saved || this.data.level !== 'observe') return;
    wx.showActionSheet({ itemList: ['1 小时后记录', '2 小时后记录', '4 小时后记录'], success: result => {
      const hours = [1, 2, 4][result.tapIndex];
      if (!hours) return;
      const events = store.get('events', []), item = events.find(e => e.id === this.data.eventId);
      if (!item) return;
      item.nextReviewAt = Date.now() + hours * 3600000;
      item.nextReviewAtTimestamp = item.nextReviewAt;
      item.reviewAt = flow.stamp(item.nextReviewAt);
      try { store.set('events', events); this.setData({ reviewLabel: item.reviewAt }); }
      catch (_) { wx.showToast({ title: '复查时间未保存，请重试', icon: 'none' }); }
    } });
  },
  emergency() { wx.navigateTo({ url: '/pages/danger/danger' }); },
  modifyAnswers() {
    if (!this.data.allowStepBack) return;
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route === 'pages/guide/guide') wx.navigateBack();
    else wx.redirectTo({ url: '/pages/guide/guide?type=' + flow.normalizeType(this.draft.contactType) });
  },
  home() { wx.switchTab({ url: '/pages/home/home' }); },
  events() {
    if (!this.data.saved && !this.saveEvent()) return;
    wx.navigateTo({ url: '/pages/event-detail/event-detail?id=' + this.data.eventId });
  }
});
