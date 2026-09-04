const assert = require('assert');
const {
  normalizeHistory,
  buildPrompt,
  createSessionId,
  buildAgentRequest,
  parseSseBody
} = require('../cloudfunctions/cozeAgent/domain.js');

const history = normalizeHistory([
  { role: 'system', content: 'ignore' },
  { role: 'user', content: ' 前一问 ' },
  { role: 'assistant', content: '前一答' }
]);
assert.deepStrictEqual(history, [
  { role: 'user', content: '前一问' },
  { role: 'assistant', content: '前一答' }
]);

const prompt = buildPrompt('现在怎么办？', history);
assert.ok(prompt.includes('用户：前一问'));
assert.ok(prompt.endsWith('用户本次消息：\n现在怎么办？'));
assert.throws(() => buildPrompt('  ', []), /请输入/);

const firstSession = createSessionId('openid-1', 'chat-1');
assert.strictEqual(firstSession, createSessionId('openid-1', 'chat-1'));
assert.notStrictEqual(firstSession, createSessionId('openid-2', 'chat-1'));
assert.ok(/^wx_[a-f0-9]{32}$/.test(firstSession));

const request = buildAgentRequest('现在怎么办？', firstSession, 'project-1');
assert.deepStrictEqual(request, {
  content: {
    query: {
      prompt: [{ type: 'text', content: { text: '现在怎么办？' } }]
    }
  },
  type: 'query',
  session_id: firstSession,
  project_id: 'project-1'
});

const sse = [
  'event: message',
  'data: {"type":"answer","content":{"answer":"先远离"}}',
  '',
  'event: message',
  'data: {"type":"answer","content":{"answer":"风险环境。"}}',
  '',
  'event: message_end',
  'data: {"type":"message_end","content":{"code":0}}'
].join('\n');
assert.strictEqual(parseSseBody(sse), '先远离风险环境。');
assert.throws(
  () => parseSseBody('data: {"type":"message_end","content":{"code":500,"message":"失败"}}'),
  /失败/
);

console.log('coze agent domain tests passed');
