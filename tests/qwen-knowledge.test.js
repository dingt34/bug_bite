const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const identifyKnowledge = require('../cloudfunctions/identifyInsect/knowledge-retrieval');
const assistantKnowledge = require('../cloudfunctions/aiAssistant/knowledge-retrieval');
const qwen = require('../cloudfunctions/identifyInsect/qwen-client');

assert.deepStrictEqual(identifyKnowledge.validate(), { valid: true, errors: [], packCount: 45 });
assert.deepStrictEqual(assistantKnowledge.validate(), { valid: true, errors: [], packCount: 45 });
const tickLocation = require('../cloudfunctions/aiAssistant/knowledge-base').getKnowledgeFlow('tick', { stage: 'location' });
assert.strictEqual(tickLocation.contentBlocks.length, 1);
assert.ok(tickLocation.organism.occurrenceReference.possiblePlaceDescription.includes('高草'));
assert.strictEqual(tickLocation.organism.occurrenceReference.precision, 'ENVIRONMENT_TYPE_ONLY');
assert.ok(assistantKnowledge.retrieve(['tick'], {}, '')[0].organism.occurrenceReference.notice.includes('不证明某个具体城市'));
assert.strictEqual(identifyKnowledge.catalogPromptText().split('\n').length, 45);
assert.deepStrictEqual(identifyKnowledge.resolveCandidateIds(['mosquito', 'flea'], '', 3), ['mosquito', 'flea']);
assert.deepStrictEqual(identifyKnowledge.findCandidateIds('我看到了一只花蚊子', 3), ['mosquito']);
assert.strictEqual(identifyKnowledge.extractSafetyFacts('没有呼吸困难，但是红肿正在迅速扩散').redFlags, undefined);
assert.strictEqual(identifyKnowledge.extractSafetyFacts('呼吸困难').redFlags.breathingDifficulty, true);

assert.deepStrictEqual(qwen.parseJsonObject('```json\n{"candidateIds":["mosquito"]}\n```'), { candidateIds: ['mosquito'] });
assert.strictEqual(qwen.endpoint('https://example.com/compatible-mode/v1').pathname, '/compatible-mode/v1/chat/completions');
assert.strictEqual(qwen.DEFAULT_TIMEOUT, 30000);
assert.strictEqual(require('../cloudfunctions/aiAssistant/qwen-client').DEFAULT_TIMEOUT, 30000);
assert.match(fs.readFileSync(path.join(root, 'cloudfunctions/aiAssistant/index.js'), 'utf8'), /timeout:\s*30000/);
assert.match(fs.readFileSync(path.join(root, 'cloudfunctions/identifyInsect/index.js'), 'utf8'), /timeout:\s*30000/);
assert.match(fs.readFileSync(path.join(root, 'miniprogram/pages/ai/ai.js'), 'utf8'), /timeout:\s*35000/);
assert.match(fs.readFileSync(path.join(root, 'miniprogram/pages/camera/camera.js'), 'utf8'), /timeout:\s*35000/);

const allWxml = fs.readdirSync(path.join(root, 'miniprogram', 'pages'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(root, 'miniprogram', 'pages', entry.name, entry.name + '.wxml'))
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
assert.ok(!allWxml.includes('figma-menu'), '右上角三点菜单应全部移除');
assert.ok(!fs.readFileSync(path.join(root, 'miniprogram/pages/contact/contact.wxml'), 'utf8').includes('自动保存'));

console.log('检查通过：V6 千问接入、45 项知识库、安全事实和 UI 约束。');
