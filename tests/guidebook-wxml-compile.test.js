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
assert.ok(wxml.includes('item.latin'), '图鉴卡片应展示学名');
assert.ok(wxml.includes('item.summary'), '图鉴卡片应补充辨识概述');
assert.ok(wxml.includes('resetFilters'), '空结果页应支持一键清除筛选');

const pageStyle = fs.readFileSync(path.join(pageRoot, 'guidebook.wxss'), 'utf8');
assert.strictEqual(pageStyle.includes('min-height:150rpx'), false, '图鉴页顶部应使用全局统一安全区');
assert.ok(pageStyle.includes('.insect-card{display:flex'), '图鉴卡片应使用横向信息布局');

console.log('guidebook WXML compile regression test passed');
