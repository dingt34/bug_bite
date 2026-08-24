const assert = require('assert');

let pageDefinition = null;
const removedFiles = [];
const storage = {
  userInfo: { displayName: '体验用户' },
  plans: [{ id: 'p1' }],
  plan_p1: { id: 'p1', detail: true },
  latestPlan: { id: 'p1' },
  offlineCard: { planId: 'p1' },
  events: [{ id: 'e1', imageRefs: ['wxfile://usr/event.jpg'] }],
  posts: [{ id: 'post1', imageRefs: ['wxfile://usr/post.jpg'] }],
  postReactions: { post1: { collected: true } },
  reportedPosts: { post1: true },
  unrelatedPreference: 'keep'
};
const app = { globalData: { userInfo: {}, latestPlan: {}, draftEvent: {} } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  getStorageInfoSync() { return { keys: Object.keys(storage), currentSize: Object.keys(storage).length }; },
  removeStorageSync(key) { delete storage[key]; },
  removeSavedFile(options) {
    removedFiles.push(options.filePath);
    if (options.success) options.success();
  },
  showModal(options) { options.success({ confirm: true }); },
  showToast() {}
};

require('../miniprogram/pages/privacy/privacy.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.onShow();
assert.strictEqual(page.data.summary.events, 1);
assert.strictEqual(page.data.summary.images, 2);
page.clearAllData();
assert.strictEqual(storage.unrelatedPreference, 'keep');
assert.strictEqual(storage.events, undefined);
assert.strictEqual(storage.plan_p1, undefined);
assert.deepStrictEqual(removedFiles, ['wxfile://usr/event.jpg', 'wxfile://usr/post.jpg']);
assert.strictEqual(app.globalData.userInfo, null);
assert.strictEqual(app.globalData.latestPlan, null);
assert.strictEqual(page.data.summary.events, 0);
assert.strictEqual(page.data.cleared, true);

console.log('privacy page tests passed');
