const store = require('../../utils/store');
const nav = require('../../utils/nav');

function getPlanStart(plan, currentYear) {
  const raw = String(plan.startAt || plan.startDate || plan.date || '').trim();
  const match = raw.match(/(?:(\d{4})[-年/])?(\d{1,2})[-月/](\d{1,2})/);
  if (!match) return NaN;
  const year = Number(match[1] || currentYear);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date.getTime()
    : NaN;
}

function formatPlanDate(plan, now = new Date()) {
  const timestamp = getPlanStart(plan, now.getFullYear());
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
}

function formatCompactPlanDate(plan, now = new Date()) {
  const timestamp = getPlanStart(plan, now.getFullYear());
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
}

function normalizeHomePlan(plan, now = new Date()) {
  const source = plan && plan.id ? plan : {};
  return Object.assign({}, source, {
    displayTitle: source.title || source.destinationName || source.destination || '',
    displayDate: formatPlanDate(source, now),
    compactDate: formatCompactPlanDate(source, now)
  });
}

function getNearestUpcomingPlan(plans, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return plans
    .map(plan => ({ plan, start: getPlanStart(plan, now.getFullYear()) }))
    .filter(item => Number.isFinite(item.start) && item.start >= today)
    .sort((a, b) => a.start - b.start)[0]?.plan || {};
}

function getRiskTheme(now = new Date()) {
  const month = now.getMonth() + 1;
  const season = month >= 3 && month <= 5
    ? 'spring'
    : month >= 6 && month <= 8
      ? 'summer'
      : month >= 9 && month <= 11
        ? 'autumn'
        : 'winter';
  return { riskMonth: month, riskSeason: `risk-${season}` };
}

Page({
  data: { user: {}, plan: {}, event: {}, hasRoute: false, routeInfo: {}, riskMonth: '', riskSeason: '' },
  onShow() {
    nav.syncTab(this, 0);
    const plan = normalizeHomePlan(getNearestUpcomingPlan(store.get('plans', [])));
    const currentPlan = store.get('currentPlan', {});
    const routeDraft = currentPlan.id === plan.id
      ? currentPlan.route || store.get('routeDraft', null)
      : null;
    this.setData({
      user: store.get('user', { nickname: '林间观察员' }),
      plan,
      event: store.get('events', [])[0] || {},
      ...getRiskTheme(),
      hasRoute: Boolean(plan.route || plan.distance || routeDraft),
      routeInfo: routeDraft || (plan.distance ? { distance: plan.distance } : {})
    });
  },
  danger() { wx.navigateTo({ url: '/pages/danger/danger?source=home' }); },
  precheck() { wx.navigateTo({ url: '/pages/precheck/precheck' }); },
  plans() { wx.navigateTo({ url: '/pages/my-plans/my-plans' }); },
  event() { wx.navigateTo({ url: `/pages/event-detail/event-detail?id=${this.data.event.id || 'event_mosquito'}` }); }
});

module.exports = { getPlanStart, getNearestUpcomingPlan, formatPlanDate, formatCompactPlanDate, normalizeHomePlan };
