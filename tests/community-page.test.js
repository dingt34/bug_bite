const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
const app = { globalData: { communityFilter: 'collected' } };
let lastListRequest = null;
let reactionCalls = 0;

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return { displayName: '云用户', mode: 'wechat_cloud' };
    if (key === 'communityMigrationV1') return { completed: true };
    return null;
  },
  setStorageSync() {},
  stopPullDownRefresh() {},
  showToast() {},
  navigateTo() {},
  cloud: {
    init() {},
    callFunction(options) {
      const data = options.data;
      if (data.action === 'list') {
        lastListRequest = data;
        const posts = data.query ? [] : [{
          id: 'cloud_post_1', displayName: '云端作者', text: '林地经历',
          createdAtTimestamp: Date.now() - 1000, liked: false, collected: true,
          likeCount: 1, collectCount: 1, commentCount: 0, tags: []
        }];
        return Promise.resolve({ result: { posts, total: posts.length, hasMore: false } });
      }
      if (data.action === 'toggleReaction') {
        reactionCalls += 1;
        return Promise.resolve({ result: { reaction: { liked: true } } });
      }
      if (data.action === 'stats') return Promise.resolve({ result: { posts: 0, comments: 0, collections: 1 } });
      return Promise.resolve({ result: {} });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/community/community.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

(async () => {
  await page.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.filterMode, 'collected');
  assert.strictEqual(page.data.posts.length, 1);
  assert.strictEqual(page.data.posts[0].id, 'cloud_post_1');
  assert.strictEqual(app.globalData.communityFilter, null);
  assert.strictEqual(lastListRequest.filterMode, 'collected');

  page.onSearchInput({ detail: { value: '不存在的关键词' } });
  await new Promise(resolve => setTimeout(resolve, 330));
  assert.strictEqual(page.data.posts.length, 0);
  await page.clearSearch();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.posts.length, 1);

  page.toggleLike({ currentTarget: { dataset: { id: 'cloud_post_1' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(reactionCalls, 1);
  page.setSort({ currentTarget: { dataset: { mode: 'hot' } } });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.sortMode, 'hot');
  page.onHide();
  assert.strictEqual(page.data.filterMode, 'all');
  cloudService.resetForTests();
  console.log('community page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
