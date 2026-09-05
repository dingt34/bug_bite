const assert = require('assert');
const fs = require('fs');
const path = require('path');

const profileWxss = fs.readFileSync(
  path.join(__dirname, '../miniprogram/pages/profile/profile.wxss'),
  'utf8'
);
const profileWxml = fs.readFileSync(
  path.join(__dirname, '../miniprogram/pages/profile/profile.wxml'),
  'utf8'
);
assert.ok(
  profileWxml.indexOf('我的发布') < profileWxml.indexOf('我的评论') &&
  profileWxml.indexOf('我的评论') < profileWxml.indexOf('我的收藏'),
  '社群参与应按发布、评论、收藏排列'
);
['profile-hero', 'overview-card', '近期记录', '管理与设置'].forEach(marker => {
  assert.ok(profileWxml.includes(marker), '个人页应包含结构标记：' + marker);
});
assert.strictEqual(profileWxml.includes('全部事件'), false, '个人页不应显示“全部事件”入口');
assert.ok(profileWxml.includes('plan-card event-card'), '最近事件应使用与最近计划一致的卡片结构');
assert.ok(
  profileWxml.includes('<view class="plan-card event-card" wx:if="{{latestEvent}}" bindtap="goEvents">'),
  '点击最近事件卡片应进入全部事件列表'
);
let wxssBraceDepth = 0;
let wxssHasNestedRule = false;
profileWxss.split(/\r?\n/).forEach(line => {
  for (const character of line) {
    if (character === '{') {
      if (wxssBraceDepth !== 0) wxssHasNestedRule = true;
      wxssBraceDepth += 1;
    } else if (character === '}') {
      wxssBraceDepth -= 1;
    }
  }
});
assert.strictEqual(wxssHasNestedRule, false, 'profile.wxss 不应出现嵌套规则');
assert.strictEqual(wxssBraceDepth, 0, 'profile.wxss 花括号必须成对');

let pageDefinition = null;
const storage = {
  userInfo: { id: 'u1', displayName: '山野观察员', avatarText: '山' },
  bugtrail_v4_plans: [{ id: 'p1', destinationName: '丽水', month: '8月' }],
  bugtrail_v4_currentPlan: { id: 'p1', destinationName: '丽水', month: '8月' },
  bugtrail_v4_events: [
    { id: 'e2', contactTypeName: '蜇伤', occurredAt: '今天', riskLevel: 'consult' },
    { id: 'e1', contactTypeName: '叮咬', occurredAt: '昨天', riskLevel: 'observe' }
  ],
  bugtrail_v4_posts: [{ id: 'post1' }],
  bugtrail_v4_postReactions: { post1: { collected: true } },
  bugtrail_v4_postComments: {
    post1: [
      { id: 'c1', authorId: 'u1', displayName: '山野观察员' },
      { id: 'c2', authorId: 'u2', displayName: '其他用户' }
    ]
  }
};
const app = { globalData: { userInfo: {}, latestPlan: storage.bugtrail_v4_currentPlan } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  removeStorageSync(key) { delete storage[key]; },
  showModal(options) { options.success({ confirm: true }); },
  showToast() {},
  navigateTo(options) { app.lastNavigateUrl = options.url; },
  switchTab(options) { app.lastTabUrl = options.url; }
};

require('../miniprogram/pages/profile/profile.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.onShow();
assert.strictEqual(page.data.loggedIn, true);
assert.strictEqual(page.data.events.length, 2);
assert.strictEqual(page.data.latestEvent.id, 'e2');
page.goEvents();
assert.strictEqual(app.lastNavigateUrl, '/pages/my-events/my-events');
assert.strictEqual(page.data.summary.plans, 1);
assert.strictEqual(page.data.summary.posts, 1);
assert.strictEqual(page.data.summary.comments, 1);

storage.bugtrail_v4_events.unshift({ id: 'e3', contactTypeName: '新接触', occurredAt: '刚刚', riskLevel: 'observe', createdAtTimestamp: Date.now() });
page.onShow();
assert.strictEqual(page.data.summary.events, 3, '重新进入“我的”页时应读取最新事件数量');
assert.strictEqual(page.data.latestEvent.id, 'e3');

page.goCommunity();
assert.strictEqual(app.globalData.communityFilter, 'mine');
assert.strictEqual(app.lastTabUrl, '/pages/community/community');

page.goCollections();
assert.strictEqual(app.globalData.communityFilter, 'collected');
assert.strictEqual(app.lastTabUrl, '/pages/community/community');

page.goComments();
assert.strictEqual(app.globalData.communityFilter, 'commented');
assert.strictEqual(app.lastTabUrl, '/pages/community/community');

page.logout();
assert.strictEqual(storage.userInfo, undefined);
assert.strictEqual(storage.bugtrail_v4_plans.length, 1);
assert.strictEqual(storage.bugtrail_v4_posts.length, 1);
assert.strictEqual(page.data.loggedIn, false);

console.log('profile page tests passed');
