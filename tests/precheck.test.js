const assert = require('assert');
const precheck = require('../miniprogram/utils/precheck.js');
const mock = require('../miniprogram/utils/mock.js');

assert.deepStrictEqual(mock.ACTIVITIES, [
  '徒步登山', '露营', '骑行', '野餐/草地活动',
  '垂钓/水边活动', '农事/采摘', '其他户外活动'
]);
assert.deepStrictEqual(mock.HABITATS, [
  '高草/灌木', '林地/落叶层', '水边/湿地',
  '农田/果园', '城市公园', '室内住宿'
]);
assert.deepStrictEqual(mock.COMPANIONS, ['独自出行', '同行成人', '儿童', '老年人', '宠物']);
assert.deepStrictEqual(mock.GEARS, [
  '长袖长裤', '包脚鞋袜', '驱虫剂', '帐篷/蚊帐',
  '手套', '尖头镊子', '基础急救包', '暂未准备'
]);

function plan(overrides) {
  return Object.assign({
    regionCodes: ['丽水'],
    month: '8月',
    activityType: '徒步登山',
    habitatTags: [],
    overnight: '',
    companionTags: [],
    gearTags: []
  }, overrides || {});
}

const base = precheck.evaluatePlan(plan());
assert.ok(base.riskTags.includes('山地林地'));
assert.ok(base.riskTags.includes('暖季活动'));
assert.ok(base.riskTags.includes('步道暴露'));
assert.strictEqual(base.ruleVersion, precheck.RULE_VERSION);

const cool = precheck.evaluatePlan(plan({ month: '1月' }));
assert.ok(cool.riskTags.includes('低温季节'));
assert.strictEqual(cool.riskTags.includes('暖季活动'), false);

const coastal = precheck.evaluatePlan(plan({ regionCodes: ['舟山'] }));
assert.ok(coastal.riskTags.includes('海岛水域'));

const multiRegion = precheck.evaluatePlan(plan({ regionCodes: ['杭州', '舟山', '丽水'] }));
assert.ok(multiRegion.riskTags.includes('城市近郊'));
assert.ok(multiRegion.riskTags.includes('海岛水域'));
assert.ok(multiRegion.riskTags.includes('山地林地'));
assert.strictEqual(multiRegion.matchedRules.filter(rule => rule.id.indexOf('region_') === 0).length, 3);
assert.ok(multiRegion.riskSummary.includes('杭州、舟山、丽水'));

const habitat = precheck.evaluatePlan(plan({ habitatTags: ['高草/灌木', '林地/落叶层'] }));
assert.ok(habitat.riskTags.includes('高草灌木'));
assert.ok(habitat.riskTags.includes('林地落叶'));
assert.ok(habitat.activityTips.some(item => item.includes('高草')));

const overnight = precheck.evaluatePlan(plan({ overnight: '户外过夜' }));
assert.ok(overnight.riskTags.includes('夜间过夜'));
assert.ok(overnight.checklist.includes('准备帐篷/蚊帐'));

const companions = precheck.evaluatePlan(plan({ companionTags: ['儿童', '宠物'] }));
assert.ok(companions.activityTips.some(item => item.includes('儿童')));
assert.ok(companions.returnCheck.some(item => item.includes('宠物')));

const prepared = precheck.evaluatePlan(plan({ habitatTags: ['高草/灌木'], gearTags: ['长袖长裤', '包脚鞋袜', '驱虫剂', '尖头镊子', '基础急救包'] }));
assert.strictEqual(prepared.checklist.includes('准备长袖长裤'), false);
assert.strictEqual(prepared.checklist.includes('准备包脚鞋袜'), false);
assert.strictEqual(prepared.checklist.includes('准备驱虫剂'), false);
assert.strictEqual(prepared.checklist.includes('准备尖头镊子'), false);
assert.ok(prepared.matchedRules.some(rule => rule.id === 'available_gears'));

const noGear = precheck.evaluatePlan(plan({ gearTags: ['暂未准备'] }));
assert.ok(noGear.checklist.includes('准备长袖长裤'));
assert.ok(noGear.matchedRules.some(rule => rule.id === 'no_gears'));

const indoorStay = precheck.evaluatePlan(plan({ overnight: '室内住宿', habitatTags: ['室内住宿'] }));
assert.ok(indoorStay.riskTags.includes('室内住宿'));
assert.ok(indoorStay.matchedRules.some(rule => rule.id === 'indoor_stay'));

const farming = precheck.evaluatePlan(plan({ activityType: '农事/采摘', habitatTags: ['农田/果园'] }));
assert.ok(farming.riskTags.includes('植被接触'));
assert.ok(farming.checklist.includes('准备手套'));

console.log('precheck tests passed');
