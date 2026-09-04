const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/review/review.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/review/review.wxss'), 'utf8');

assert.ok(template.includes('class="card review-hero"'));
assert.ok(template.includes('class="card question-card required-card"'));
assert.ok(template.includes('趋势和范围均为必填'));
assert.ok(template.includes("item==='明显减轻'?'choice-good'"));
assert.ok(template.includes("item==='逐渐加重'?'choice-alert'"));
assert.ok(template.includes('图片不会自动发送给 AI'));
assert.ok(template.includes('提交后会追加到恢复时间线，不会覆盖首次结果'));
assert.ok(template.indexOf('整体变化') < template.indexOf('局部表现'));
assert.ok(template.indexOf('局部表现') < template.indexOf('全身表现'));
assert.ok(styles.includes('.choice-good.selected'));
assert.ok(styles.includes('.choice-alert.selected'));
assert.ok(styles.includes('@media (max-width:360px)'));

let definition;
const now = Date.now();
let storedEvents = [{
  id: 'review_layout_001', contactType: 'bite', type: '蚊虫叮咬', riskLevel: 'observe',
  createdAtTimestamp: now - 3600000, nextReviewAtTimestamp: now + 3600000,
  status: '待复查', body: '小腿', place: '杭州西湖', symptoms: ['红肿'],
  systemicSymptoms: [], measures: ['清洁'], trend: '基本不变', imageRefs: []
}];

global.Page = page => { definition = page; };
global.getApp = () => ({ globalData: { cloudReady: false } });
global.wx = {
  getStorageSync() {}, setStorageSync() {}, removeStorageSync() {}, showToast() {},
  navigateTo() {}, navigateBack() {}, chooseMedia() {}
};

const store = require('../miniprogram/utils/store');
const originalGet = store.get;
const originalSet = store.set;
store.get = (key, fallback) => key === 'events' ? storedEvents : (key === 'reviewDrafts' ? {} : fallback);
store.set = (key, value) => { if (key === 'events') storedEvents = value; };

require('../miniprogram/pages/review/review.js');
const page = Object.assign({}, definition, {
  data: Object.assign({}, definition.data),
  setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
});
page.onLoad({ id: 'review_layout_001' });
assert.strictEqual(page.data.event.place, '杭州西湖');
assert.strictEqual(page.data.previousSystemicText, '暂无全身不适');
assert.strictEqual(page.data.previousMeasuresText, '清洁');
page.setTrend({ currentTarget: { dataset: { value: '明显减轻' } } });
page.setRange({ currentTarget: { dataset: { value: '缩小' } } });
assert.strictEqual(page.data.trend, '明显减轻');
assert.strictEqual(page.data.range, '缩小');

store.get = originalGet;
store.set = originalSet;
console.log('review page tests passed');
