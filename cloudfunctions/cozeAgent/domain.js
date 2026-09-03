const crypto = require('crypto');

const MAX_MESSAGE_LENGTH = 6000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEM_LENGTH = 2000;
const MAX_PROMPT_LENGTH = 14000;

function normalizeMessage(value) {
  return String(value || '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeHistory(history) {
  return (Array.isArray(history) ? history : [])
    .filter(item => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-MAX_HISTORY_ITEMS)
    .map(item => ({
      role: item.role,
      content: String(item.content || '').trim().slice(0, MAX_HISTORY_ITEM_LENGTH)
    }))
    .filter(item => item.content);
}

function buildPrompt(message, history) {
  const safeMessage = normalizeMessage(message);
  if (!safeMessage) throw new Error('请输入要咨询的内容');
  const safeHistory = normalizeHistory(history);
  const sections = [];
  if (safeHistory.length) {
    sections.push('最近对话（仅作上下文）：');
    safeHistory.forEach(item => {
      sections.push((item.role === 'user' ? '用户：' : '助手：') + item.content);
    });
  }
  sections.push('用户本次消息：');
  sections.push(safeMessage);
  return sections.join('\n').slice(-MAX_PROMPT_LENGTH);
}

function createSessionId(openid, conversationId) {
  const source = String(openid || 'anonymous') + ':' + String(conversationId || 'default');
  return 'wx_' + crypto.createHash('sha256').update(source).digest('hex').slice(0, 32);
}

function buildAgentRequest(prompt, sessionId, projectId) {
  return {
    content: {
      query: {
        prompt: [{
          type: 'text',
          content: { text: String(prompt || '') }
        }]
      }
    },
    type: 'query',
    session_id: String(sessionId || ''),
    project_id: String(projectId || '')
  };
}

function appendAnswer(current, chunk) {
  if (!chunk) return current;
  if (chunk.startsWith(current)) return chunk;
  if (current.endsWith(chunk)) return current;
  return current + chunk;
}

function parseSseBody(body) {
  let answer = '';
  let upstreamError = '';
  let endCode = null;
  String(body || '').split(/\r?\n/).forEach(line => {
    if (!line.startsWith('data:')) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === '[DONE]') return;
    try {
      const message = JSON.parse(raw);
      if (message.type === 'answer' && message.content) {
        answer = appendAnswer(answer, String(message.content.answer || ''));
      }
      if (message.type === 'message_end' && message.content) {
        endCode = Number(message.content.code || 0);
        upstreamError = String(message.content.message || message.content.msg || '');
      }
      if (message.type === 'error') {
        upstreamError = String((message.content && (message.content.message || message.content.error)) || message.message || '');
      }
    } catch (error) {
      // Ignore keep-alive lines and malformed non-answer events.
    }
  });
  if (endCode !== null && endCode !== 0) {
    throw new Error(upstreamError || '扣子 Agent 返回错误');
  }
  if (!answer.trim()) throw new Error(upstreamError || '扣子 Agent 没有返回有效内容');
  return answer.trim();
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  normalizeMessage,
  normalizeHistory,
  buildPrompt,
  createSessionId,
  buildAgentRequest,
  parseSseBody
};
