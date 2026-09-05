const assert = require('assert');

let pageDefinition = null;
let navigatedUrl = '';
const storage = {};

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => ({ globalData: { cloudReady: false } });
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  getSystemInfoSync() { return { platform: 'devtools' }; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast() {}
};

require('../miniprogram/pages/camera/camera.js');

function createPage(photo) {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data, { photo: photo || '' }),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

const page = createPage('wxfile://skin-photo.jpg');
page.record();
assert.strictEqual(navigatedUrl, '/pages/danger/danger?source=camera');
assert.ok(storage.bugtrail_v4_safetyDraft.sessionId, '入口应创建新的安全记录会话');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.screened, false, '入口不得绕过危险信号排查');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.photo, 'wxfile://skin-photo.jpg', '当前照片应带入本机记录草稿');

const previousSessionId = storage.bugtrail_v4_safetyDraft.sessionId;
const dangerPage = createPage('');
dangerPage.danger();
assert.notStrictEqual(storage.bugtrail_v4_safetyDraft.sessionId, previousSessionId, '再次进入应开始独立记录');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.photo, '');

console.log('camera page tests passed');
