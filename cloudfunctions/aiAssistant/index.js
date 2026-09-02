const cloud = require('wx-server-sdk');
const https = require('https');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function postJson(url, headers, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const req = https.request({ hostname: target.hostname, path: `${target.pathname}${target.search}`, method: 'POST', headers: {
      ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)
    } }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (_) { reject(new Error('INVALID_RESPONSE')); } });
    });
    req.setTimeout(20000, () => req.destroy(new Error('TIMEOUT')));
    req.on('error', reject); req.write(body); req.end();
  });
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const token = process.env.COZE_API_TOKEN;
  const botId = process.env.COZE_BOT_ID;
  const apiUrl = process.env.COZE_API_URL || 'https://api.coze.cn/open_api/v2/chat';
  if (!token || !botId) return { ok: false, code: 'NOT_CONFIGURED', message: '请先配置 AI 云函数环境变量' };
  const messages = (Array.isArray(event.messages) ? event.messages : []).slice(-12).map(item => ({
    role: item.role === 'assistant' ? 'assistant' : 'user', content: String(item.content || '').slice(0, 2000), content_type: 'text'
  })).filter(item => item.content);
  if (!messages.length) return { ok: false, code: 'EMPTY_MESSAGE', message: '请输入问题' };
  try {
    const result = await postJson(apiUrl, { Authorization: `Bearer ${token}` }, {
      bot_id: botId, user: OPENID || 'anonymous', query: messages[messages.length - 1].content,
      chat_history: messages.slice(0, -1), stream: false
    });
    const source = result.messages || result.data && result.data.messages || [];
    const answerItem = source.filter(item => item.type === 'answer' || item.role === 'assistant').pop();
    const answer = String(answerItem && (answerItem.content || answerItem.text) || result.answer || '').trim();
    if (!answer) throw new Error(result.msg || 'EMPTY_ANSWER');
    await db.collection('ai_audits').add({ data: {
      ownerOpenid: OPENID, selectedRecordIds: (event.selectedRecordIds || []).slice(0, 20),
      questionLength: messages[messages.length - 1].content.length, createdAt: db.serverDate()
    } });
    return { ok: true, data: { answer, disclaimer: '如出现呼吸困难、意识异常或快速加重，请立即就医。' } };
  } catch (error) {
    console.error('aiAssistant', error);
    return { ok: false, code: 'AI_FAILED', message: 'AI 助手暂时无法回复，安全问答和紧急建议仍可正常使用' };
  }
};
