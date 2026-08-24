const assert = require('assert');

let pageDefinition = null;
const plan = {
  id: 'plan_page_001',
  regionCode: '丽水',
  month: '8月',
  activityType: '徒步登山',
  riskTags: ['山地林地'],
  ruleSnapshot: {
    id: 'rule_dynamic_zhejiang',
    ruleVersion: 'precheck-demo-1.1.0',
    riskSummary: '场景化建议',
    checklist: ['准备长袖长裤'],
    activityTips: ['走步道中央'],
    returnCheck: ['检查衣物'],
    matchedRules: []
  }
};
const storage = {
  plans: [plan],
  latestPlan: { id: plan.id }
};

global.Page = definition => {
  pageDefinition = definition;
};
global.wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  },
  showToast() {},
  showModal() {
    throw new Error('valid plan should not show an error modal');
  },
  navigateBack() {},
  switchTab() {}
};

require('../miniprogram/pages/precheck-result/precheck-result.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  });
}

const detailPage = createPage();
detailPage.onLoad({ planId: plan.id });
assert.strictEqual(detailPage.data.plan.id, plan.id);
assert.strictEqual(detailPage.data.rule.ruleVersion, 'precheck-demo-1.1.0');
assert.strictEqual(detailPage.data.offlineSaved, false);

detailPage.saveOffline();
assert.strictEqual(storage.offlineCard.plan.id, plan.id);
assert.strictEqual(storage.offlineCard.rule.ruleVersion, 'precheck-demo-1.1.0');
assert.strictEqual(detailPage.data.offlineSaved, true);

const offlinePage = createPage();
offlinePage.onLoad({ source: 'offline' });
assert.strictEqual(offlinePage.data.isOffline, true);
assert.strictEqual(offlinePage.data.plan.id, plan.id);

console.log('precheck result page tests passed');
