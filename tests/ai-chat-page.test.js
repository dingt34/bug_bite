const assert = require('assert');
const fs = require('fs');
const path = require('path');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let lastCloudData = null;
let deletedFileIds = [];
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
    uploadFile() { return Promise.resolve({ fileID: 'cloud://temporary/insect.jpg' }); },
    deleteFile(options) {
      deletedFileIds = options.fileList;
      return Promise.resolve({ fileList: options.fileList });
    },
    callFunction(options) {
      lastCloudData = options.data;
      return Promise.resolve({ result: { ok: true, text: '## 建议\n\n- 观察危险信号\n- 记录变化' } });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/ai-chat/ai-chat.js');

const styles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/ai-chat/ai-chat.wxss'), 'utf8');
const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/ai-chat/ai-chat.wxml'), 'utf8');
assert.ok(styles.includes('min-width: 0;'), '输入框应允许在 Flex 中收缩，避免覆盖发送按钮');
assert.ok(styles.includes('z-index: 2;'), '发送按钮应位于原生 textarea 点击层之上');
assert.ok(template.includes('bindconfirm="sendMessage"'), '输入法发送动作应直接触发消息发送');
assert.ok(template.includes('bindtap="sendMessage"'), '发送按钮应直接绑定已有消息发送方法');
assert.ok(template.includes('bindtap="sendImageMessage"'), '图片消息应通过明确同意后的独立发送动作提交');
assert.ok(template.includes('点击“同意并发送”即同意'), '选图后应直接展示图片上传与分析说明');
assert.ok(template.includes('class="send-button'), '发送控件应使用点击行为稳定的原生 button');
assert.ok(template.includes('<input class="chat-input"'), '聊天输入应避免使用重排后可能覆盖发送按钮的原生 textarea');
assert.ok(!template.includes('<textarea class="chat-input"'), '聊天输入区不应残留原生 textarea');
assert.ok(template.includes('<view class="preview-thumb"'), '图片预览应使用普通视图，避免原生 image 点击层覆盖发送按钮');
assert.ok(!template.includes('<image class="preview-image"'), '图片预览区不应残留会拦截点击的原生 image');
assert.ok(styles.includes('z-index: 10;'), '底部编辑区应位于聊天滚动层之上');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

(async () => {
  page.onLoad();
  assert.strictEqual(page.data.aiAvailable, true);
  assert.strictEqual(page.data.imageAvailable, true);
  assert.strictEqual(page.data.modeText, '千问多模态');
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

  page.setData({
    inputText: '请描述虫体特征',
    images: [{ kind: 'insect', label: '虫体图片', path: 'C:/temp/insect.jpg' }]
  });
  page.sendImageMessage();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepStrictEqual(lastCloudData.fileIds, ['cloud://temporary/insect.jpg']);
  assert.deepStrictEqual(lastCloudData.imageKinds, ['insect']);
  assert.deepStrictEqual(deletedFileIds, ['cloud://temporary/insect.jpg']);
  assert.strictEqual(page.pendingFileIds.length, 0);
  cloudService.resetForTests();
  console.log('ai chat page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
