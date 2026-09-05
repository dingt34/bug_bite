const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/precheck-result/precheck-result.wxml'), 'utf8');
assert.ok(template.includes('wx:for="{{sections}}"'));
assert.ok(template.includes('{{section.title}}'));
assert.ok(template.includes('{{section.subtitle}}'));
assert.ok(template.includes('清单进度已自动保存'));
assert.ok(template.includes('class="primary-btn" bindtap="saveOffline"'));
assert.strictEqual(template.includes('bindtap="save">保存行程进度'), false, '自动保存后不应保留重复的手动保存按钮');
assert.ok(template.includes('class="vector-alert"'));
assert.ok(template.includes('虫媒提示'));
assert.ok(template.includes('不代表目的地虫媒病风险预测'));
assert.ok(template.includes('bindtap="home">返回首页'));
assert.ok(template.includes('class="text-action" bindtap="plans">查看我的行程'));
assert.ok(template.includes('class="text-action" bindtap="home">返回首页'));
assert.strictEqual(template.includes('home-action'), false, '两个弱化入口应使用同一视觉样式');

const tabBarStyles = fs.readFileSync(path.join(__dirname, '../miniprogram/custom-tab-bar/index.wxss'), 'utf8');
assert.ok(tabBarStyles.includes('--tab-label-size:20rpx'));
assert.ok(tabBarStyles.includes('font-size:var(--tab-label-size)!important'));

let pageDefinition = null;
const plan = {
  id: 'plan_page_001', destinationName: '丽水古堰画乡', regionCodes: ['丽水'], month: '8月', activityType: '徒步登山',
  ruleSnapshot: {
    ruleVersion: 'precheck-kb-1.2.0', riskTags: ['山地林地'], riskSummary: '场景化建议',
    checklist: ['准备长袖长裤'], activityTips: ['走步道中央'], returnCheck: ['检查衣物'],
    knowledgeMatches: [{ objectId: 'tick', name: '硬蜱接触场景', reason: '高草与林地场景', packVersion: '1.0.0', ruleVersion: '1.0.0', status: 'DRAFT' }],
    knowledgeMeta: { interfaceVersion: '1.0.0', reviewStatus: 'DRAFT', catalogSize: 45, matchedCount: 1 }
  }
};
const storage = { bugtrail_v4_plans: [plan], bugtrail_v4_currentPlan: plan };
let switchedUrl = '';

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  showToast() {},
  showModal() { throw new Error('valid plan should not show an error modal'); },
  navigateTo() {}, redirectTo() {}, switchTab(options) { switchedUrl = options.url; }
};
global.getApp = () => ({ globalData: { cloudReady: false } });

require('../miniprogram/pages/precheck-result/precheck-result.js');

function createPage() {
  return Object.assign({}, pageDefinition, { data: Object.assign({}, pageDefinition.data), setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); } });
}

const page = createPage();
page.onLoad({ planId: plan.id });
assert.strictEqual(page.data.plan.id, plan.id);
assert.strictEqual(page.data.sections.length, 3);
assert.strictEqual(page.data.totalCount, 3);
assert.strictEqual(page.data.riskTitle, '山地林地');
assert.strictEqual(page.data.rule.knowledgeMatches[0].objectId, 'tick');
page.saveOffline();
assert.strictEqual(storage.bugtrail_v4_offlineCard.plan.id, plan.id);
page.home();
assert.strictEqual(switchedUrl, '/pages/home/home');

const offlinePage = createPage();
offlinePage.onLoad({ source: 'offline' });
assert.strictEqual(offlinePage.data.isOffline, true);
assert.strictEqual(offlinePage.data.plan.id, plan.id);

console.log('precheck result page tests passed');
