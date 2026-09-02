const assert = require('assert');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');

(async () => {
  let pageDefinition = null;
  let storedUser = null;
  let navigatedBack = false;
  const app = { globalData: { userInfo: null } };
  const functionCalls = [];

  config.ENV_ID = 'cloud-test-env';
  cloudService.resetForTests();
  global.Page = definition => { pageDefinition = definition; };
  global.getApp = () => app;
  global.getCurrentPages = () => [{}, {}];
  global.wx = {
    cloud: {
      init() {},
      uploadFile() { return Promise.resolve({ fileID: 'cloud://env/avatar.jpg' }); },
      callFunction(options) {
        functionCalls.push(options.name + ':' + (options.data.action || 'login'));
        if (options.name === 'login') {
          return Promise.resolve({
            result: {
              userId: 'openid-test',
              displayName: '微信测试用户',
              avatarUrl: 'cloud://env/avatar.jpg',
              createdAtTimestamp: 100
            }
          });
        }
        if (options.data.action === 'pull') return Promise.resolve({ result: { snapshot: null } });
        return Promise.resolve({ result: { success: true } });
      }
    },
    getStorageSync(key) {
      if (key === 'userInfo') return storedUser;
      if (key === 'plans' || key === 'events' || key === 'posts') return [];
      if (key === 'postReactions' || key === 'reportedPosts' || key === 'cloudFileMap') return {};
      return null;
    },
    setStorageSync(key, value) {
      if (key === 'userInfo') storedUser = value;
    },
    removeStorageSync() {},
    showToast() {},
    navigateBack() { navigatedBack = true; },
    switchTab() {}
  };

  delete require.cache[require.resolve('../miniprogram/pages/login/login.js')];
  require('../miniprogram/pages/login/login.js');
  const page = Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
  page.onLoad();
  page.setData({ nickname: '微信测试用户', avatarUrl: '/tmp/avatar.jpg' });
  page.doLogin();
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.strictEqual(storedUser.mode, 'wechat_cloud');
  assert.strictEqual(storedUser.cloudUserId, 'openid-test');
  assert.strictEqual(storedUser.avatarUrl, 'cloud://env/avatar.jpg');
  assert.strictEqual(app.globalData.userInfo.displayName, '微信测试用户');
  assert.deepStrictEqual(functionCalls, ['login:login', 'syncData:pull', 'syncData:push']);
  assert.strictEqual(navigatedBack, true);

  config.ENV_ID = '';
  cloudService.resetForTests();
  console.log('wechat login page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
