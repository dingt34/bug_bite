const store = require('../../utils/store');
const nav = require('../../utils/nav');

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || '日期待补充';
  const parts = value.split('-');
  return `${Number(parts[1])}月${Number(parts[2])}日`;
}

function countdown(value, currentDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '日期待补充';
  const start = new Date(`${value}T00:00:00`).getTime();
  const base = new Date(`${currentDate}T00:00:00`).getTime();
  const days = Math.round((start - base) / 86400000);
  if (days < 0) return '已结束';
  if (days === 0) return '今天出发';
  if (days === 1) return '明天出发';
  return `还有 ${days} 天`;
}

function completion(plan) {
  const rule = plan.ruleSnapshot || {};
  const total = ['checklist', 'activityTips', 'returnCheck'].reduce((sum, key) => sum + (Array.isArray(rule[key]) ? rule[key].length : 0), 0);
  const state = plan.checklistState || {};
  const done = Object.keys(state).filter(key => state[key]).length;
  return { total, done: Math.min(done, total) };
}

function normalizePlan(plan, currentDate) {
  const startDate = plan.startDate || plan.dateValue || '';
  const counts = completion(plan);
  return Object.assign({}, plan, {
    displayTitle: plan.destinationName || plan.destination || plan.title || '未命名行程',
    displayDate: formatDate(startDate),
    displayActivity: plan.activityType || plan.activity || plan.type || '户外活动',
    countdown: countdown(startDate, currentDate),
    isHistory: Boolean(startDate && startDate < currentDate),
    progressText: counts.total ? `${counts.done}/${counts.total} 项已完成` : '查看行前清单'
  });
}

function normalizeDraft(draft) {
  if (!draft || !Object.keys(draft).length) return null;
  if (!draft.destination && !draft.dateValue && !draft.activity) return null;
  return {
    displayTitle: draft.destination || '目的地待补充',
    displayDate: formatDate(draft.dateValue),
    displayActivity: draft.activity || '活动待补充'
  };
}

Page({
  data: { tabs: ['近期', '历史', '草稿'], tab: '近期', planCount: 0, visiblePlans: [], draft: null, offlineCard: null },

  onShow() {
    const currentDate = today();
    const plans = store.get('plans', []).filter(item => item && item.id).map(item => normalizePlan(item, currentDate));
    plans.sort((left, right) => String(left.startDate || left.dateValue || '').localeCompare(String(right.startDate || right.dateValue || '')));
    const offline = store.get('offlineCard', null);
    const offlineCard = offline && offline.plan ? Object.assign({}, normalizePlan(offline.plan, currentDate), { cachedText: offline.cachedAtTimestamp ? '已保存，可在无网络时查看' : '可离线查看' }) : null;
    this.allPlans = plans;
    this.setData({ planCount: plans.length, draft: normalizeDraft(store.get('precheckDraft', null)), offlineCard }, () => this.updateVisible());
  },

  updateVisible() {
    const tab = this.data.tab;
    const visiblePlans = tab === '近期' ? this.allPlans.filter(item => !item.isHistory) : tab === '历史' ? this.allPlans.filter(item => item.isHistory) : [];
    this.setData({ visiblePlans });
  },

  back() { nav.back(); },
  setTab(event) { this.setData({ tab: event.currentTarget.dataset.tab }, () => this.updateVisible()); },
  open(event) { wx.navigateTo({ url: `/pages/precheck-result/precheck-result?planId=${encodeURIComponent(event.currentTarget.dataset.id)}` }); },
  openOffline() { wx.navigateTo({ url: '/pages/precheck-result/precheck-result?source=offline' }); },
  openDraft() { wx.navigateTo({ url: '/pages/precheck/precheck' }); },
  create() { wx.navigateTo({ url: '/pages/precheck/precheck' }); }
});

module.exports = { normalizePlan, normalizeDraft, countdown };
