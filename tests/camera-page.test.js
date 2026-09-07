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

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => ({ globalData: { cloudReady: false } });
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  getSystemInfoSync() { return { platform: 'devtools' }; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast() {},
  showLoading() {},
  hideLoading() {},
  cloud: {
    uploadFile() { return Promise.resolve({ fileID: 'cloud://recognition/test.jpg' }); },
    deleteFile() { return Promise.resolve({ fileList: [] }); }
  }
};

const cloud = require('../miniprogram/utils/cloud.js');
cloud.available = () => true;
const recognitionResult = {
  candidates: [{ objectId: 'mosquito', name: '白纹伊蚊', scientificName: 'Aedes albopictus', summary: '黑白相间的伊蚊候选。' }],
  visibleFeatures: ['足部可见白色环带'],
  uncertainty: '仍需结合胸背花纹继续核对。',
  disclaimer: '只作为图鉴线索，不用于确诊。'
};
cloud.call = (_name, data) => {
  if (data.action === 'enqueue') return Promise.resolve({ jobId: 'job-demo', status: 'pending' });
  if (data.action === 'status') return Promise.resolve({ jobId: 'job-demo', status: 'done', result: recognitionResult });
  return Promise.resolve(recognitionResult);
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
  assert.strictEqual(recognitionPage.data.recognitionStage, '', '识别完成后应清除队列状态文案');
  assert.strictEqual(recognitionPage.data.candidates[0].photo, '/images/insect-guide/aedes-albopictus/01-overview.webp');
  assert.strictEqual(recognitionPage.data.candidates[0].rank, 1);
  assert.strictEqual(recognitionPage.data.recognitionDisclaimer, '只作为图鉴线索，不用于确诊。');
  recognitionPage.closeRecognitionResult();
  assert.strictEqual(recognitionPage.data.recognitionModalVisible, false);
  recognitionPage.openRecognitionResult();
  assert.strictEqual(recognitionPage.data.recognitionModalVisible, true, '结果卡应能再次打开弹窗');

  console.log('camera page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
