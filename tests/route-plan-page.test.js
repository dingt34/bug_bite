const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let savedRoute = null;
let toastTitle = '';

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync() { return null; },
  setStorageSync(key, value) {
    if (key === 'selectedRoutePlan') savedRoute = value;
  },
  showToast(options) { toastTitle = options.title; },
  chooseLocation(options) {
    options.success({ name: '杭州植物园', address: '杭州市西湖区桃源岭', latitude: 30.252, longitude: 120.118 });
  },
  navigateBack() {},
  navigateTo() {}
};

const originalSetTimeout = global.setTimeout;
global.setTimeout = fn => fn();
require('../miniprogram/pages/route-plan/route-plan.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data, {
    form: { startName: '浙江大学玉泉校区', waypointName: '黄龙体育中心', endName: '西湖景区', mode: 'walking' },
    routes: [{
      id: 'walking_0', name: '推荐路线', distanceText: '4.8 km', durationText: '60 分钟',
      points: [{ latitude: 30.26, longitude: 120.12 }, { latitude: 30.25, longitude: 120.14 }]
    }],
    selectedIndex: 0
  }),
  setData(changes, callback) {
    Object.keys(changes).forEach(key => {
      const parts = key.split('.');
      let target = this.data;
      parts.slice(0, -1).forEach(part => { target = target[part]; });
      target[parts[parts.length - 1]] = changes[key];
    });
    if (callback) callback();
  }
});

page.toggleEnvironment({ currentTarget: { dataset: { value: '林地/落叶层' } } });
page.confirmRoute();
assert.ok(savedRoute);
assert.strictEqual(savedRoute.startName, '浙江大学玉泉校区');
assert.strictEqual(savedRoute.endName, '西湖景区');
assert.strictEqual(savedRoute.waypointName, '黄龙体育中心');
assert.strictEqual(savedRoute.routeName, '推荐路线');
assert.strictEqual(savedRoute.modeName, '步行');
assert.deepStrictEqual(savedRoute.environmentTags, ['林地/落叶层']);
assert.strictEqual(toastTitle, '路线已保存');

page.choosePlace({ currentTarget: { dataset: { key: 'startName' } } });
assert.strictEqual(page.data.form.startName, '杭州植物园');
assert.strictEqual(page.data.selectedPlaces.startName.latitude, 30.252);
assert.deepStrictEqual(page.data.environments, []);

page.applyRoutes({
  start: { latitude: 30.25, longitude: 120.11 },
  end: { latitude: 30.24, longitude: 120.14 },
  routes: [
    { id: 'walking_0', name: '推荐路线', distanceText: '4.8 km', durationText: '60 分钟', environmentTags: ['林地/落叶层', '水边/湿地'], points: [] },
    { id: 'walking_1', name: '备选路线 2', distanceText: '5.1 km', durationText: '64 分钟', environmentTags: ['城市公园'], points: [] }
  ]
});
assert.strictEqual(page.data.routeTitle, '西湖景区步行路线');
assert.strictEqual(page.data.selectedRoute.id, 'walking_0');
assert.deepStrictEqual(page.data.environments, ['林地/落叶层', '水边/湿地']);
assert.ok(page.data.environmentStatus.includes('自动识别'));
page.selectRoute({ currentTarget: { dataset: { index: 1 } } });
assert.strictEqual(page.data.selectedRoute.id, 'walking_1');
assert.deepStrictEqual(page.data.environments, ['城市公园']);

const pageSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/route-plan/route-plan.js'), 'utf8');
const templateSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/route-plan/route-plan.wxml'), 'utf8');
assert.ok(pageSource.includes("action: 'suggest'"));
assert.ok(pageSource.includes('routes[0].environmentTags'));
assert.ok(pageSource.includes('waypointPlaces: this.data.waypoints'));
assert.ok(templateSource.includes('bindinput="onWaypointInput"'));
assert.ok(templateSource.includes('catchtap="selectSuggestion"'));
assert.ok(templateSource.includes('bindtap="addWaypoint"'));
assert.ok(templateSource.includes('waypoints.length >= 5'));
assert.ok(templateSource.includes('catchtap="choosePlace"'));
assert.ok(templateSource.includes('{{confirmLabel}}'));
assert.ok(templateSource.includes('class="safe-top"'));
assert.ok(templateSource.includes('class="map-stage"'));
assert.ok(templateSource.includes('class="route-sheet"'));
assert.ok(templateSource.includes('class="stats-card"'));
assert.ok(templateSource.includes('沿途环境'));
assert.ok(templateSource.includes('bindtap="toggleEnvironment"'));
assert.ok(templateSource.includes('class="primary-btn route-confirm-button"'));
assert.ok(!templateSource.includes('规划提示'));
assert.ok(!templateSource.includes('保存并添加到经历分享'));
assert.ok(!templateSource.includes('route-kicker'));
assert.ok(!templateSource.includes('雨水古堰画乡'));
assert.ok(!templateSource.includes('爬升'));

global.setTimeout = originalSetTimeout;
console.log('route plan page tests passed');
