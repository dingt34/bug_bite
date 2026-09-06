const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cloudSource = fs.readFileSync(path.join(root, 'cloudfunctions/identifyInsect/index.js'), 'utf8');
const cameraSource = fs.readFileSync(path.join(root, 'miniprogram/pages/camera/camera.js'), 'utf8');

assert.ok(cloudSource.includes("action === 'enqueue'"), '云函数应支持创建识别任务');
assert.ok(cloudSource.includes("action === 'status'"), '云函数应支持查询识别任务');
assert.ok(cloudSource.includes("document.ownerOpenid !== openid"), '查询结果必须校验任务所有者');
assert.ok(cloudSource.includes("status: 'pending'"), '任务应从待处理状态进入队列');
assert.ok(!cloudSource.includes('BIOCLIP_API_URL'), '识别云函数不应保留公网直连方案');
assert.ok(!cloudSource.includes("require('./bioclip-client')"), '识别云函数不应保留旧模型客户端');
assert.ok(cameraSource.includes("action: 'enqueue'"), '识别页应先创建云端任务');
assert.ok(cameraSource.includes("action: 'status'"), '识别页应轮询任务结果');
assert.ok(cameraSource.includes('attempt >= 60'), '轮询必须具有明确上限');
assert.ok(!cameraSource.includes('bioclip-demo'), '识别页不应回退到开发者工具直连');

console.log('recognition queue tests passed');
