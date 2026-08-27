const assert = require('assert');
const route = require('../miniprogram/utils/route-plan.js');

assert.strictEqual(route.normalizeText('  浙江大学玉泉校区  '), '浙江大学玉泉校区');
assert.strictEqual(route.normalizeText(null), '');

const routes = [
  { id: 'a', points: [{ latitude: 30, longitude: 120 }] },
  { id: 'b', points: [{ latitude: 31, longitude: 121 }] }
];
const lines = route.buildPolylines(routes, 1);
assert.strictEqual(lines[0].width, 4);
assert.strictEqual(lines[1].width, 9);
assert.strictEqual(lines[1].color, '#2E7D5B');

const selected = route.buildSelectedRoute({
  id: 'a', name: '推荐路线', distanceText: '4.8 km', durationText: '22 分钟', points: routes[0].points
}, { startName: '起点', waypointName: '途经点', endName: '终点', mode: 'walking' }, 1000);
assert.strictEqual(selected.id, 'route_1000');
assert.strictEqual(selected.modeName, '步行');
assert.strictEqual(selected.routeName, '推荐路线');
assert.strictEqual(selected.waypointName, '途经点');
assert.strictEqual(selected.points.length, 1);

const multiSelected = route.buildSelectedRoute({
  id: 'b', name: '途经路线', distanceText: '18 km', durationText: '50 分钟', points: []
}, {
  startName: '杭州东站', endName: '莫干山', mode: 'driving',
  waypoints: [
    { name: '西湖', place: { city: '杭州市', title: '西湖' } },
    { name: '南浔古镇', place: { city: '湖州市', title: '南浔古镇' } }
  ],
  selectedPlaces: { startName: { city: '杭州市' }, endName: { city: '湖州市' } }
}, 2000);
assert.deepStrictEqual(multiSelected.waypointNames, ['西湖', '南浔古镇']);
assert.deepStrictEqual(multiSelected.regions, ['杭州', '湖州']);

assert.ok(route.getErrorMessage({ errMsg: 'FUNCTION_NOT_FOUND' }).includes('尚未部署'));
assert.ok(route.getErrorMessage({ errMsg: 'WebserviceAPI' }).includes('权限'));
assert.ok(route.getErrorMessage({ errMsg: 'FUNCTIONS_EXECUTE_FAIL' }).includes('重新部署'));

console.log('route plan tests passed');
