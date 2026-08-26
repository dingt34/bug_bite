const assert = require('assert');

(async () => {
  let pageDefinition = null;
  let tempUrlCalls = 0;
  let resolvedTempURL = 'https://example.test/avatar.jpg';
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
          fileList: [{ fileID: userInfo.avatarUrl, tempFileURL: resolvedTempURL }]
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
  assert.notStrictEqual(
    page.data.avatarUrl,
    userInfo.avatarUrl,
    '云文件 ID 解析完成前不应直接交给 image 组件渲染'
  );
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.strictEqual(tempUrlCalls, 1, '个人页应将云头像解析成可访问地址');
  assert.strictEqual(page.data.avatarUrl, 'https://example.test/avatar.jpg');
  assert.strictEqual(page.data.avatarLoadFailed, false);

  page.onAvatarError();
  assert.strictEqual(page.data.avatarLoadFailed, true, '头像加载失败时应启用文字头像回退');

  resolvedTempURL = '';
  page.onShow();
  assert.strictEqual(page.data.avatarUrl, '', '重新解析期间应继续显示文字头像');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.avatarUrl, '', '解析失败后不应回填 cloud 文件 ID');
  assert.strictEqual(page.data.avatarLoadFailed, true, '解析失败后应保持文字头像回退');

  console.log('profile avatar tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
