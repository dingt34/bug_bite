const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/event-detail/event-detail.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/event-detail/event-detail.wxss'), 'utf8');

assert.ok(template.includes('class="card detail-hero'));
assert.ok(template.includes('class="review-panel"'));
assert.ok(template.includes('class="card summary-card"'));
assert.ok(template.includes('class="card photo-empty"'));
assert.ok(template.includes('复制就医摘要'));
assert.ok(template.includes('不会自动发送图片'));
assert.ok(template.includes('<rich-text class="note-markdown"'));
assert.ok(template.indexOf('class="action-grid"') < template.indexOf('<text>事件信息</text>'));
assert.ok(styles.includes('.summary-row{display:grid'));
assert.ok(styles.includes('@media (max-width:360px)'));

let definition;
let storedEvents = [{
  id: 'event_detail_001', contactType: 'bite', type: '蚊虫叮咬', riskLevel: 'observe',
  createdAtTimestamp: Date.now() - 60000, nextReviewAtTimestamp: Date.now() + 3600000,
  status: '待复查', body: '小腿', place: '杭州西湖', symptoms: ['红肿'],
  systemicSymptoms: [], measures: ['清洁'], trend: '基本不变', imageRefs: [],
  notes: [{ id: 'note_001', text: '## 处理建议\n\n- **继续观察**\n- 记录变化' }]
}];

global.Page = page => { definition = page; };
global.getApp = () => ({ globalData: { cloudReady: false } });
global.wx = {
  getStorageSync() {}, setStorageSync() {}, removeStorageSync() {}, showModal() {}, navigateTo() {},
  switchTab() {}, showActionSheet() {}, showToast() {}, chooseMedia() {}, setClipboardData() {}
};

const store = require('../miniprogram/utils/store');
const originalGet = store.get;
const originalSet = store.set;
store.get = key => key === 'events' ? storedEvents : null;
store.set = (key, value) => { if (key === 'events') storedEvents = value; };

require('../miniprogram/pages/event-detail/event-detail.js');
const page = Object.assign({}, definition, {
  data: Object.assign({}, definition.data),
  setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
});
page.onLoad({ id: 'event_detail_001' });
page.loadEvent();
assert.strictEqual(page.data.event.place, '杭州西湖');
assert.strictEqual(page.data.isPending, true);
assert.strictEqual(page.data.imageCount, 0);
assert.ok(page.data.notes[0].markdownHtml.includes('<h2>处理建议</h2>'));
assert.ok(page.data.notes[0].markdownHtml.includes('<strong>继续观察</strong>'));

store.get = originalGet;
store.set = originalSet;
console.log('event detail page tests passed');
