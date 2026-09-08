const { spawn } = require('child_process');
const path = require('path');
const worker = require('./worker');

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

class ModelSupervisor {
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.spawnImpl = options.spawnImpl || spawn;
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    this.pythonPath = options.pythonPath || path.join(this.projectRoot, '.venv-bioclip', 'Scripts', 'python.exe');
    this.serviceRoot = options.serviceRoot || path.join(this.projectRoot, 'bioclip-service');
    this.baseUrl = options.baseUrl || process.env.BIOCLIP_API_URL || 'http://127.0.0.1:8000';
    this.port = Number(new URL(this.baseUrl).port || 8000);
    this.child = null;
    this.startPromise = null;
    this.stopping = false;
  }

  async health() { return worker.readModelHealth(this.fetchImpl, this.baseUrl); }

  startModelProcess() {
    const child = this.spawnImpl(
      this.pythonPath,
      ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', String(this.port), '--workers', '1'],
      {
        cwd: this.serviceRoot,
        env: Object.assign({}, process.env, { BIOCLIP_DEVICE: process.env.BIOCLIP_DEVICE || 'cuda' }),
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      }
    );
    child.stdout.on('data', value => process.stdout.write(`[model] ${value}`));
    child.stderr.on('data', value => process.stderr.write(`[model] ${value}`));
    child.once('exit', code => {
      if (!this.stopping) console.error(`[model] BioCLIP 进程已退出（${code}），将在下一轮自动重启`);
      if (this.child === child) this.child = null;
    });
    this.child = child;
  }

  async waitUntilReady(timeoutMs = 180000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const health = await this.health();
      if (health.ready) return health;
      if (this.child && this.child.exitCode !== null) {
        throw new Error(`BioCLIP 启动失败：${health.error || '模型进程已退出'}`);
      }
      await delay(2000);
    }
    throw new Error('BioCLIP 模型在 180 秒内未就绪');
  }

  async restartModel() {
    if (this.startPromise) return this.startPromise;
    this.startPromise = (async () => {
      const existing = await this.health();
      if (existing.ready) return existing;
      if (this.child && existing.error && this.child.exitCode === null) {
        this.child.kill();
        this.child = null;
        await delay(500);
      }
      if (!this.child) this.startModelProcess();
      return this.waitUntilReady();
    })();
    try { return await this.startPromise; }
    finally { this.startPromise = null; }
  }

  async ensureModel() {
    const health = await this.health();
    return health.ready ? health : this.restartModel();
  }

  stop() {
    this.stopping = true;
    if (this.child && this.child.exitCode === null) this.child.kill();
  }
}

async function main() {
  const supervisor = new ModelSupervisor();
  const controller = new AbortController();
  const stop = () => { controller.abort(); supervisor.stop(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    await supervisor.restartModel();
    await worker.main({ signal: controller.signal, ensureModel: () => supervisor.ensureModel() });
  } finally {
    supervisor.stop();
  }
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { ModelSupervisor, main };
