const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/camera/camera.wxml'), 'utf8');
assert.ok(template.includes('wx:if="{{recognitionModalVisible}}"'), '识别页应提供结果弹窗');
assert.ok(template.includes('class="recognition-candidate-card"'), '候选结果应使用稳定的原生卡片布局');
assert.ok(template.includes('class="recognition-candidate-image"'), '候选卡片应显示真实参考图片');
assert.ok(template.includes('class="recognition-feature-list"'), '可见特征应独立排列');
assert.ok(template.includes('class="recognition-disclaimer"'), '安全说明应有独立区域');
assert.ok(template.includes('wx:if="{{!candidates.length}}" class="recognition-empty"'), '空结果应使用独立条件，避免无相邻 wx:if 的 wx:else 编译错误');
assert.ok(!template.includes('loadDemoPhoto'), '识别页不应再提供演示虫图入口');
assert.ok(!template.includes('载入演示虫图'), '识别页不应出现演示图片文案');
assert.ok(!template.includes('demoMode'), '识别页不应保留开发者工具专用分支');

let pageDefinition = null;
let navigatedUrl = '';
const storage = {};
const localRequests = [];
const recognitionResult = {
  candidates: [{ objectId: 'mosquito', name: '白纹伊蚊', scientificName: 'Aedes albopictus', score: 0.82 }],
  uncertain: false,
  topScore: 0.82,
  margin: 0.6,
  model: 'BioCLIP 2',
  device: 'cuda'
};

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => ({ globalData: { cloudReady: false } });
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  getSystemInfoSync() { return { platform: 'devtools' }; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast() {},
  showModal() {},
  showLoading() {},
  hideLoading() {},
  getFileSystemManager() {
    return { readFile(options) { options.success({ data: 'base64-image-data' }); } };
  },
  request(options) {
    localRequests.push(options);
    if (options.url.endsWith('/health')) options.success({ statusCode: 200, data: { ready: true, device: 'cuda', prototypeCount: 45 } });
    else options.success({ statusCode: 200, data: recognitionResult });
  }
};

require('../miniprogram/pages/camera/camera.js');
assert.strictEqual(typeof pageDefinition.loadDemoPhoto, 'undefined', '页面逻辑不应保留演示图片导入方法');

function createPage(photo) {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data, { photo: photo || '' }),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

const page = createPage('wxfile://skin-photo.jpg');
page.record();
assert.strictEqual(navigatedUrl, '/pages/danger/danger?source=camera');
assert.ok(storage.bugtrail_v4_safetyDraft.sessionId, '入口应创建新的安全记录会话');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.screened, false, '入口不得绕过危险信号排查');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.photo, 'wxfile://skin-photo.jpg', '当前照片应带入本机记录草稿');

const previousSessionId = storage.bugtrail_v4_safetyDraft.sessionId;
const dangerPage = createPage('');
dangerPage.danger();
assert.notStrictEqual(storage.bugtrail_v4_safetyDraft.sessionId, previousSessionId, '再次进入应开始独立记录');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.photo, '');

(async () => {
  const recognitionPage = createPage('wxfile://insect-photo.jpg');
  recognitionPage.identify();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(recognitionPage.data.identifying, false);
  assert.strictEqual(recognitionPage.data.recognitionModalVisible, true, '识别完成后应自动打开结果弹窗');
  assert.strictEqual(recognitionPage.data.recognitionStage, '', '识别完成后应清除本机状态文案');
  assert.strictEqual(recognitionPage.data.candidates[0].photo, '/images/insect-guide/aedes-albopictus/01-overview.webp');
  assert.strictEqual(recognitionPage.data.candidates[0].rank, 1);
  assert.ok(recognitionPage.data.recognitionDisclaimer.includes('不用于确诊'));
  assert.strictEqual(localRequests.length, 2, '本地识别应只调用健康检查和识别接口');
  assert.strictEqual(localRequests[0].url, 'http://127.0.0.1:8000/health');
  assert.strictEqual(localRequests[1].url, 'http://127.0.0.1:8000/v1/identify');
  assert.strictEqual(localRequests[1].data.imageBase64, 'base64-image-data');
  recognitionPage.closeRecognitionResult();
  assert.strictEqual(recognitionPage.data.recognitionModalVisible, false);
  recognitionPage.openRecognitionResult();
  assert.strictEqual(recognitionPage.data.recognitionModalVisible, true, '结果卡应能再次打开弹窗');

  console.log('camera page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
