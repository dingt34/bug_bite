const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pageRoot = path.join(__dirname, '..', 'miniprogram', 'pages', 'guidebook');
const wxml = fs.readFileSync(path.join(pageRoot, 'guidebook.wxml'), 'utf8');

const templateExpressions = Array.from(wxml.matchAll(/\{\{([^}]*)\}\}/g), match => match[1]);

assert.strictEqual(
  templateExpressions.some(expression => /&(lt|gt|amp|quot|apos);/.test(expression)),
  false,
  'WXML 模板表达式不能包含 HTML 实体，否则属性编译会失败'
);
assert.ok(
  wxml.includes("{{compareDisabled ? 'disabled-btn' : ''}}"),
  '对比按钮应使用页面状态控制禁用样式'
);

console.log('guidebook WXML compile regression test passed');
