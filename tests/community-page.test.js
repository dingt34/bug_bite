const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let lastListRequest = null;
const storage = {};
const app = { globalData: { cloudReady: true } };
const cloudPosts = [
  {
    id: 'post_hz', author: '杭州观察员', title: '湖边叮咬记录',
    text: '在湖边草地停留后发现皮肤发红。', region: '浙江杭州',
    type: '叮咬', stage: '观察完成', route: '西湖步道', likes: 2, comments: 1, favorites: 0
  },
  {
    id: 'post_ls', author: '丽水观察员', title: '森林步道记录',
    text: '森林行走后发现疑似附着虫体，已完成安全判断。', region: '浙江丽水',
    type: '叮咬', stage: '观察中', route: '古道徒步路线', likes: 4, comments: 2, favorites: 1
  },
  {
    id: 'post_ls_sting', author: '丽水同行者', title: '野外蜇伤记录',
    text: '短暂停留后出现局部不适。', region: '浙江丽水',
    type: '蜇伤', stage: '处理中', route: '', likes: 0, comments: 0, favorites: 0
  }
];

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  showToast() {},
  navigateTo() {},
  hideHomeButton() {},
  cloud: {
    callFunction(options) {
      lastListRequest = options.data;
      return Promise.resolve({ result: { ok: true, data: cloudPosts.slice() } });
    }
  }
};

require('../miniprogram/pages/community/community.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update, callback) {
      this.data = Object.assign({}, this.data, update);
      if (callback) callback();
    }
  });
}

function flush() {
  return new Promise(resolve => setTimeout(resolve, 10));
}

(async () => {
  const page = createPage();
  page.onShow();
  await flush();

  assert.deepStrictEqual(lastListRequest, { action: 'list', limit: 30 });
  assert.strictEqual(page.data.posts.length, 3, '应展示云端经历列表');
  assert.strictEqual(page.data.loading, false);

  page.search({ detail: { value: '森林' } });
  assert.deepStrictEqual(page.data.posts.map(item => item.id), ['post_ls'], '关键词搜索应过滤经历');
  page.clearSearch();
  assert.strictEqual(page.data.posts.length, 3);

  page.openFilters();
  assert.strictEqual(page.data.showFilter, true);
  page.filterRegion({ currentTarget: { dataset: { v: '浙江丽水' } } });
  page.filterType({ currentTarget: { dataset: { v: '叮咬' } } });
  page.filterStage({ currentTarget: { dataset: { v: '观察中' } } });
  page.toggleRoute();
  page.confirmFilters();
  assert.strictEqual(page.data.showFilter, false);
  assert.strictEqual(page.data.hasFilter, true);
  assert.deepStrictEqual(page.data.posts.map(item => item.id), ['post_ls'], '组合筛选应只保留匹配的含路线经历');

  page.openFilters();
  page.clearDraftFilters();
  page.confirmFilters();
  assert.strictEqual(page.data.posts.length, 3, '重置筛选后应恢复全部经历');
  assert.strictEqual(page.data.hasFilter, false);

  page.toggleLike({ currentTarget: { dataset: { id: 'post_hz' } } });
  assert.strictEqual(page.data.allPosts.find(item => item.id === 'post_hz').likes, 3);
  assert.strictEqual(storage.bugtrail_v4_communityReactions.post_hz.liked, true);
  page.toggleFavorite({ currentTarget: { dataset: { id: 'post_hz' } } });
  assert.strictEqual(page.data.allPosts.find(item => item.id === 'post_hz').favorites, 1);
  assert.strictEqual(storage.bugtrail_v4_communityReactions.post_hz.favorited, true);

  const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/community/community.wxml'), 'utf8');
  assert.ok(template.includes('bindtap="openFilters"'), '页面应提供筛选弹窗入口');
  assert.ok(template.includes('bindtap="toggleRoute"'), '页面应支持仅看含路线经历');
  assert.ok(template.includes('/assets/community/like.svg'), '页面应使用社群互动图标');
  console.log('community page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
