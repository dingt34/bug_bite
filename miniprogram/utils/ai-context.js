function clean(value, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback || '';
}

function describePlan(plan, index) {
  const destinations = (plan.destinations || []).map(item => item.name || item).filter(Boolean);
  const destination = destinations.length
    ? destinations.join('、')
    : clean(plan.destinationName || plan.regionCode, '未填写地点');
  return [
    '计划' + (index + 1) + '：' + destination,
    clean(plan.month),
    clean(plan.activityType),
    (plan.riskTags || []).join('、')
  ].filter(Boolean).join('；');
}

function describeEvent(event, index) {
  const reviews = event.reviews || [];
  const latestReview = reviews.length ? reviews[reviews.length - 1] : null;
  const parts = [
    '事件' + (index + 1) + '：' + clean(event.contactTypeName || event.contactType, '接触类型未记录'),
    clean(event.occurredAt),
    event.riskLevel ? '风险等级：' + event.riskLevel : '',
    clean(event.summary)
  ];
  if (latestReview) parts.push('最近复查：' + clean(latestReview.summary || latestReview.trend));
  return parts.filter(Boolean).join('；');
}

function buildRecordsContext(snapshot, limits) {
  const source = snapshot || {};
  const settings = Object.assign({ plans: 3, events: 5, maxLength: 6000 }, limits || {});
  const plans = (source.plans || []).slice(0, settings.plans);
  const events = (source.events || []).slice(0, settings.events);
  const sections = [];
  if (plans.length) sections.push('【近期行程计划】\n' + plans.map(describePlan).join('\n'));
  if (events.length) sections.push('【近期接触事件与复查】\n' + events.map(describeEvent).join('\n'));
  const text = sections.join('\n\n').slice(0, settings.maxLength);
  return {
    text,
    planCount: plans.length,
    eventCount: events.length,
    empty: !text
  };
}

module.exports = {
  clean,
  describePlan,
  describeEvent,
  buildRecordsContext
};
