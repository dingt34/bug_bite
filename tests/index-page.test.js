const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let lastUrl = '';
global.Page = definition => { pageDefinition = definition; };
global.wx = { navigateTo(options) { lastUrl = options.url; } };

require('../miniprogram/pages/index/index.js');
pageDefinition.goAiChat();
assert.strictEqual(lastUrl, '/pages/ai-chat/ai-chat');
pageDefinition.goInsectGuide();
assert.strictEqual(lastUrl, '/pages/insect-guide/insect-guide');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/index/index.wxml'), 'utf8');
assert.ok(template.includes('AI建议助手'));
assert.ok(template.includes('常见虫种对比图鉴'));
assert.ok(template.includes('14 个物种 · 42 张图'));
assert.strictEqual(template.includes('识别昆虫'), false);

console.log('index page tests passed');
