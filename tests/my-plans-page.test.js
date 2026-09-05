const assert = require('assert');

let pageDefinition = null;
let navigatedUrl = '';
const storage = {};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
  navigateTo(options) { navigatedUrl = options.url; }
};

const helpers = require('../miniprogram/pages/my-plans/my-plans.js');
const markup = require('fs').readFileSync(require('path').join(__dirname, '../miniprogram/pages/my-plans/my-plans.wxml'), 'utf8');
assert.ok(markup.includes('查看清单 >'));
assert.ok(markup.includes('继续填写 >'));
assert.ok(markup.includes('打开 >'));
assert.strictEqual(markup.includes('›'), false);
assert.strictEqual(markup.includes('&gt;'), false);

assert.strictEqual(helpers.countdown('2099-08-18', '2099-08-13'), '还有 5 天');
assert.strictEqual(helpers.countdown('2099-08-13', '2099-08-13'), '今天出发');
assert.strictEqual(helpers.normalizeDraft({}), null);

const normalized = helpers.normalizePlan({
  id: 'trip_real',
  destinationName: '浙江省丽水市古堰画乡',
  startDate: '2099-08-18',
  activityType: '徒步登山',
  ruleSnapshot: { checklist: ['装备'], activityTips: ['途中'], returnCheck: ['返程'] },
  checklistState: { 'before:0': true }
}, '2099-08-13');
assert.strictEqual(normalized.progressText, '1/3 项已完成');
assert.strictEqual(normalized.isHistory, false);

storage.bugtrail_v4_plans = [
  Object.assign({}, normalized, { startDate: '2099-08-18' }),
  { id: 'trip_old', destinationName: '杭州西湖', startDate: '2020-01-01', activityType: '骑行' }
];
storage.bugtrail_v4_precheckDraft = { destination: '宁波东钱湖', activity: '露营' };
storage.bugtrail_v4_offlineCard = { plan: storage.bugtrail_v4_plans[0], cachedAtTimestamp: 1 };

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
});
page.onShow();
assert.strictEqual(page.data.planCount, 2);
assert.ok(page.data.draft);
assert.ok(page.data.offlineCard);
page.setData({ tab: '历史' }, () => page.updateVisible());
assert.strictEqual(page.data.visiblePlans.length, 1);
assert.strictEqual(page.data.visiblePlans[0].id, 'trip_old');

page.open({ currentTarget: { dataset: { id: 'trip_real' } } });
assert.strictEqual(navigatedUrl, '/pages/precheck-result/precheck-result?planId=trip_real');
page.openOffline();
assert.strictEqual(navigatedUrl, '/pages/precheck-result/precheck-result?source=offline');

console.log('my plans page tests passed');
