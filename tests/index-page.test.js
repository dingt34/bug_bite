const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let lastUrl = '';
global.Page = definition => { pageDefinition = definition; };
global.wx = {
  navigateTo(options) { lastUrl = options.url; },
  switchTab(options) { lastUrl = options.url; }
};

require('../miniprogram/pages/index/index.js');
pageDefinition.goAiChat();
assert.strictEqual(lastUrl, '/pages/ai/ai');
pageDefinition.goInsectGuide();
assert.strictEqual(lastUrl, '/pages/insect-guide/insect-guide');
pageDefinition.goContact();
assert.strictEqual(lastUrl, '/pages/danger/danger');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/index/index.wxml'), 'utf8');
assert.ok(template.includes('AI建议助手'));
assert.ok(template.includes('常见虫种对比图鉴'));
assert.ok(template.includes('29 个物种 · 87 张图'));
assert.ok(template.includes('虫咬与接触处置'));
assert.strictEqual(template.includes('识别昆虫'), false);

console.log('index page tests passed');
