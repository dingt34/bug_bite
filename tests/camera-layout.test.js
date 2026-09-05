const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pageRoot = path.join(__dirname, '..', 'miniprogram', 'pages', 'camera');
const markup = fs.readFileSync(path.join(pageRoot, 'camera.wxml'), 'utf8');
const style = fs.readFileSync(path.join(pageRoot, 'camera.wxss'), 'utf8');

assert.ok(markup.includes('class="camera-actions"'));
assert.ok(markup.includes('camera-danger-button'));
assert.ok(style.includes('.camera-actions{display:flex;flex-direction:column;gap:18rpx'));
assert.ok(style.includes('.retake-button,.camera-danger-button{position:relative;display:flex;width:100%'));
assert.ok(markup.includes('class="camera-choice-list"'));
assert.ok(style.includes('.camera-choice-list{display:flex;gap:16rpx}'));
assert.ok(style.includes('.camera-choice-list>.camera-choice-card{position:relative;display:flex;flex:1;flex-direction:column'));
assert.ok(style.includes('.camera-choice-list>.camera-choice-card{flex-direction:row;align-items:center;min-height:170rpx}'));
assert.ok(markup.includes('对照知识库特征，返回候选对象'));
assert.ok(markup.includes('记录接触与症状变化，不作诊断'));

console.log('camera layout tests passed');
