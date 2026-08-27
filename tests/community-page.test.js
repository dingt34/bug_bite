const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
const app = { globalData: { communityFilter: 'collected' } };
let lastListRequest = null;
let reactionCalls = 0;
let simulateStaleRegionBackend = false;

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
        if (simulateStaleRegionBackend) {
          const posts = [
            { id: 'hz_post', region: '杭州', displayName: '杭州用户', text: '杭州经历', tags: [] },
            { id: 'huzhou_post', region: '湖州', displayName: '湖州用户', text: '湖州经历', tags: [] }
          ];
          return Promise.resolve({ result: { posts, total: posts.length, hasMore: false } });
        }
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
  dataUpdates: [],
  setData(update) {
    this.dataUpdates.push(update);
    this.data = Object.assign({}, this.data, update);
  }
});

(async () => {
  await page.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.filterMode, 'collected');
  assert.strictEqual(page.data.posts.length, 1);
  assert.strictEqual(page.data.posts[0].id, 'cloud_post_1');
  assert.strictEqual(app.globalData.communityFilter, null);
  assert.strictEqual(lastListRequest.filterMode, 'collected');

  const refreshPromise = page.loadPosts({ reset: true });
  assert.strictEqual(page.data.posts.length, 1, '后台刷新不应清空当前社群动态');
  assert.strictEqual(page.data.initialLoading, false, '首次加载完成后不应恢复整页加载');
  await refreshPromise;

  page.onSearchInput({ detail: { value: '不存在的关键词' } });
  await new Promise(resolve => setTimeout(resolve, 330));
  assert.strictEqual(page.data.posts.length, 0);
  await page.clearSearch();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.posts.length, 1);

  page.dataUpdates = [];
  page.toggleLike({ currentTarget: { dataset: { id: 'cloud_post_1' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(reactionCalls, 1);
  assert.strictEqual(page.dataUpdates.some(update => update.loading === true), false,
    '点赞不应触发页面级加载状态');
  assert.strictEqual(page.dataUpdates.some(update => Array.isArray(update.posts) && update.posts.length === 0), false,
    '点赞不应清空当前帖子列表');
  page.setSort({ currentTarget: { dataset: { mode: 'hot' } } });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.sortMode, 'hot');

  simulateStaleRegionBackend = true;
  page.setRegion({ currentTarget: { dataset: { region: '湖州' } } });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(lastListRequest.region, '湖州', '页面应把所选地区传给云函数');
  assert.deepStrictEqual(page.data.posts.map(post => post.region), ['湖州'],
    '即使旧版云函数忽略地区参数，页面也只能展示所选地区');
  page.onHide();
  assert.strictEqual(page.data.filterMode, 'all');
  const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/community/community.wxml'), 'utf8');
  assert.ok(template.includes('wx:if="{{item.avatarUrl}}"'), '社群列表应优先显示云头像图片');
  cloudService.resetForTests();
  console.log('community page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
