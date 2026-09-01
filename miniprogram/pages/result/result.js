const store = require('../../utils/store');
const nav = require('../../utils/nav');

const copy = {
  emergency: { title: '紧急求助', sub: '已发现危险信号', color: '#EA4038' },
  consult: { title: '尽快咨询', sub: '症状正在加重或需要专业评估', color: '#EA8B18' },
  observe: { title: '观察记录', sub: '当前未发现高危信号', color: '#E99A1A' }
};

const typeNames = { bite: '叮咬', sting: '蜇伤', attached: '附着虫体', contact: '接触刺激', unknown: '不确定接触' };

Page({
  data: { level: 'observe', info: copy.observe, eventId: '', primaryActionLabel: '保存并查看事件记录', allowStepBack: true },
  onLoad(query) {
    const level = copy[query.level] ? query.level : 'observe';
    this.setData({
      level, info: copy[level],
      primaryActionLabel: level === 'emergency' ? '立即拨打 120' : (level === 'consult' ? '复制就医沟通摘要' : '保存并查看事件记录'),
      allowStepBack: level !== 'emergency'
    });
    this.saveEvent(level);
  },
  back() { nav.back(); },
  saveEvent(level) {
    const draft = store.get('safetyDraft', {});
    const events = store.get('events', []);
    if (draft.eventId && events.some(item => item.id === draft.eventId)) {
      this.setData({ eventId: draft.eventId });
      return;
    }
    const event = {
      id: store.id('event'), type: typeNames[draft.contactType] || '不确定接触', level: copy[level].title,
      place: '待补充', body: '待补充', symptoms: draft.symptoms || [], trend: draft.trend || '待观察',
      createdAt: '刚刚', reviewAt: level === 'observe' ? '2 小时后' : '尽快', status: '待复查'
    };
    events.unshift(event);
    store.set('events', events);
    store.set('safetyDraft', { ...draft, eventId: event.id, level });
    this.setData({ eventId: event.id });
  },
  call() { wx.makePhoneCall({ phoneNumber: '120' }); },
  copySummary() {
    const draft = store.get('safetyDraft', {});
    const summary = [
      '接触类型：' + (typeNames[draft.contactType] || '不确定'),
      '当前表现：' + ((draft.symptoms || []).join('、') || '待补充'),
      '影响范围：' + (draft.range || '待补充'),
      '变化趋势：' + (draft.trend || '待补充'),
      '安全分流：' + copy[this.data.level].title
    ].join('\n');
    wx.setClipboardData({ data: summary, success: () => wx.showToast({ title: '摘要已复制' }) });
  },
  primaryAction() {
    if (this.data.level === 'emergency') return this.call();
    if (this.data.level === 'consult') return this.copySummary();
    this.events();
  },
  modifyAnswers() { if (this.data.allowStepBack) wx.navigateBack({ delta: 1 }); },
  home() { wx.switchTab({ url: '/pages/home/home' }); },
  events() { wx.navigateTo({ url: '/pages/events/events' }); }
});
