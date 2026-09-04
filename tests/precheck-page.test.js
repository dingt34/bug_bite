const assert = require('assert');

let pageDefinition = null;
let navigatedUrl = '';
let lastToast = '';
const storage = {};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast(options) { lastToast = options.title; }
};

require('../miniprogram/pages/precheck/precheck.js');

function createPage(data) {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data, data),
    setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
  });
}

const page = createPage({
  destination: '浙江省丽水市古堰画乡',
  dateValue: '2099-08-18',
  date: '2099年08月18日',
  activity: '徒步登山',
  habitats: ['高草/灌木', '林地/落叶层'],
  overnight: '户外过夜',
  companions: ['儿童'],
  gears: ['长袖长裤'],
  route: null
});

page.generate();
const plans = storage.bugtrail_v4_plans;
assert.strictEqual(plans.length, 1);
assert.deepStrictEqual(plans[0].regionCodes, ['丽水']);
assert.strictEqual(plans[0].activityType, '徒步登山');
assert.ok(plans[0].ruleSnapshot.checklist.length > 0);
assert.ok(plans[0].ruleSnapshot.activityTips.some(item => item.includes('步道')));
assert.ok(plans[0].ruleSnapshot.returnCheck.length > 0);
assert.ok(navigatedUrl.includes('planId=' + plans[0].id));

const outside = createPage({ destination: '上海外滩', dateValue: '2099-08-18', activity: '骑行', habitats: [], overnight: '当日往返', companions: [], gears: [] });
outside.generate();
assert.strictEqual(lastToast, '目前仅支持浙江省内目的地');

console.log('precheck page tests passed');
