const assert = require('assert');

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
    form: { startName: '浙江大学玉泉校区', endName: '西湖景区', mode: 'walking' },
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
assert.strictEqual(savedRoute.routeName, '推荐路线');
assert.strictEqual(savedRoute.modeName, '步行');
assert.strictEqual(toastTitle, '路线已保存');

global.setTimeout = originalSetTimeout;
console.log('route plan page tests passed');
