const cloud = require('wx-server-sdk');
const qwen = require('./qwen-client');
const knowledge = require('./knowledge-retrieval');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function normalizeMessages(values) {
  return (Array.isArray(values) ? values : [])
    .filter(item => item && (item.role === 'assistant' || item.role === 'user'))
    .slice(-12)
    .map(item => ({ role: item.role, content: String(item.content || '').trim().slice(0, 2000) }))
    .filter(item => item.content);
}

function combinedUserText(messages) {
  return messages.filter(item => item.role === 'user').map(item => item.content).join('\n');
}

function buildSystemPrompt(entries) {
  return [
    '你是“虫咬识途”的安全建议助手，不是医生，不做疾病、虫种或严重程度确诊。',
    '如用户提到呼吸困难、意识异常、口唇/舌/喉肿胀、抽搐、大量出血或症状快速加重，首先建议立即呼叫120或就近急诊。',
    '不根据皮损反推虫种或病原体，不自动推荐处方药、抗生素或具体剂量。',
    '对象相关信息只能使用下方结构化知识包；知识包没有的事实不要补写，来源标题和链接不得虚构。',
    '知识包状态为 DRAFT，尚待医学/疾控审核，回答中必须保留不确定性。',
    '行动等级来自用户文字事实触发的本地规则，不得擅自降低。',
    '请按“现在先做什么—需要观察什么—何时求助—不确定性”简洁回答。',
    '回答必须使用简洁的 Markdown：用 ### 三级标题划分内容，用 - 列表表达行动步骤，用 **加粗** 标出关键行动。不要输出 HTML，不要使用表格。',
    '当前知识库版本：' + knowledge.VERSION,
    '检索结果：' + knowledge.formatContext(entries)
  ].join('\n');
}

async function answer(event) {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
  if (!apiKey) throw new Error('请先配置 DASHSCOPE_API_KEY');
  const messages = normalizeMessages(event && event.messages);
  if (!messages.length || !messages.some(item => item.role === 'user')) throw new Error('请输入问题');
  const text = combinedUserText(messages);
  const facts = knowledge.extractSafetyFacts(text);
  const entries = knowledge.retrieve([], facts, text);
  const content = await qwen.complete({
    apiKey,
    baseUrl: process.env.DASHSCOPE_BASE_URL || qwen.DEFAULT_BASE_URL,
    model: process.env.AI_MODEL || qwen.DEFAULT_MODEL,
    messages: [{ role: 'system', content: buildSystemPrompt(entries) }].concat(messages),
    temperature: 0.2,
    maxTokens: 1400,
    timeout: 20000
  });
  return {
    answer: content,
    knowledgeVersion: knowledge.VERSION,
    knowledgeObjectIds: entries.map(entry => entry.objectId),
    actionLevels: entries.map(entry => ({ objectId: entry.objectId, level: entry.action.level })),
    disclaimer: '如出现呼吸困难、意识异常或快速加重，请立即就医。'
  };
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  try {
    const result = await answer(event || {});
    db.collection('ai_audits').add({ data: {
      ownerOpenid: OPENID || '',
      selectedRecordIds: (event && event.selectedRecordIds || []).slice(0, 20),
      knowledgeObjectIds: result.knowledgeObjectIds,
      knowledgeVersion: result.knowledgeVersion,
      createdAt: db.serverDate()
    } }).catch(error => console.warn('ai audit unavailable', error && error.message));
    return { ok: true, data: result };
  } catch (error) {
    console.error('aiAssistant', error && error.message ? error.message : 'unknown error');
    return { ok: false, code: 'AI_FAILED', message: error && error.message || 'AI 助手暂时无法回复' };
  }
};

exports.answer = answer;
exports.normalizeMessages = normalizeMessages;
exports.buildSystemPrompt = buildSystemPrompt;
