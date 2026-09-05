const assert = require('assert');
const fs = require('fs');
const path = require('path');
const community = require('../miniprogram/utils/community.js');

const routeGuide = {
  id: 'route_post',
  region: '湖州',
  text: '南浔到莫干山的周末户外经历',
  routePlan: { startName: '南浔古镇', waypointNames: ['湖州站'], endName: '莫干山' },
  likeCount: 8,
  collectCount: 12,
  commentCount: 3,
  createdAtTimestamp: 1000
};
const experience = {
  id: 'experience_post', region: '杭州', text: '一次户外经历',
  createdAtTimestamp: 2000
};

const validation = community.validatePost({
  region: '湖州', text: '沿途有补给点，雨天注意防滑。', contactType: 'bite', stage: '观察中',
  routePlan: routeGuide.routePlan
});
assert.strictEqual(validation.valid, true);
assert.strictEqual(community.validatePost({
  region: '湖州', text: '户外经历内容', contactType: 'bite'
}).valid, false);

const filtered = community.listPosts([experience, routeGuide], [], {}, 'all', 3000, {
  region: '湖州', sortMode: 'hot'
});
assert.deepStrictEqual(filtered.map(item => item.id), ['route_post']);
assert.deepStrictEqual(community.listPosts([
  Object.assign({}, routeGuide, { id: 'city_suffix', region: '浙江省湖州市' })
], [], {}, 'all', 3000, { region: '湖州' }).map(item => item.id), ['city_suffix']);

const communityTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/community/community.wxml'), 'utf8');
const publishTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/post-publish/post-publish.wxml'), 'utf8');
const precheckTemplate = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/precheck/precheck.wxml'), 'utf8');
assert.ok(!communityTemplate.includes('setContentType'));
assert.ok(communityTemplate.includes('wx:if="{{item.routePlan}}"'));
assert.ok(publishTemplate.includes('添加路线（选填）'));
assert.ok(publishTemplate.includes('chooseRoute'));
assert.ok(precheckTemplate.includes('路线规划（选填）'));

console.log('route community feature tests passed');
