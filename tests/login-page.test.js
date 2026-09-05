const assert = require('assert');

let definition;
let navigatedUrl = '';

global.Page = page => { definition = page; };
global.wx = {
  getStorageSync() { return false; },
  setStorageSync() {},
  navigateTo(options) { navigatedUrl = options.url; }
};

require('../miniprogram/pages/login/login.js');
const page = Object.assign({}, definition);

assert.strictEqual(typeof page.onShow, 'undefined', '按需登录页不应在已有本地资料时强制离开');
page.login();
assert.strictEqual(navigatedUrl, '/pages/profile-edit/profile-edit');
page.openPrivacy();
assert.strictEqual(navigatedUrl, '/pages/privacy/privacy');

console.log('login page tests passed');
