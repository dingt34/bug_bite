const assert = require('assert');
const fs = require('fs');
const path = require('path');

const profileWxss = fs.readFileSync(
  path.join(__dirname, '../miniprogram/pages/profile/profile.wxss'),
  'utf8'
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
  userInfo: { displayName: '山野观察员', avatarText: '山' },
  plans: [{ id: 'p1' }],
  latestPlan: { id: 'p1', destinationName: '丽水', month: '8月' },
  events: [],
  posts: [{ id: 'post1' }],
  postReactions: { post1: { collected: true } }
};
const app = { globalData: { userInfo: {}, latestPlan: storage.latestPlan } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  removeStorageSync(key) { delete storage[key]; },
  showModal(options) { options.success({ confirm: true }); },
  showToast() {},
  navigateTo() {},
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
assert.strictEqual(page.data.events.length, 0);
assert.strictEqual(page.data.summary.plans, 1);
assert.strictEqual(page.data.summary.posts, 1);

page.goCollections();
assert.strictEqual(app.globalData.communityFilter, 'collected');
assert.strictEqual(app.lastTabUrl, '/pages/community/community');

page.logout();
assert.strictEqual(storage.userInfo, undefined);
assert.strictEqual(storage.plans.length, 1);
assert.strictEqual(storage.posts.length, 1);
assert.strictEqual(page.data.loggedIn, false);

console.log('profile page tests passed');
