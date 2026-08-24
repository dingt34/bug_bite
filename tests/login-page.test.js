const assert = require('assert');

let pageDefinition = null;
let storedUser = null;
let navigatedBack = false;
const app = { globalData: { userInfo: null } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.getCurrentPages = () => [{}, {}];
global.setTimeout = callback => callback();
global.wx = {
  getStorageSync() { return storedUser; },
  setStorageSync(key, value) {
    if (key === 'userInfo') storedUser = value;
  },
  showToast() {},
  navigateBack() { navigatedBack = true; },
  switchTab() {}
};

require('../miniprogram/pages/login/login.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.doLocalLogin();
assert.ok(page.data.errorMessage.includes('确认'));
assert.strictEqual(storedUser, null);

page.toggleUnderstood();
page.doLocalLogin();
assert.strictEqual(storedUser.mode, 'local_demo');
assert.strictEqual(app.globalData.userInfo.displayName, '山野观察员');
assert.strictEqual(navigatedBack, true);

console.log('login page tests passed');
