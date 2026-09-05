const assert = require('assert');

let pageDefinition = null;
let navigatedUrl = '';
let lastToast = '';
let failStorageKey = '';
const storage = {};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { if (key === failStorageKey) throw new Error('quota'); storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast(options) { lastToast = options.title; }
};

require('../miniprogram/pages/precheck/precheck.js');

const precheckMarkup = require('fs').readFileSync(require('path').join(__dirname, '../miniprogram/pages/precheck/precheck.wxml'), 'utf8');
assert.ok(precheckMarkup.includes('<picker mode="selector"'));
assert.ok(precheckMarkup.includes('supplement-head'));
assert.ok(precheckMarkup.includes('supplement-card'));
assert.ok(precheckMarkup.includes('<image class="supplement-arrow'));

function createPage(data) {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data, data),
    setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
  });
}

const activityPage = createPage({});
activityPage.chooseActivity({ detail: { value: '6' } });
assert.strictEqual(activityPage.data.activity, '其他户外活动');
assert.strictEqual(activityPage.data.activityIndex, 6);

activityPage.toggleHabitat({ currentTarget: { dataset: { value: '城市公园' } } });
assert.strictEqual(activityPage.data.optionalDone, 1);

activityPage.toggleCompanion({ currentTarget: { dataset: { value: '独自出行' } } });
activityPage.toggleCompanion({ currentTarget: { dataset: { value: '儿童' } } });
assert.deepStrictEqual(activityPage.data.companions, ['儿童'], '选择同行对象后应自动取消“独自出行”');
activityPage.toggleCompanion({ currentTarget: { dataset: { value: '独自出行' } } });
assert.deepStrictEqual(activityPage.data.companions, ['独自出行'], '选择“独自出行”后应清除其他同行对象');

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

const invalidDate = createPage({ destination: '浙江省杭州市', dateValue: '2099-02-30', activity: '骑行', habitats: [], overnight: '当日往返', companions: [], gears: [] });
invalidDate.generate();
assert.strictEqual(lastToast, '请选择今天或之后的有效日期');
assert.strictEqual(storage.bugtrail_v4_plans.length, 1);

const routePage = createPage({ destination: '', habitats: ['城市公园'], habitatOptions: [], expanded: false });
routePage.awaitingRoute = true;
storage.bugtrail_v4_routeDraft = {
  end: '西湖景区',
  regions: ['杭州'],
  environmentTags: ['林地/落叶层', '水边/湿地'],
  verified: true
};
routePage.onShow();
assert.strictEqual(routePage.data.destination, '杭州 · 西湖景区');
assert.deepStrictEqual(routePage.data.habitats, ['城市公园', '林地/落叶层', '水边/湿地']);
assert.strictEqual(routePage.data.expanded, true);
assert.strictEqual(storage.bugtrail_v4_routeDraft, undefined);

const retryPage = createPage({ destination: '浙江省杭州市西湖景区', dateValue: '2099-08-18', date: '2099年08月18日', activity: '徒步登山', habitats: [], overnight: '当日往返', companions: [], gears: [], route: null });
failStorageKey = 'bugtrail_v4_currentPlan';
retryPage.generate();
const retainedPlanId = retryPage.planId;
assert.strictEqual(retryPage.data.submitting, false);
assert.strictEqual(retryPage.completed, undefined);
assert.strictEqual(lastToast, '计划保存失败，请重试');
failStorageKey = '';
retryPage.generate();
assert.strictEqual(retryPage.planId, retainedPlanId);
assert.strictEqual(storage.bugtrail_v4_plans.filter(item => item.id === retainedPlanId).length, 1);

console.log('precheck page tests passed');
