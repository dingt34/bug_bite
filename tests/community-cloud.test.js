const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');
const communityCloud = require('../miniprogram/utils/community-cloud.js');

(async () => {
  let deletedFiles = [];
  const failedWx = {
    cloud: {
      init() {},
      uploadFile() { return Promise.resolve({ fileID: 'cloud://env/failed.jpg' }); },
      deleteFile(options) {
        deletedFiles = options.fileList;
        return Promise.resolve({ fileList: [] });
      },
      callFunction() { return Promise.reject(new Error('publish failed')); }
    }
  };
  cloudService.resetForTests();
  await assert.rejects(() => communityCloud.publish(failedWx, {
    text: '记录一次林地活动后的经历', previewImage: '/tmp/a.jpg',
    contactType: 'bite', contactTypeName: '叮咬', stage: '观察中'
  }, { displayName: '云用户' }), /publish failed/);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepStrictEqual(deletedFiles, ['cloud://env/failed.jpg']);

  const storage = {
    posts: [{
      id: 'legacy_post', local: true, text: '旧版本保存的林地经历',
      region: '丽水', contactType: 'bite', stage: '观察中', tags: ['丽水', '叮咬', '观察中'], imageRefs: []
    }],
    postComments: { legacy_post: [{ id: 'legacy_comment', text: '旧版本评论', displayName: '云用户' }] },
    postReactions: { legacy_post: { liked: true, collected: true } }
  };
  const actions = [];
  const wxApi = {
    getStorageSync(key) { return storage[key]; },
    setStorageSync(key, value) { storage[key] = value; },
    cloud: {
      init() {},
      callFunction(options) {
        const action = options.data.action;
        actions.push(action);
        if (action === 'publish') return Promise.resolve({ result: { post: { id: 'cloud_post' } } });
        if (action === 'comment') return Promise.resolve({ result: { comment: { id: 'cloud_comment' } } });
        if (action === 'toggleReaction') return Promise.resolve({ result: { reaction: {} } });
        if (action === 'stats') return Promise.resolve({ result: { posts: 1, comments: 1, collections: 1 } });
        return Promise.resolve({ result: {} });
      }
    }
  };
  cloudService.resetForTests();
  const profile = { displayName: '云用户', avatarText: '云', mode: 'wechat_cloud' };
  await communityCloud.migrateLegacy(wxApi, profile);
  assert.strictEqual(storage.communityMigrationV1.completed, true);
  assert.strictEqual(storage.communityMigrationV1.postMap.legacy_post, 'cloud_post');
  assert.deepStrictEqual(actions, ['publish', 'comment', 'toggleReaction', 'toggleReaction', 'stats']);
  await communityCloud.migrateLegacy(wxApi, profile);
  assert.deepStrictEqual(actions, ['publish', 'comment', 'toggleReaction', 'toggleReaction', 'stats']);
  cloudService.resetForTests();
  console.log('community cloud tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
