const assert = require('assert');
const markdown = require('../miniprogram/utils/markdown.js');

const html = markdown.renderMarkdown([
  '## 处理建议',
  '',
  '请先**清洁伤口**。',
  '',
  '- 观察红肿范围',
  '- 记录体温',
  '',
  '> 出现呼吸困难请立即就医',
  '',
  '![白纹伊蚊参考图](/images/insect-guide/aedes-albopictus/01-overview.webp)',
  '',
  '`不要抓挠`'
].join('\n'));

assert.ok(html.includes('<h2>处理建议</h2>'));
assert.ok(html.includes('<strong>清洁伤口</strong>'));
assert.ok(html.includes('<ul><li>观察红肿范围</li><li>记录体温</li></ul>'));
assert.ok(html.includes('<blockquote>出现呼吸困难请立即就医</blockquote>'));
assert.ok(html.includes('<img src="/images/insect-guide/aedes-albopictus/01-overview.webp" alt="白纹伊蚊参考图" />'));
assert.ok(html.includes('<code>不要抓挠</code>'));
assert.ok(!markdown.renderMarkdown('<script>alert(1)</script>').includes('<script>'));
assert.ok(!markdown.renderMarkdown('![危险图片](javascript:alert(1))').includes('<img'));

console.log('markdown tests passed');
