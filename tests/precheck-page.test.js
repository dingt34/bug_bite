const assert = require('assert');

let pageDefinition = null;
let navigatedUrl = '';
const storage = {};
const app = { globalData: { latestPlan: null } };

global.Page = definition => {
  pageDefinition = definition;
};
global.getApp = () => app;
global.wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  },
  navigateTo(options) {
    navigatedUrl = options.url;
  },
  showToast() {
    throw new Error('complete multi-region form should not fail validation');
  }
};

require('../miniprogram/pages/precheck/precheck.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data, {
    form: {
      regionCodes: ['杭州', '湖州', '嘉兴'],
      month: '8月',
      activityType: '骑行',
      habitatTags: ['城市公园'],
      overnight: '当日往返',
      companionTags: ['同行成人'],
      gearTags: ['长袖长裤', '包脚鞋袜']
    }
  })
});

page.submit();
assert.strictEqual(storage.plans.length, 1);
assert.deepStrictEqual(storage.plans[0].regionCodes, ['杭州', '湖州', '嘉兴']);
assert.strictEqual(storage.plans[0].destinationName, '杭州、湖州、嘉兴');
assert.strictEqual(storage.plans[0].regionCode, '杭州、湖州、嘉兴');
assert.strictEqual(app.globalData.latestPlan.destinationName, '杭州、湖州、嘉兴');
assert.ok(storage.plans[0].matchedRules.some(rule => rule.id === 'region_杭州'));
assert.ok(storage.plans[0].matchedRules.some(rule => rule.id === 'region_湖州'));
assert.ok(storage.plans[0].matchedRules.some(rule => rule.id === 'region_嘉兴'));
assert.ok(navigatedUrl.includes('planId=' + storage.plans[0].id));

console.log('precheck page tests passed');
