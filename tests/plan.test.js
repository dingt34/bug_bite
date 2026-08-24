const assert = require('assert');
const planUtils = require('../miniprogram/utils/plan.js');

const first = {
  id: 'plan_1',
  regionCode: '丽水',
  month: '8月',
  activityType: '徒步登山',
  riskTags: ['山地林地'],
  createdAtTimestamp: 100,
  updatedAtTimestamp: 100,
  ruleSnapshot: { checklist: ['准备长袖长裤'] }
};
const second = {
  id: 'plan_2',
  regionCode: '舟山',
  month: '9月',
  activityType: '露营',
  riskTags: ['海岛水域'],
  createdAtTimestamp: 200,
  updatedAtTimestamp: 200,
  ruleSnapshot: { checklist: ['准备帐篷/蚊帐'] }
};

const multiDestination = {
  id: 'plan_multi',
  regionCodes: ['杭州', '湖州', '嘉兴'],
  destinationName: '杭州、湖州、嘉兴',
  month: '10月',
  activityType: '骑行',
  riskTags: ['城市近郊'],
  createdAtTimestamp: 50,
  updatedAtTimestamp: 50,
  ruleSnapshot: { checklist: ['准备包脚鞋袜'] }
};

let plans = planUtils.upsertPlan([], first);
plans = planUtils.upsertPlan(plans, second);
assert.deepStrictEqual(plans.map(plan => plan.id), ['plan_2', 'plan_1']);

plans = planUtils.upsertPlan(plans, Object.assign({}, first, { updatedAtTimestamp: 300 }));
assert.strictEqual(plans.length, 2);
assert.strictEqual(plans[0].id, 'plan_1');

const latest = planUtils.toLatestPlan(plans[0]);
assert.strictEqual(latest.destinationName, '丽水');
assert.deepStrictEqual(latest.riskTags, ['山地林地']);
assert.strictEqual(planUtils.toLatestPlan(multiDestination).destinationName, '杭州、湖州、嘉兴');

const offline = planUtils.buildOfflineCard(first, first.ruleSnapshot, 500);
assert.strictEqual(planUtils.isValidOfflineCard(offline), true);
assert.strictEqual(offline.cachedAtTimestamp, 500);
first.ruleSnapshot.checklist.push('后来修改');
assert.deepStrictEqual(offline.rule.checklist, ['准备长袖长裤']);

plans = planUtils.removePlan(plans, 'plan_1');
assert.deepStrictEqual(plans.map(plan => plan.id), ['plan_2']);
assert.strictEqual(planUtils.isValidOfflineCard({ checklist: [] }), false);

console.log('plan tests passed');
