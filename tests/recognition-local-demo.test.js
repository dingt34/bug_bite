const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cameraSource = fs.readFileSync(path.join(root, 'miniprogram/pages/camera/camera.js'), 'utf8');
const template = fs.readFileSync(path.join(root, 'miniprogram/pages/camera/camera.wxml'), 'utf8');

assert.ok(cameraSource.includes("LOCAL_RECOGNITION_URL = 'http://127.0.0.1:8000'"), '本地演示应只请求本机服务');
assert.ok(cameraSource.includes('getFileSystemManager().readFile'), '本地演示应直接读取微信临时图片');
assert.ok(cameraSource.includes('/v1/identify'), '本地演示应调用 BioCLIP 识别接口');
assert.ok(!cameraSource.includes("action: 'enqueue'"), '本地演示不得创建云队列任务');
assert.ok(!cameraSource.includes("action: 'status'"), '本地演示不得轮询云队列');
assert.ok(!cameraSource.includes('wx.cloud.uploadFile'), '本地演示不得上传用户图片');
assert.ok(template.includes('图片不上传'), '页面必须明确说明图片不会上传');

console.log('recognition local demo tests passed');
