const crypto = require('crypto');

const COLLECTION = 'recognition_jobs';
const MAX_ATTEMPTS = 3;

function required(name, env = process.env) {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

function endpoint(baseUrl) {
  const normalized = String(baseUrl || '').trim().replace(/\/+$/, '');
  return normalized.endsWith('/v1/identify') ? normalized : `${normalized}/v1/identify`;
}

async function modelReady(fetchImpl, baseUrl) {
  const healthUrl = `${String(baseUrl || '').trim().replace(/\/+$/, '').replace(/\/v1\/identify$/, '')}/health`;
  try {
    const response = await fetchImpl(healthUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const payload = await response.json();
    return payload.ready === true;
  } catch (_) { return false; }
}

async function identifyImage(fetchImpl, options) {
  const response = await fetchImpl(endpoint(options.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ imageBase64: Buffer.from(options.fileContent).toString('base64') }),
    signal: AbortSignal.timeout(options.timeout || 45000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `BioCLIP 服务返回 ${response.status}`);
  return payload;
}

async function claimNextJob(db, workerId) {
  const collection = db.collection(COLLECTION);
  await collection.where({
    status: 'processing',
    startedAtMs: db.command.lt(Date.now() - 2 * 60 * 1000)
  }).update({ data: {
    status: 'pending', workerId: '', errorMessage: '工作端中断，任务已自动重新排队', updatedAt: db.serverDate()
  } });
  const pending = await collection.where({ status: 'pending' }).orderBy('createdAtMs', 'asc').limit(1).get();
  const job = pending.data && pending.data[0];
  if (!job) return null;
  const claimed = await collection.where({ _id: job._id, status: 'pending' }).update({ data: {
    status: 'processing',
    workerId,
    attempts: db.command.inc(1),
    startedAtMs: Date.now(),
    startedAt: db.serverDate(),
    updatedAt: db.serverDate()
  } });
  if (!Number(claimed.updated || 0)) return null;
  const current = (await collection.doc(job._id).get()).data;
  return current && current.workerId === workerId ? current : null;
}

async function completeJob(db, jobId, analysis) {
  await db.collection(COLLECTION).doc(jobId).update({ data: {
    status: 'done', analysis, errorMessage: '', completedAt: db.serverDate(), updatedAt: db.serverDate()
  } });
}

async function failJob(db, job, error) {
  const retry = Number(job.attempts || 0) < MAX_ATTEMPTS;
  await db.collection(COLLECTION).doc(job._id).update({ data: {
    status: retry ? 'pending' : 'failed',
    workerId: '',
    errorMessage: String(error && error.message || '识别失败').slice(0, 300),
    updatedAt: db.serverDate()
  } });
  return retry;
}

async function processOne(context) {
  if (!await modelReady(context.fetchImpl, context.bioClipUrl)) return false;
  const job = await claimNextJob(context.db, context.workerId);
  if (!job) return false;
  try {
    const file = await context.app.downloadFile({ fileID: job.fileId });
    const analysis = await identifyImage(context.fetchImpl, {
      baseUrl: context.bioClipUrl,
      apiKey: context.bioClipApiKey,
      fileContent: file.fileContent,
      timeout: 45000
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

async function main() {
  const cloudbase = require('@cloudbase/js-sdk');
  const environmentId = required('RECOGNITION_CLOUDBASE_ENV');
  const accessKey = required('RECOGNITION_CLOUDBASE_API_KEY');
  const bioClipUrl = required('BIOCLIP_API_URL');
  const bioClipApiKey = required('BIOCLIP_API_KEY');
  const pollInterval = Math.max(500, Number(process.env.RECOGNITION_POLL_INTERVAL_MS) || 2000);
  const app = cloudbase.init({ env: environmentId, accessKey });
  const context = {
    app,
    db: app.database(),
    workerId: `worker-${crypto.randomUUID()}`,
    bioClipUrl,
    bioClipApiKey,
    fetchImpl: fetch
  };
  console.log(`自动识别工作端已启动：${environmentId}`);
  while (true) {
    const handled = await processOne(context).catch(error => {
      console.error(`[queue] ${error.message}`);
      return false;
    });
    if (!handled) await delay(pollInterval);
  }
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { required, endpoint, modelReady, identifyImage, claimNextJob, completeJob, failJob, processOne };
