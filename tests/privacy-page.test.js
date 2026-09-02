const assert = require('assert');

let pageDefinition = null;
const calls = [];
const removedFiles = [];
const storage = {
  bugtrail_v4_offlineCard: { planId: 'p1' },
  bugtrail_v4_precheckDraft: { step: 1 },
  bugtrail_v4_events: [{ id: 'e1', imageFileIds: ['cloud://env/event.jpg'] }],
  bugtrail_v4_posts: [{ id: 'post1' }]
};
const app = { globalData: { cloudReady: true, user: { nickname: '体验用户' } } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; },
  clearStorageSync() { Object.keys(storage).forEach(key => delete storage[key]); },
  showModal(options) { options.success({ confirm: true }); },
  showActionSheet(options) { options.success({ tapIndex: 0 }); },
  showToast() {},
  reLaunch(options) { calls.push({ type: 'reLaunch', url: options.url }); },
  cloud: {
    callFunction(options) {
      calls.push({ type: 'call', name: options.name, data: options.data });
      return Promise.resolve({ result: { ok: true, data: {} } });
    },
    deleteFile(options) {
      removedFiles.push(...options.fileList);
      return Promise.resolve();
    }
  }
};

require('../miniprogram/pages/privacy/privacy.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

(async () => {
  page.onShow();
  assert.strictEqual(page.data.cacheInfo.summary, '1 张离线安全卡、1 份未提交草稿');
  page.clear();
  assert.strictEqual(storage.bugtrail_v4_offlineCard, undefined);
  assert.strictEqual(storage.bugtrail_v4_precheckDraft, undefined);
  assert.strictEqual(page.data.cacheInfo.hasData, false);

  page.deleteEvent();
  await flush();
  assert.deepStrictEqual(calls[0], { type: 'call', name: 'deleteData', data: { action: 'event', clientId: 'e1' } });
  assert.strictEqual(storage.bugtrail_v4_events[0], undefined);
  assert.deepStrictEqual(removedFiles, ['cloud://env/event.jpg']);

  page.deleteAccount();
  await flush();
  assert.deepStrictEqual(calls[1], { type: 'call', name: 'deleteData', data: { action: 'account' } });
  assert.deepStrictEqual(storage, {});
  assert.strictEqual(app.globalData.user, null);
  assert.deepStrictEqual(calls[2], { type: 'reLaunch', url: '/pages/login/login' });

  console.log('privacy page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
