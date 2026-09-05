const assert = require('assert');

let definition;
const storage = {
  bugtrail_v4_safetyDraft: {
    sessionId: 'session_photo',
    screened: true,
    dangerSignals: [],
    contactType: 'bite',
    symptoms: ['红肿'],
    systemicSymptoms: ['无明显全身不适'],
    range: '1 处',
    trend: '基本不变',
    facts: { occurredAt: '今天', biteFeel: '不确定' }
  }
};

global.Page = page => { definition = page; };
global.getApp = () => ({ globalData: {} });
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  chooseMedia(options) {
    options.success({ tempFiles: [{ tempFilePath: '/tmp/evidence.jpg' }] });
  },
  saveFile(options) {
    options.success({ savedFilePath: 'wxfile://usr/evidence.jpg' });
    if (options.complete) options.complete();
  },
  showToast() {},
  redirectTo() {},
  navigateTo() {}
};

require('../miniprogram/pages/guide/guide.js');
const page = Object.assign({}, definition, {
  data: Object.assign({}, definition.data),
  setData(update, callback) {
    this.data = Object.assign({}, this.data, update);
    if (callback) callback();
  }
});

page.onLoad({ type: 'bite' });
page.addPhoto();
assert.strictEqual(page.data.photo, 'wxfile://usr/evidence.jpg');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.photo, 'wxfile://usr/evidence.jpg');
assert.strictEqual(page.data.extraQuestions
  .find(item => item.key === 'actionsTaken')
  .options.some(item => item.value === '尚未处理'), true);
assert.strictEqual(page.data.extraQuestions
  .find(item => item.key === 'actionsTaken')
  .options.some(item => /挤压/.test(item.value)), false);

console.log('guide image page tests passed');
