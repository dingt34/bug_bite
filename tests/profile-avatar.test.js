const assert = require('assert');

(async () => {
  let pageDefinition = null;
  let tempUrlCalls = 0;
  const userInfo = {
    id: 'cloud_openid-test',
    cloudUserId: 'openid-test',
    displayName: '微信测试用户',
    avatarText: '微',
    avatarUrl: 'cloud://env/avatars/avatar.jpg',
    mode: 'wechat_cloud'
  };

  global.Page = definition => { pageDefinition = definition; };
  global.getApp = () => ({ globalData: { latestPlan: null } });
  global.wx = {
    cloud: {
      init() {},
      getTempFileURL(options) {
        tempUrlCalls += 1;
        assert.deepStrictEqual(options.fileList, [userInfo.avatarUrl]);
        return Promise.resolve({
          fileList: [{ fileID: userInfo.avatarUrl, tempFileURL: 'https://example.test/avatar.jpg' }]
        });
      },
      callFunction() { return Promise.reject(new Error('stats unavailable in avatar test')); }
    },
    getStorageSync(key) {
      if (key === 'userInfo') return userInfo;
      if (key === 'events') return [];
      return null;
    }
  };

  delete require.cache[require.resolve('../miniprogram/pages/profile/profile.js')];
  require('../miniprogram/pages/profile/profile.js');
  const page = Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    getTabBar() { return null; },
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });

  page.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.strictEqual(tempUrlCalls, 1, '个人页应将云头像解析成可访问地址');
  assert.strictEqual(page.data.avatarUrl, 'https://example.test/avatar.jpg');
  assert.strictEqual(page.data.avatarLoadFailed, false);

  page.onAvatarError();
  assert.strictEqual(page.data.avatarLoadFailed, true, '头像加载失败时应启用文字头像回退');

  console.log('profile avatar tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
