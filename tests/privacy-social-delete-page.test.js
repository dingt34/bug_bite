const assert = require('assert');

let pageDefinition = null;
const calls = [];
const storage = {
  bugtrail_v4_user: { id: 'user-1', nickname: '体验用户' },
  bugtrail_v4_posts: [
    { id: 'post1', author: '体验用户', title: '我的经历' },
    { id: 'post2', authorId: 'user-1', author: '旧昵称', title: '改名前发布的经历' }
  ],
  bugtrail_v4_postComments: { post1: [{ text: '本机评论' }] }
};

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => ({ globalData: { cloudReady: true } });
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
  showModal(options) { options.success({ confirm: true }); },
  showToast() {},
  cloud: {
    callFunction(options) {
      calls.push(options);
      return Promise.resolve({ result: { ok: true, data: {} } });
    }
  }
};

require('../miniprogram/pages/privacy-social-delete/privacy-social-delete.js');
const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

(async () => {
  page.load();
  assert.deepStrictEqual(page.data.posts.map(item => item.id), ['post1', 'post2']);
  page.deletePost({ currentTarget: { dataset: { id: 'post1' } } });
  await flush();
  assert.deepStrictEqual(calls[0].data, { action: 'delete', postId: 'post1' });
  assert.deepStrictEqual(storage.bugtrail_v4_posts, [{ id: 'post2', authorId: 'user-1', author: '旧昵称', title: '改名前发布的经历' }]);
  assert.deepStrictEqual(storage.bugtrail_v4_postComments, {});
  console.log('privacy social delete page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
