const assert = require('assert');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
const storage = {
  plans: [{ id: 'p1', destinationName: '杭州', month: '8月', activityType: '徒步' }],
  events: [{ id: 'e1', contactTypeName: '叮咬', occurredAt: '今天', summary: '局部发红' }]
};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return storage[key]; },
  showToast() {},
  showModal(options) { if (options.success) options.success({ confirm: true }); },
  navigateTo() {},
  cloud: {
    init() {},
    deleteFile() { return Promise.resolve({ fileList: [] }); },
    callFunction() {
      return Promise.resolve({ result: { ok: true, text: '## 建议\n\n- 观察危险信号\n- 记录变化' } });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/ai-chat/ai-chat.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

(async () => {
  page.onLoad();
  assert.strictEqual(page.data.aiAvailable, true);
  page.onInput({ detail: { value: '被虫咬后需要注意什么？' } });
  page.sendMessage();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.sending, false);
  assert.ok(page.data.messages.at(-1).content.includes('观察危险信号'));
  assert.ok(page.data.messages.at(-1).markdownHtml.includes('<h2>建议</h2>'));

  const previousCount = page.data.messages.length;
  page.sendRecords();
  assert.strictEqual(page.data.recordSelectorVisible, true);
  assert.strictEqual(page.data.selectedRecordCount, 0);
  assert.strictEqual(page.data.selectablePlans.length, 1);
  assert.strictEqual(page.data.selectableEvents.length, 1);
  page.toggleRecord({ currentTarget: { dataset: { type: 'event', index: 0 } } });
  assert.strictEqual(page.data.selectedRecordCount, 1);
  page.confirmSendRecords();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(page.data.messages.length > previousCount);
  const selectedMessage = page.data.messages.find(item => item.recordCards && item.recordCards.length);
  assert.ok(selectedMessage);
  assert.strictEqual(selectedMessage.recordCards.length, 1);
  assert.strictEqual(selectedMessage.recordCards[0].badge, '接触事件');
  assert.strictEqual(selectedMessage.recordCards[0].detail, '局部发红');
  assert.ok(selectedMessage.requestContent.includes('局部发红'));
  assert.ok(!selectedMessage.requestContent.includes('杭州'));
  assert.strictEqual(page.data.recordSelectorVisible, false);
  cloudService.resetForTests();
  console.log('ai chat page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
