const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const supervisorPath = path.join(root, 'recognition-worker/supervisor.js');
const workerPath = path.join(root, 'recognition-worker/worker.js');
const cloudPath = path.join(root, 'cloudfunctions/identifyInsect/index.js');
const cameraPath = path.join(root, 'miniprogram/pages/camera/camera.js');

assert.ok(fs.existsSync(supervisorPath), '应提供统一监督进程，自动维护 BioCLIP 生命周期');

const supervisorSource = fs.readFileSync(supervisorPath, 'utf8');
const workerSource = fs.readFileSync(workerPath, 'utf8');
const cloudSource = fs.readFileSync(cloudPath, 'utf8');
const cameraSource = fs.readFileSync(cameraPath, 'utf8');

assert.ok(supervisorSource.includes('restartModel'), '监督进程应支持模型进程退出后重启');
assert.ok(supervisorSource.includes('SIGINT'), '监督进程应支持完整退出清理');
assert.ok(workerSource.includes('writeRuntimeStatus'), 'worker 应持续写入运行心跳');
assert.ok(workerSource.includes('leaseExpiresAtMs'), '任务应使用租约恢复中断任务');
assert.ok(cloudSource.includes("action === 'health'"), '云函数应提供识别运行状态');
assert.ok(cloudSource.includes('RECOGNITION_OFFLINE'), '云函数应在工作端离线时快速失败');
assert.ok(cameraSource.includes('/health'), '识别页应先检查本机模型状态');
assert.ok(cameraSource.includes('本机模型未启动'), '识别页应给出可操作的本机离线提示');
assert.ok(cameraSource.includes('readPhotoBase64'), '识别页应在本机读取待识别图片');
assert.ok(!cameraSource.includes("action: 'enqueue'"), '本地演示不应提交云端识别任务');

const { EventEmitter } = require('events');
const { ModelSupervisor } = require(supervisorPath);

(async () => {
  let healthCalls = 0;
  let spawnCalls = 0;
  const fakeChild = new EventEmitter();
  fakeChild.stdout = new EventEmitter();
  fakeChild.stderr = new EventEmitter();
  fakeChild.exitCode = null;
  fakeChild.kill = () => { fakeChild.exitCode = 0; };
  const supervisor = new ModelSupervisor({
    fetchImpl: async () => ({
      ok: true,
      json: async () => (++healthCalls === 1 ? { ready: false } : { ready: true, device: 'cuda' })
    }),
    spawnImpl: () => { spawnCalls += 1; return fakeChild; }
  });
  const health = await supervisor.restartModel();
  assert.strictEqual(health.ready, true, '监督进程应等待模型恢复可用');
  assert.strictEqual(spawnCalls, 1, '模型离线时应只启动一个恢复进程');
  supervisor.stop();
  console.log('recognition resilience tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
