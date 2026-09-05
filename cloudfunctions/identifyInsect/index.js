const cloud = require('wx-server-sdk');
const qwen = require('./qwen-client');
const knowledge = require('./knowledge-retrieval');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const MAX_BASE64_LENGTH = 8 * 1024 * 1024;

async function loadImageBase64(event) {
  let imageBase64 = String(event && event.imageBase64 || '').replace(/^data:image\/[\w+.-]+;base64,/, '');
  if (!imageBase64 && event && event.fileId) {
    const file = await cloud.downloadFile({ fileID: String(event.fileId) });
    imageBase64 = file.fileContent.toString('base64');
  }
  if (!imageBase64) throw new Error('请先拍摄或选择图片');
  if (imageBase64.length > MAX_BASE64_LENGTH) throw new Error('图片过大，请重新拍摄');
  return imageBase64;
}

function buildVisionMessages(imageBase64, description) {
  return [
    {
      role: 'system',
      content: [
        '你是“虫咬识途”的虫体图片候选分析器，只返回 JSON，不要输出 Markdown。',
        '只描述图中可见的体型、颜色、足、翅、体节和环境线索；不做医疗诊断、病原体推测或风险分级。',
        '候选只能从以下 45 项知识库名录中选择，最多 3 个 objectId；看不清、不是虫体或只有皮损时返回空数组：',
        knowledge.catalogPromptText(),
        'JSON 格式：{"candidateIds":["object_id"],"visibleFeatures":["可见特征"],"uncertainty":"不确定性说明"}'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: String(description || '请根据可见特征给出虫体候选。').slice(0, 500) },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageBase64 } }
      ]
    }
  ];
}

function normalizeAnalysis(content, fallbackText) {
  const payload = qwen.parseJsonObject(content);
  const candidateIds = knowledge.resolveCandidateIds(payload.candidateIds, fallbackText, 3);
  return {
    candidateIds,
    visibleFeatures: (Array.isArray(payload.visibleFeatures) ? payload.visibleFeatures : [])
      .map(value => String(value || '').trim()).filter(Boolean).slice(0, 8),
    uncertainty: String(payload.uncertainty || '').trim().slice(0, 300)
  };
}

async function identify(event) {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
  if (!apiKey) throw new Error('请先配置 DASHSCOPE_API_KEY');
  const imageBase64 = await loadImageBase64(event || {});
  const description = String(event && event.description || '');
  const content = await qwen.complete({
    apiKey,
    baseUrl: process.env.DASHSCOPE_BASE_URL || qwen.DEFAULT_BASE_URL,
    model: process.env.AI_MODEL || qwen.DEFAULT_MODEL,
    messages: buildVisionMessages(imageBase64, description),
    temperature: 0,
    maxTokens: 500,
    timeout: 30000
  });
  const analysis = normalizeAnalysis(content, description);
  const facts = knowledge.extractSafetyFacts(description);
  const entries = knowledge.retrieve(analysis.candidateIds, facts, description);
  return {
    candidates: entries.map(entry => ({
      objectId: entry.objectId,
      name: entry.organism.commonName,
      scientificName: entry.organism.scientificName,
      summary: entry.organism.summary,
      actionLevel: entry.action.level
    })),
    visibleFeatures: analysis.visibleFeatures,
    uncertainty: analysis.uncertainty || (entries.length ? '仅为图鉴候选，需结合尺寸和环境继续核对。' : '画面不足以给出可靠候选。'),
    knowledgeVersion: knowledge.VERSION,
    disclaimer: '图像候选只作为图鉴线索，不用于确诊、病原体判断或安全分级。'
  };
}

exports.main = async event => {
  try {
    return { ok: true, data: await identify(event || {}) };
  } catch (error) {
    console.error('identifyInsect', error && error.message ? error.message : 'unknown error');
    return { ok: false, code: 'RECOGNITION_FAILED', message: error && error.message || '暂时无法识别，请继续使用环境与症状问答' };
  }
};

exports.identify = identify;
exports.loadImageBase64 = loadImageBase64;
exports.normalizeAnalysis = normalizeAnalysis;
