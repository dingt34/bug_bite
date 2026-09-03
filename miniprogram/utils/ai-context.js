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

function buildRecordCards(snapshot) {
  const source = snapshot || {};
  const planCards = (source.plans || []).map((plan, index) => {
    const destinations = (plan.destinations || []).map(item => item.name || item).filter(Boolean);
    return {
      kind: 'plan',
      key: 'plan-' + (plan.id || index),
      badge: '行程计划',
      title: destinations.join('、') || clean(plan.destinationName || plan.regionCode, '未填写地点'),
      subtitle: [clean(plan.month), clean(plan.activityType)].filter(Boolean).join(' · ') || '待完善行程信息',
      detail: (plan.riskTags || []).slice(0, 4).join(' · ')
    };
  });
  const eventCards = (source.events || []).map((event, index) => {
    const reviews = event.reviews || [];
    const latestReview = reviews.length ? reviews[reviews.length - 1] : null;
    return {
      kind: 'event',
      key: 'event-' + (event.id || index),
      badge: '接触事件',
      title: clean(event.contactTypeName || event.contactType, '接触类型未记录'),
      subtitle: [clean(event.occurredAt), event.riskLevel ? '风险：' + event.riskLevel : ''].filter(Boolean).join(' · ') || '待完善事件信息',
      detail: clean(latestReview && (latestReview.summary || latestReview.trend) || event.summary, '')
    };
  });
  return planCards.concat(eventCards);
}

module.exports = {
  clean,
  describePlan,
  describeEvent,
  buildRecordsContext,
  buildRecordCards
};
