const assert = require('assert');
const auth = require('../miniprogram/utils/auth.js');

const created = auth.createDemoUser(12345);
assert.strictEqual(created.mode, 'local_demo');
assert.strictEqual(created.createdAtTimestamp, 12345);

assert.strictEqual(auth.normalizeUserInfo(null), null);
assert.strictEqual(auth.normalizeUserInfo({}), null);
assert.deepStrictEqual(
  auth.normalizeUserInfo({ displayName: '旧体验用户', avatarText: '旧' }),
  {
    id: 'local_demo_user',
    displayName: '旧体验用户',
    avatarText: '旧',
    mode: 'local_demo',
    avatarUrl: '',
    cloudUserId: '',
    cloudSyncAtTimestamp: 0,
    sessionVersion: auth.SESSION_VERSION,
    createdAtTimestamp: 0
  }
);

let stored = null;
const wxApi = {
  getStorageSync() { return stored; },
  setStorageSync(key, value) {
    assert.strictEqual(key, 'userInfo');
    stored = value;
  }
};
auth.saveLocalUser(wxApi, created);
assert.strictEqual(auth.readLocalUser(wxApi).displayName, '山野观察员');

console.log('auth tests passed');
