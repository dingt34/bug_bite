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

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/index/index.wxml'), 'utf8');
assert.ok(template.includes('AI建议助手'));
assert.strictEqual(template.includes('识别昆虫'), false);

console.log('index page tests passed');
