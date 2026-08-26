const assert = require('assert');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');

(async () => {
  config.ENV_ID = '';
  cloudService.resetForTests();
  assert.strictEqual(cloudService.init({}).available, false);

  const calls = [];
  config.ENV_ID = 'cloud-test-env';
  cloudService.resetForTests();
  const wxApi = {
    cloud: {
      init(options) { calls.push(['init', options.env]); },
      callFunction(options) {
        calls.push(['call', options.name]);
        return Promise.resolve({ result: { ok: true } });
      },
      uploadFile(options) {
        calls.push(['upload', options.cloudPath]);
        return Promise.resolve({ fileID: 'cloud://test/file.jpg' });
      },
      getTempFileURL(options) {
        calls.push(['temp-url', options.fileList[0]]);
        return Promise.resolve({ fileList: [{ fileID: options.fileList[0], status: -1 }] });
      },
      deleteFile(options) {
        calls.push(['delete', options.fileList.length]);
        return Promise.resolve({ fileList: [] });
      }
    }
  };

  assert.strictEqual(cloudService.init(wxApi).available, true);
  assert.deepStrictEqual(await cloudService.login(wxApi, { displayName: '测试' }), { ok: true });
  assert.strictEqual((await cloudService.uploadFile(wxApi, 'a.jpg', '/tmp/a.jpg')).fileID, 'cloud://test/file.jpg');
  assert.strictEqual(
    await cloudService.resolveFileURL(wxApi, 'cloud://test/missing.jpg'),
    '',
    '临时链接解析失败时应返回空地址，不能把 cloud 文件 ID 交给 image'
  );
  await cloudService.deleteFiles(wxApi, ['cloud://test/file.jpg']);
  assert.deepStrictEqual(calls.map(item => item[0]), ['init', 'call', 'upload', 'temp-url', 'delete']);

  config.ENV_ID = '';
  cloudService.resetForTests();
  console.log('cloud service tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
