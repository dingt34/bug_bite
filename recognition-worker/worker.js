const crypto = require('crypto');

const COLLECTION = 'recognition_jobs';
const RUNTIME_DOC_ID = 'runtime-primary';
const MAX_ATTEMPTS = 3;
const LEASE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 10 * 1000;

function required(name, env = process.env) {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

function endpoint(baseUrl) {
  const normalized = String(baseUrl || '').trim().replace(/\/+$/, '');
  return normalized.endsWith('/v1/identify') ? normalized : `${normalized}/v1/identify`;
}

function healthEndpoint(baseUrl) {
  return `${String(baseUrl || '').trim().replace(/\/+$/, '').replace(/\/v1\/identify$/, '')}/health`;
}

async function readModelHealth(fetchImpl, baseUrl) {
  try {
    const response = await fetchImpl(healthEndpoint(baseUrl), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { ready: false, error: `health ${response.status}` };
    const payload = await response.json();
    return {
      ready: payload.ready === true,
      model: payload.model || 'BioCLIP 2',
      device: payload.device || '',
      catalogSize: Number(payload.catalogSize || 0),
      prototypeCount: Number(payload.prototypeCount || 0),
      error: String(payload.error || '')
    };
  } catch (error) {
    return { ready: false, error: String(error && error.message || 'model offline') };
  }
}

async function modelReady(fetchImpl, baseUrl) {
  return (await readModelHealth(fetchImpl, baseUrl)).ready;
}

async function identifyImage(fetchImpl, options) {
  const response = await fetchImpl(endpoint(options.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ imageBase64: Buffer.from(options.fileContent).toString('base64') }),
    signal: AbortSignal.timeout(options.timeout || 60000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `BioCLIP 服务返回 ${response.status}`);
  return payload;
}

async function writeRuntimeStatus(db, status) {
  await db.collection(COLLECTION).doc(RUNTIME_DOC_ID).set({ data: {
    type: 'runtime',
    status: status.ready ? 'online' : 'degraded',
    ready: Boolean(status.ready),
    model: status.model || 'BioCLIP 2',
    device: status.device || '',
    catalogSize: Number(status.catalogSize || 0),
    prototypeCount: Number(status.prototypeCount || 0),
    errorMessage: String(status.error || '').slice(0, 300),
    workerId: String(status.workerId || ''),
    heartbeatAtMs: Date.now(),
    updatedAt: db.serverDate()
  } });
}

async function claimNextJob(db, workerId) {
  const collection = db.collection(COLLECTION);
  const now = Date.now();
  await collection.where({
    type: db.command.neq('runtime'),
    status: 'processing',
    leaseExpiresAtMs: db.command.lt(now)
  }).update({ data: {
    status: 'pending', workerId: '',
    errorMessage: '工作端中断，任务已自动重新排队',
    updatedAt: db.serverDate()
  } });
  const pending = await collection.where({ status: 'pending' }).orderBy('createdAtMs', 'asc').limit(1).get();
  const job = pending.data && pending.data[0];
  if (!job) return null;
  const claimed = await collection.where({ _id: job._id, status: 'pending' }).update({ data: {
    status: 'processing', workerId,
    attempts: db.command.inc(1),
    startedAtMs: now,
    leaseExpiresAtMs: now + LEASE_MS,
    startedAt: db.serverDate(),
    updatedAt: db.serverDate()
  } });
  if (!Number(claimed.updated || 0)) return null;
  const current = (await collection.doc(job._id).get()).data;
  return current && current.workerId === workerId ? current : null;
}

async function completeJob(db, jobId, analysis) {
  await db.collection(COLLECTION).doc(jobId).update({ data: {
    status: 'done', analysis, errorMessage: '', leaseExpiresAtMs: 0,
    completedAt: db.serverDate(), updatedAt: db.serverDate()
  } });
}

async function failJob(db, job, error) {
  const retry = Number(job.attempts || 0) < MAX_ATTEMPTS;
  await db.collection(COLLECTION).doc(job._id).update({ data: {
    status: retry ? 'pending' : 'failed', workerId: '', leaseExpiresAtMs: 0,
    errorMessage: String(error && error.message || '识别失败').slice(0, 300),
    updatedAt: db.serverDate()
  } });
  return retry;
}

async function processOne(context, options = {}) {
  if (!options.modelIsReady && !await modelReady(context.fetchImpl, context.bioClipUrl)) return false;
  const job = await claimNextJob(context.db, context.workerId);
  if (!job) return false;
  try {
    const file = await context.app.downloadFile({ fileID: job.fileId });
    const analysis = await identifyImage(context.fetchImpl, {
      baseUrl: context.bioClipUrl, apiKey: context.bioClipApiKey,
      fileContent: file.fileContent, timeout: 60000
    });
    await completeJob(context.db, job._id, analysis);
    await context.app.deleteFile({ fileList: [job.fileId] }).catch(() => {});
    console.log(`[done] ${job._id} ${analysis.candidates && analysis.candidates[0] ? analysis.candidates[0].name : '无可靠候选'}`);
  } catch (error) {
    const retry = await failJob(context.db, job, error);
    if (!retry) await context.app.deleteFile({ fileList: [job.fileId] }).catch(() => {});
    console.error(`[failed] ${job._id} ${error.message}`);
  }
  return true;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function main(options = {}) {
  const cloudbase = require('@cloudbase/js-sdk');
  const environmentId = required('RECOGNITION_CLOUDBASE_ENV');
  const accessKey = required('RECOGNITION_CLOUDBASE_API_KEY');
  const bioClipUrl = required('BIOCLIP_API_URL');
  const bioClipApiKey = required('BIOCLIP_API_KEY');
  const pollInterval = Math.max(500, Number(process.env.RECOGNITION_POLL_INTERVAL_MS) || 2000);
  const app = cloudbase.init({ env: environmentId, accessKey });
  const context = {
    app, db: app.database(), workerId: `worker-${crypto.randomUUID()}`,
    bioClipUrl, bioClipApiKey, fetchImpl: options.fetchImpl || fetch
  };
  let lastHeartbeat = 0;
  console.log(`自动识别工作端已启动：${environmentId}`);
  while (!(options.signal && options.signal.aborted)) {
    try {
      const supervisedHealth = options.ensureModel ? await options.ensureModel() : null;
      const health = supervisedHealth || await readModelHealth(context.fetchImpl, bioClipUrl);
      if (Date.now() - lastHeartbeat >= HEARTBEAT_MS) {
        await writeRuntimeStatus(context.db, Object.assign({}, health, { workerId: context.workerId }));
        lastHeartbeat = Date.now();
      }
      if (!health.ready) { await delay(pollInterval); continue; }
      const handled = await processOne(context, { modelIsReady: true });
      if (!handled) await delay(pollInterval);
    } catch (error) {
      console.error(`[queue] ${error.message}`);
      await delay(pollInterval);
    }
  }
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = {
  required, endpoint, healthEndpoint, readModelHealth, modelReady, identifyImage,
  writeRuntimeStatus, claimNextJob, completeJob, failJob, processOne, main
};
