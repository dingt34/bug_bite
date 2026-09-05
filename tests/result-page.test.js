const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/result/result.wxml'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/result/result.wxss'), 'utf8');
assert.ok(template.includes('action-link-edit'));
assert.ok(template.includes('action-link-record'));
assert.ok(template.includes('action-link-home'));
assert.ok(styles.includes('.action-links { display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'));
assert.ok(styles.includes('.action-link-record { border:1rpx solid #d4e6da;background:#e7f2eb'));
assert.ok(styles.includes('.result-page .safe-top { min-height:16rpx; }'));

let definition;
let redirectedUrl = '';
const now = Date.now();
const storage = {
  bugtrail_v4_events: [],
  bugtrail_v4_safetyDraft: {
    sessionId: 'session_result',
    screened: true,
    dangerSignals: [],
    contactType: 'bite',
    symptoms: ['红肿'],
    systemicSymptoms: ['无明显全身不适'],
    range: '1 处',
    trend: '基本不变',
    facts: { occurredAt: '今天', bodyParts: ['下肢'], biteFeel: '不确定' }
  }
};

global.Page = page => { definition = page; };
global.getCurrentPages = () => [];
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  showToast() {},
  redirectTo(options) { redirectedUrl = options.url; },
  switchTab() {},
  navigateTo() {},
  setClipboardData() {},
  makePhoneCall() {}
};

require('../miniprogram/pages/result/result.js');
function createPage() {
  return Object.assign({}, definition, {
    data: Object.assign({}, definition.data),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

const page = createPage();
page.onLoad();
assert.strictEqual(redirectedUrl, '');
assert.strictEqual(storage.bugtrail_v4_events.length, 1);
assert.strictEqual(storage.bugtrail_v4_events[0].sessionId, 'session_result');
assert.strictEqual(storage.bugtrail_v4_events[0].riskLevel, 'observe');
assert.ok(storage.bugtrail_v4_events[0].nextReviewAtTimestamp > now);
assert.strictEqual(page.data.summaryLines.some(line => line.includes('下肢')), true);

const refreshed = createPage();
refreshed.onLoad();
assert.strictEqual(storage.bugtrail_v4_events.length, 1, '刷新结果页不应重复创建事件');

console.log('result page tests passed');
