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
  })
});

page.confirmRoute();
assert.ok(savedRoute);
assert.strictEqual(savedRoute.startName, '浙江大学玉泉校区');
assert.strictEqual(savedRoute.endName, '西湖景区');
assert.strictEqual(savedRoute.waypointName, '黄龙体育中心');
assert.strictEqual(savedRoute.routeName, '推荐路线');
assert.strictEqual(savedRoute.modeName, '步行');
assert.strictEqual(toastTitle, '路线已保存');

const pageSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/route-plan/route-plan.js'), 'utf8');
const templateSource = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/route-plan/route-plan.wxml'), 'utf8');
assert.ok(pageSource.includes("action: 'suggest'"));
assert.ok(pageSource.includes('waypointPlace: this.data.selectedPlaces.waypointName'));
assert.ok(templateSource.includes('bindinput="onWaypointInput"'));
assert.ok(templateSource.includes('catchtap="selectSuggestion"'));
assert.ok(templateSource.includes('bindtap="addWaypoint"'));
assert.ok(templateSource.includes('wx:if="{{!waypointEnabled}}"'));

global.setTimeout = originalSetTimeout;
console.log('route plan page tests passed');
