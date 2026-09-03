const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let navigatedBack = false;
let publishCalls = 0;
let uploadedPath = '';
const userInfo = {
  id: 'cloud_user', displayName: '山野观察员', avatarText: '山', mode: 'wechat_cloud'
};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return userInfo;
    return null;
  },
  setStorageSync() {},
  chooseImage() {},
  showToast() {},
  showModal() {},
  navigateBack() { navigatedBack = true; },
  cloud: {
    init() {},
    uploadFile(options) {
      uploadedPath = options.filePath;
      return Promise.resolve({ fileID: 'cloud://env/community.jpg' });
    },
    deleteFile() { return Promise.resolve({ fileList: [] }); },
    callFunction(options) {
      if (options.data.action === 'publish') {
        publishCalls += 1;
        assert.strictEqual(options.data.profile.displayName, '山野观察员');
        assert.deepStrictEqual(options.data.post.imageRefs, ['cloud://env/community.jpg']);
        return Promise.resolve({ result: { post: { id: 'cloud_post_1' } } });
      }
      if (options.data.action === 'stats') return Promise.resolve({ result: { posts: 1, comments: 0, collections: 0 } });
      return Promise.resolve({ result: {} });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/post-publish/post-publish.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

(async () => {
  page.publish();
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
  await new Promise(resolve => setTimeout(resolve, 450));
  assert.strictEqual(publishCalls, 1);
  assert.strictEqual(uploadedPath, '/tmp/community.jpg');
  assert.strictEqual(navigatedBack, true);
  page.publish();
  assert.strictEqual(publishCalls, 1);
  cloudService.resetForTests();
  console.log('post publish page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
