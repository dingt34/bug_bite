const assert = require('assert');

let pageDefinition = null;
let posts = [];
let navigatedBack = false;
const userInfo = {
  id: 'local_demo_user',
  displayName: '山野观察员',
  avatarText: '山',
  mode: 'local_demo'
};

global.Page = definition => { pageDefinition = definition; };
global.setTimeout = callback => callback();
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return userInfo;
    if (key === 'posts') return posts;
    return null;
  },
  setStorageSync(key, value) {
    if (key === 'posts') posts = value;
  },
  saveFile(options) {
    options.success({ savedFilePath: 'wxfile://usr/community.jpg' });
  },
  showToast() {},
  showModal() {},
  navigateBack() { navigatedBack = true; }
};

require('../miniprogram/pages/post-publish/post-publish.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.publish();
assert.strictEqual(posts.length, 0);
assert.ok(page.data.validationMessage.includes('经历内容'));

page.setData({
  text: '记录一次林地活动后的叮咬经历',
  previewImage: '/tmp/community.jpg',
  contactType: 'bite',
  contactTypeName: '叮咬',
  stage: '观察中',
  region: '丽水'
});
page.publish();
assert.strictEqual(posts.length, 1);
assert.strictEqual(posts[0].displayName, '山野观察员');
assert.deepStrictEqual(posts[0].imageRefs, ['wxfile://usr/community.jpg']);
assert.deepStrictEqual(posts[0].tags, ['丽水', '叮咬', '观察中']);
assert.strictEqual(navigatedBack, true);

page.publish();
assert.strictEqual(posts.length, 1);

console.log('post publish page tests passed');
