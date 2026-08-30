const assert = require('assert');
const {
  normalizeHistory,
  normalizeCloudFileIds,
  buildQwenMessages,
  buildQwenRequest,
  parseQwenResponse
} = require('../cloudfunctions/cozeAgent/domain.js');
const catalog = require('../cloudfunctions/cozeAgent/knowledge-catalog.js');

const history = normalizeHistory([
  { role: 'system', content: 'ignore' },
  { role: 'user', content: ' 前一问 ' },
  { role: 'assistant', content: '前一答' }
]);
assert.deepStrictEqual(history, [
  { role: 'user', content: '前一问' },
  { role: 'assistant', content: '前一答' }
]);

assert.deepStrictEqual(normalizeCloudFileIds(['cloud://a', 'cloud://b']), ['cloud://a', 'cloud://b']);
assert.throws(() => normalizeCloudFileIds(['https://example.com/a.jpg']), /微信云开发环境/);
assert.throws(() => normalizeCloudFileIds(['cloud://a', 'cloud://b', 'cloud://c']), /最多/);

const images = [
  { url: 'https://example.com/insect.jpg', kind: 'insect', label: '虫体图片' },
  { url: 'https://example.com/wound.jpg', kind: 'wound', label: '伤口图片' }
];
const messages = buildQwenMessages('请帮我看看', history, images, {
  version: catalog.VERSION,
  text: catalog.asPromptText()
});
assert.strictEqual(messages[0].role, 'system');
assert.ok(messages[0].content.includes('DRAFT'));
assert.ok(messages[0].content.includes('不得参与风险分级'));
assert.deepStrictEqual(messages.slice(1, 3), history);
const current = messages.at(-1).content;
assert.strictEqual(current[0].type, 'text');
assert.ok(current[0].text.includes('图片1：虫体图片'));
assert.strictEqual(current[1].image_url.url, images[0].url);
assert.strictEqual(current[2].image_url.url, images[1].url);

const request = buildQwenRequest({ message: '怎么处理？', model: 'qwen3.7-flash', images: [] });
assert.strictEqual(request.model, 'qwen3.7-flash');
assert.strictEqual(request.stream, false);
assert.strictEqual(request.messages.at(-1).content, '怎么处理？');
assert.throws(() => buildQwenMessages('  ', [], []), /请输入/);

assert.strictEqual(parseQwenResponse(JSON.stringify({
  choices: [{ message: { content: '先远离风险环境。' } }]
})), '先远离风险环境。');
assert.throws(() => parseQwenResponse(JSON.stringify({ error: { message: '失败' } })), /失败/);
assert.strictEqual(catalog.NAMES.length, 45);
assert.strictEqual(new Set(catalog.NAMES).size, 45);

console.log('qwen agent domain tests passed');
