const assert = require('assert');

let pageDefinition = null;
const app = { globalData: { communityFilter: 'collected' } };
const reactions = { post_001: { collected: true } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) {
    if (key === 'posts') return [];
    if (key === 'postReactions') return reactions;
    return null;
  },
  setStorageSync() {},
  navigateTo() {}
};

require('../miniprogram/pages/community/community.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.onShow();
assert.strictEqual(page.data.filterMode, 'collected');
assert.strictEqual(page.data.posts.length, 1);
assert.strictEqual(page.data.posts[0].id, 'post_001');
assert.strictEqual(app.globalData.communityFilter, null);
page.onSearchInput({ detail: { value: '不存在的关键词' } });
assert.strictEqual(page.data.posts.length, 0);
page.clearSearch();
assert.strictEqual(page.data.posts.length, 1);
page.setSort({ currentTarget: { dataset: { mode: 'hot' } } });
assert.strictEqual(page.data.sortMode, 'hot');
page.onHide();
assert.strictEqual(page.data.filterMode, 'all');

console.log('community page tests passed');
