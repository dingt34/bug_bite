const assert = require('assert');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');
const cloudSync = require('../miniprogram/utils/cloud-sync.js');

(async () => {
  const merged = cloudSync.mergeSnapshots({
    plans: [{ id: 'p1', updatedAtTimestamp: 20, destinationName: '本机新版' }],
    events: [],
    posts: [],
    postReactions: { post1: { liked: true } }
  }, {
    plans: [
      { id: 'p1', updatedAtTimestamp: 10, destinationName: '云端旧版' },
      { id: 'p2', updatedAtTimestamp: 15, destinationName: '云端计划' }
    ],
    events: [{ id: 'e1', updatedAtTimestamp: 5 }],
    posts: [],
    postReactions: { post1: { collected: true } }
  });
  assert.strictEqual(merged.plans.length, 2);
  assert.strictEqual(merged.plans.find(item => item.id === 'p1').destinationName, '本机新版');
  assert.strictEqual(merged.events[0].id, 'e1');
  assert.deepStrictEqual(merged.postReactions.post1, { collected: true, liked: true });

  const deleted = cloudSync.mergeSnapshots({
    plans: [],
    offlineCard: null,
    cloudTombstones: { plans: { p1: 30 }, offlineCard: 40 }
  }, {
    plans: [{ id: 'p1', updatedAtTimestamp: 20 }],
    offlineCard: { cachedAtTimestamp: 35 },
    cloudTombstones: {}
  });
  assert.strictEqual(deleted.plans.length, 0);
  assert.strictEqual(deleted.offlineCard, null);

  const deletedPost = cloudSync.mergeSnapshots({
    posts: [],
    postComments: { post1: [{ id: 'c1', createdAtTimestamp: 50, text: '本机评论' }] },
    cloudTombstones: { posts: { post1: 40 } }
  }, {
    posts: [{ id: 'post1', createdAtTimestamp: 30 }],
    postComments: { post1: [{ id: 'c2', createdAtTimestamp: 60, text: '云端评论' }] }
  });
  assert.strictEqual(deletedPost.posts.length, 0);
  assert.deepStrictEqual(deletedPost.postComments.post1.map(item => item.id), ['c1', 'c2']);

  assert.deepStrictEqual(
    cloudSync.replacePaths({ imageRefs: ['/tmp/a.jpg'], nested: { path: '/tmp/a.jpg' } }, { '/tmp/a.jpg': 'cloud://env/a.jpg' }),
    { imageRefs: ['cloud://env/a.jpg'], nested: { path: 'cloud://env/a.jpg' } }
  );

  const storage = {
    userInfo: {
      displayName: '云用户', avatarText: '云', mode: 'wechat_cloud',
      cloudUserId: 'openid-test'
    },
    plans: [],
    events: [{ id: 'e1', imageRefs: ['/tmp/event.jpg'], updatedAtTimestamp: 10 }],
    posts: [],
    postReactions: {},
    reportedPosts: {}
  };
  let pushedSnapshot = null;
  config.ENV_ID = 'cloud-test-env';
  cloudService.resetForTests();
  const wxApi = {
    getStorageSync(key) { return storage[key]; },
    setStorageSync(key, value) { storage[key] = value; },
    removeStorageSync(key) { delete storage[key]; },
    cloud: {
      init() {},
      uploadFile() { return Promise.resolve({ fileID: 'cloud://env/event.jpg' }); },
      callFunction(options) {
        pushedSnapshot = options.data.snapshot;
        return Promise.resolve({ result: { success: true } });
      }
    }
  };
  await cloudSync.pushNow(wxApi);
  assert.strictEqual(pushedSnapshot.events[0].imageRefs[0], 'cloud://env/event.jpg');
  assert.strictEqual(storage.cloudFileMap['/tmp/event.jpg'], 'cloud://env/event.jpg');

  config.ENV_ID = '';
  cloudService.resetForTests();
  console.log('cloud sync tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
