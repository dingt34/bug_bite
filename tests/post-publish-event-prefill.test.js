const assert = require('assert');

let pageDefinition = null;
let savedDraft = null;
let actionItems = [];
let toastTitle = '';

const eventRecord = {
  id: 'event_recent',
  contactType: 'bite',
  contactTypeName: '吸血或普通叮咬',
  occurredAt: '1–6小时',
  summary: '左小腿出现少量红斑和瘙痒，已经清洁并持续观察。',
  riskLevel: 'observe',
  updatedAtTimestamp: 2000,
  imageRefs: ['/private/event-wound.jpg']
};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return { mode: 'wechat_cloud', displayName: '测试用户' };
    if (key === 'events') return [eventRecord];
    return null;
  },
  setStorageSync(key, value) {
    if (key === 'communityPostDraftV1') savedDraft = value;
  },
  removeStorageSync() {},
  showActionSheet(options) {
    actionItems = options.itemList;
    options.success({ tapIndex: 0 });
  },
  showModal() {},
  showToast(options) { toastTitle = options.title; },
  navigateTo() {},
  cloud: { init() {} }
};

require('../miniprogram/pages/post-publish/post-publish.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

page.onLoad({});
assert.strictEqual(page.data.hasPreviousEvents, true);
assert.strictEqual(page.previousEvents.length, 1);

page.setData({ previewImage: '/tmp/chosen-share-image.jpg' });
page.choosePreviousEvent();

assert.strictEqual(actionItems.length, 1);
assert.ok(actionItems[0].includes('吸血或普通叮咬'));
assert.strictEqual(page.data.contactType, 'bite');
assert.strictEqual(page.data.contactTypeName, '吸血或普通叮咬');
assert.strictEqual(page.data.stage, '观察中');
assert.ok(page.data.text.includes('左小腿出现少量红斑'));
assert.strictEqual(page.data.previewImage, '/tmp/chosen-share-image.jpg');
assert.ok(page.data.selectedEventLabel.includes('1–6小时'));
assert.strictEqual(savedDraft.contactType, 'bite');
assert.ok(toastTitle.includes('图片未自动添加'));

console.log('post publish event prefill tests passed');
