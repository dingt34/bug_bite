const cloud = require('wx-server-sdk');
const knowledge = require('./knowledge-retrieval');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const JOB_COLLECTION = 'recognition_jobs';
const RUNTIME_DOC_ID = 'runtime-primary';
const HEARTBEAT_MAX_AGE_MS = 45 * 1000;
const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

class RecognitionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function getRuntimeHealth() {
  let runtime;
  try { runtime = (await db.collection(JOB_COLLECTION).doc(RUNTIME_DOC_ID).get()).data; }
  catch (_) { runtime = null; }
  const ageMs = runtime ? Math.max(0, Date.now() - Number(runtime.heartbeatAtMs || 0)) : null;
  const online = Boolean(runtime && runtime.ready && ageMs <= HEARTBEAT_MAX_AGE_MS);
  return {
    online,
    status: online ? 'online' : 'offline',
    model: runtime && runtime.model || 'BioCLIP 2',
    device: runtime && runtime.device || '',
    catalogSize: Number(runtime && runtime.catalogSize || 0),
    prototypeCount: Number(runtime && runtime.prototypeCount || 0),
    heartbeatAgeMs: ageMs,
    message: online ? '识别服务运行正常' : '识别服务尚未启动，请先启动本地识别工作端'
  };
}

function presentAnalysis(analysis, description = '') {
  const candidateIds = knowledge.resolveCandidateIds(
    (analysis.candidates || []).map(item => item.objectId), '', 3
  );
  const facts = knowledge.extractSafetyFacts(description);
  const entries = knowledge.retrieve(candidateIds, facts, '');
  return {
    candidates: entries.map(entry => ({
      objectId: entry.objectId,
      name: entry.organism.commonName,
      scientificName: entry.organism.scientificName,
      summary: entry.organism.summary,
      actionLevel: entry.action.level,
      score: Number(((analysis.candidates || []).find(item => item.objectId === entry.objectId) || {}).score || 0)
    })),
    visibleFeatures: [],
    uncertainty: entries.length
      ? 'BioCLIP 仅提供图片相似候选，请结合虫体尺寸、拍摄地点和图鉴特征继续核对。'
      : '图片质量不足、主体并非虫体，或候选可信度未达到当前阈值。',
    knowledgeVersion: knowledge.VERSION,
    visionModel: analysis.model || 'BioCLIP 2',
    modelMetrics: {
      topScore: Number(analysis.topScore || 0),
      margin: Number(analysis.margin || 0),
      uncertain: Boolean(analysis.uncertain)
    },
    disclaimer: '图像候选只作为图鉴线索，不用于确诊、病原体判断或安全分级。'
  };
}

async function enqueue(event, openid) {
  const fileId = String(event && event.fileId || '').trim();
  if (!openid) throw new Error('无法确认微信身份');
  if (!/^cloud:\/\//.test(fileId)) throw new Error('图片尚未上传到云端');
  const health = await getRuntimeHealth();
  if (!health.online) throw new RecognitionError('RECOGNITION_OFFLINE', health.message);
  const result = await db.collection(JOB_COLLECTION).add({ data: {
    ownerOpenid: openid,
    fileId,
    description: String(event && event.description || '').trim().slice(0, 500),
    status: 'pending',
    attempts: 0,
    createdAtMs: Date.now(),
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  } });
  return { jobId: result._id, status: 'pending' };
}

async function getJobStatus(event, openid) {
  const jobId = String(event && event.jobId || '').trim();
  if (!openid) throw new Error('无法确认微信身份');
  if (!JOB_ID_PATTERN.test(jobId)) throw new Error('识别任务编号无效');
  let document;
  try { document = (await db.collection(JOB_COLLECTION).doc(jobId).get()).data; }
  catch (_) { document = null; }
  if (!document || document.ownerOpenid !== openid) throw new Error('识别任务不存在');
  const response = {
    jobId,
    status: document.status,
    message: String(document.errorMessage || '')
  };
  if (document.status === 'done') response.result = presentAnalysis(document.analysis || {}, document.description || '');
  return response;
}

exports.main = async event => {
  try {
    const action = String(event && event.action || '');
    const { OPENID } = cloud.getWXContext();
    if (action === 'health') return { ok: true, data: await getRuntimeHealth() };
    if (action === 'enqueue') return { ok: true, data: await enqueue(event || {}, OPENID) };
    if (action === 'status') return { ok: true, data: await getJobStatus(event || {}, OPENID) };
    return { ok: false, code: 'INVALID_ACTION', message: '不支持的识别操作，请重新编译小程序' };
  } catch (error) {
    console.error('identifyInsect', error && error.message ? error.message : 'unknown error');
    return {
      ok: false,
      code: error && error.code || 'RECOGNITION_FAILED',
      message: error && error.message || '暂时无法识别，请继续使用环境与症状问答'
    };
  }
};

exports.presentAnalysis = presentAnalysis;
exports.enqueue = enqueue;
exports.getJobStatus = getJobStatus;
exports.getRuntimeHealth = getRuntimeHealth;
