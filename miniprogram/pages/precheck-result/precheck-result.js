const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const precheck = require('../../utils/precheck');

function normalizeRule(plan) {
  if (plan.ruleSnapshot && Array.isArray(plan.ruleSnapshot.checklist) && Array.isArray(plan.ruleSnapshot.knowledgeMatches)) return plan.ruleSnapshot;
  return precheck.evaluatePlan({ regionCodes: plan.regionCodes || (plan.regionCode ? [plan.regionCode] : []), month: plan.month, activityType: plan.activityType || plan.activity, habitatTags: plan.habitatTags || plan.environment || [], overnight: plan.overnight, companionTags: plan.companionTags || [], gearTags: plan.gearTags || [] });
}

function buildSections(rule, checklistState) {
  const groups = [
    { key: 'before', title: '出发前', subtitle: '装备与联系准备', values: rule.checklist || [] },
    { key: 'during', title: '活动中', subtitle: '减少接触与暴露', values: rule.activityTips || [] },
    { key: 'return', title: '返程后', subtitle: '检查身体与随身物品', values: rule.returnCheck || [] }
  ];
  return groups.map(group => ({ key: group.key, title: group.title, subtitle: group.subtitle, items: group.values.map((text, index) => ({ id: `${group.key}:${index}`, text, done: Boolean(checklistState && checklistState[`${group.key}:${index}`]) })) }));
}

function sectionCounts(section) { return { total: section.items.length, done: section.items.filter(item => item.done).length }; }

Page({
  data: { plan: {}, rule: {}, riskTitle: '', sections: [], totalCount: 0, doneCount: 0, completionPercent: 0, isOffline: false, offlineSaved: false },

  onLoad(query) {
    const isOffline = query.source === 'offline';
    const offlineCard = store.get('offlineCard', null);
    const plans = store.get('plans', []);
    const plan = isOffline && offlineCard ? offlineCard.plan : plans.find(item => item.id === query.planId) || store.get('currentPlan', {}) || {};
    if (!plan.id) { wx.showModal({ title: '未找到行程', content: '请先创建一份行前计划。', showCancel: false, success: () => nav.back() }); return; }
    const rule = isOffline && offlineCard && offlineCard.rule ? normalizeRule(Object.assign({}, plan, { ruleSnapshot: offlineCard.rule })) : normalizeRule(plan);
    const sections = isOffline && offlineCard && offlineCard.sections ? offlineCard.sections : buildSections(rule, plan.checklistState || {});
    this.setData({ plan, rule, riskTitle: (rule.riskTags || []).join(' · ') || '基础户外防护', sections, isOffline, offlineSaved: Boolean(offlineCard && offlineCard.plan && offlineCard.plan.id === plan.id) });
    this.updateCounts();
  },

  updateCounts() {
    const counts = this.data.sections.reduce((result, section) => { const value = sectionCounts(section); result.total += value.total; result.done += value.done; return result; }, { total: 0, done: 0 });
    this.setData({ totalCount: counts.total, doneCount: counts.done, completionPercent: counts.total ? Math.round(counts.done * 100 / counts.total) : 0 });
  },

  back() { nav.back(); },
  edit() { wx.redirectTo({ url: `/pages/precheck/precheck?planId=${this.data.plan.id}` }); },
  plans() { wx.navigateTo({ url: '/pages/my-plans/my-plans' }); },
  home() { wx.switchTab({ url: '/pages/home/home' }); },

  toggle(event) {
    if (this.data.isOffline) return;
    const sectionIndex = Number(event.currentTarget.dataset.section); const itemIndex = Number(event.currentTarget.dataset.index);
    const sections = this.data.sections.map(section => Object.assign({}, section, { items: section.items.map(item => Object.assign({}, item)) }));
    if (!sections[sectionIndex] || !sections[sectionIndex].items[itemIndex]) return;
    sections[sectionIndex].items[itemIndex].done = !sections[sectionIndex].items[itemIndex].done;
    this.setData({ sections }, () => { this.updateCounts(); this.persist(false); });
  },

  checklistState() {
    const state = {}; this.data.sections.forEach(section => section.items.forEach(item => { state[item.id] = item.done; })); return state;
  },

  persist(showFeedback) {
    const plan = Object.assign({}, this.data.plan, { checklistState: this.checklistState(), ruleSnapshot: this.data.rule, updatedAtTimestamp: Date.now(), syncStatus: '待同步' });
    const plans = store.get('plans', []); const index = plans.findIndex(item => item.id === plan.id); if (index >= 0) plans[index] = plan; else plans.unshift(plan);
    store.set('plans', plans); store.set('currentPlan', plan); this.setData({ plan });
    if (showFeedback) wx.showToast({ title: '行程已保存', icon: 'success' });
    cloud.background('userData', { action: 'upsert', type: 'plan', clientId: plan.id, record: plan });
  },

  save() { this.persist(true); },
  saveOffline() {
    const offlineCard = { plan: Object.assign({}, this.data.plan, { checklistState: this.checklistState() }), rule: this.data.rule, sections: this.data.sections, cachedAtTimestamp: Date.now() };
    store.set('offlineCard', offlineCard); this.setData({ offlineSaved: true }); wx.showToast({ title: '离线安全卡已保存', icon: 'success' });
  }
});

module.exports = { buildSections, normalizeRule };
