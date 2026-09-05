const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../miniprogram/app.json'),
  'utf8'
));
const loginTemplate = fs.readFileSync(
  path.join(__dirname, '../miniprogram/pages/login/login.wxml'),
  'utf8'
);

assert.strictEqual(app.pages[0], 'pages/home/home', '安全主线应支持不登录直接进入');
assert.ok(loginTemplate.includes('使用微信身份继续'));
assert.ok(loginTemplate.includes('健康记录默认仅本人可见'));
assert.ok(!loginTemplate.includes('微信一键登录'), '未在当前页完成授权时不应声称一键登录');

console.log('wechat login page tests passed');
