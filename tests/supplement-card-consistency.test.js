const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const guide = read('miniprogram/pages/guide/guide.wxml');
const guideLogic = read('miniprogram/pages/guide/guide.js');
const precheck = read('miniprogram/pages/precheck/precheck.wxml');
const globalStyle = read('miniprogram/app.wxss');
const guideRequiredStart = guide.indexOf('class="required-contact-section"');
const guideSupplementStart = guide.indexOf('class="supplement-head');

assert.ok(guideRequiredStart >= 0 && guideRequiredStart < guideSupplementStart, '接触分支必填项必须位于选填卡片之前');
assert.ok(guide.includes('class="aside required-aside">必填</text>'), '接触分支问题必须明确标记为必填');

['supplement-head', 'supplement-status', 'supplement-arrow', 'supplement-card', 'branch-question', 'question-label'].forEach(className => {
  assert.ok(guide.includes(className), `描述症状页缺少共享结构：${className}`);
  assert.ok(precheck.includes(className), `行前准备页缺少共享结构：${className}`);
});

assert.ok(guide.includes('<image class="supplement-arrow'));
assert.ok(guideLogic.includes("'口唇/口腔'"), '身体部位必须使用风险规则可识别的标准值');
assert.strictEqual(guideLogic.includes("'口唇 / 口腔'"), false, '页面不应继续生成带空格的旧部位值');
assert.ok(guideLogic.includes("'渗液/脓液'"), '主要表现应提供渗液/脓液选项');
assert.ok(guideLogic.includes("'红肿范围扩大'"), '主要表现应提供红肿范围扩大选项');
assert.ok(precheck.includes('<image class="supplement-arrow'));
assert.strictEqual(/[⌃⌄]/.test(guide.match(/<view class="supplement-head[\s\S]*?<\/view><\/view>/)[0]), false);
assert.strictEqual(/[⌃⌄]/.test(precheck.match(/<view class="supplement-head[\s\S]*?<\/view><\/view>/)[0]), false);
assert.ok(globalStyle.includes('.supplement-card .branch-question .chip-row'));
assert.ok(globalStyle.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));

console.log('supplement card consistency tests passed');
