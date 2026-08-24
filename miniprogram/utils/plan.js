// 行前计划列表与离线卡的数据辅助函数。

const PLAN_SCHEMA_VERSION = 1;
const OFFLINE_CARD_SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortPlans(plans) {
  return (Array.isArray(plans) ? plans.slice() : []).sort((a, b) => {
    return (b.updatedAtTimestamp || b.createdAtTimestamp || 0) - (a.updatedAtTimestamp || a.createdAtTimestamp || 0);
  });
}

function upsertPlan(plans, plan) {
  const next = Array.isArray(plans) ? plans.slice() : [];
  const index = next.findIndex(item => item.id === plan.id);
  if (index > -1) {
    next[index] = plan;
  } else {
    next.push(plan);
  }
  return sortPlans(next);
}

function removePlan(plans, planId) {
  return sortPlans((Array.isArray(plans) ? plans : []).filter(item => item.id !== planId));
}

function toLatestPlan(plan) {
  if (!plan) return null;
  const destinationName = plan.destinationName ||
    (plan.regionCodes && plan.regionCodes.length ? plan.regionCodes.join('、') : plan.regionCode);
  return {
    id: plan.id,
    destinationName: destinationName,
    month: plan.month,
    activityType: plan.activityType,
    riskTags: (plan.riskTags || []).slice(),
    ruleVersion: plan.ruleVersion || ''
  };
}

function buildOfflineCard(plan, rule, now) {
  const timestamp = now || Date.now();
  return {
    schemaVersion: OFFLINE_CARD_SCHEMA_VERSION,
    plan: clone(plan),
    rule: clone(rule),
    cachedAtTimestamp: timestamp
  };
}

function isValidOfflineCard(card) {
  return !!(card && card.plan && card.plan.id && card.rule && card.rule.checklist);
}

module.exports = {
  PLAN_SCHEMA_VERSION,
  OFFLINE_CARD_SCHEMA_VERSION,
  sortPlans,
  upsertPlan,
  removePlan,
  toLatestPlan,
  buildOfflineCard,
  isValidOfflineCard
};
