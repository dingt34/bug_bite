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
    extend: {
      AI: {
        createModel() {
          return {
            async streamText() {
              return {
                textStream: {
                  async *[Symbol.asyncIterator]() { yield '建议先观察危险信号。'; }
                }
              };
            }
          };
        }
      }
    }
  }
};

config.AI_BOT_ID = '';
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
  assert.strictEqual(page.data.messages.at(-1).content, '建议先观察危险信号。');

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
  const selectedMessage = page.data.messages.find(item => String(item.content).includes('已发送所选记录'));
  assert.ok(selectedMessage);
  assert.ok(selectedMessage.content.includes('0 个计划，1 条事件'));
  assert.ok(selectedMessage.requestContent.includes('局部发红'));
  assert.ok(!selectedMessage.requestContent.includes('杭州'));
  assert.strictEqual(page.data.recordSelectorVisible, false);
  cloudService.resetForTests();
  console.log('ai chat page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
