const assert = require('assert');
const { inferEnvironmentTags, routeText } = require('../cloudfunctions/routePlan/environment-tags.js');

const route = {
  steps: [
    { instruction: '沿北山街向西步行，经过西湖边', road_name: '北山街' },
    { instruction: '进入杭州植物园后继续前行', road_name: '桃源岭' }
  ]
};
const places = [{ title: '梅家坞茶园', address: '杭州市西湖区梅灵南路' }];
assert.ok(routeText(route, places).includes('西湖边'));
assert.deepStrictEqual(inferEnvironmentTags(route, places), ['林地/落叶层', '水边/湿地', '农田/果园']);
assert.deepStrictEqual(inferEnvironmentTags({ steps: [{ road_name: '延安路' }] }, []), []);
assert.deepStrictEqual(inferEnvironmentTags({}, [{ title: '浙江大学中山校区' }]), []);
assert.deepStrictEqual(inferEnvironmentTags({}, [{ title: '西溪湿地附近民宿' }]), ['水边/湿地', '室内住宿']);

console.log('route environment tests passed');
