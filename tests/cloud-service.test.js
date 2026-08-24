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
      deleteFile(options) {
        calls.push(['delete', options.fileList.length]);
        return Promise.resolve({ fileList: [] });
      }
    }
  };

  assert.strictEqual(cloudService.init(wxApi).available, true);
  assert.deepStrictEqual(await cloudService.login(wxApi, { displayName: '测试' }), { ok: true });
  assert.strictEqual((await cloudService.uploadFile(wxApi, 'a.jpg', '/tmp/a.jpg')).fileID, 'cloud://test/file.jpg');
  await cloudService.deleteFiles(wxApi, ['cloud://test/file.jpg']);
  assert.deepStrictEqual(calls.map(item => item[0]), ['init', 'call', 'upload', 'delete']);

  config.ENV_ID = '';
  cloudService.resetForTests();
  console.log('cloud service tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
