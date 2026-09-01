const assert = require('assert');
const knowledgeBase = require('../cloudfunctions/cozeAgent/knowledge-base');
const retrieval = require('../cloudfunctions/cozeAgent/knowledge-retrieval.js');

const validation = knowledgeBase.validateCatalog();
assert.strictEqual(validation.valid, true, validation.errors.join('\n'));
assert.strictEqual(validation.packCount, 45);

const catalogText = retrieval.catalogPromptText();
assert.ok(catalogText.includes('mosquito｜白纹伊蚊'));
assert.ok(catalogText.includes('tick｜长角血蜱'));

assert.deepStrictEqual(retrieval.resolveCandidateIds(['mosquito', 'invalid'], '', 3), ['mosquito']);
assert.deepStrictEqual(retrieval.findCandidateIds('我看到一只白纹伊蚊'), ['mosquito']);
assert.deepStrictEqual(retrieval.findCandidateIds('好像被蚊子咬了'), ['mosquito']);
assert.deepStrictEqual(retrieval.resolveCandidateIds(['白纹伊蚊'], '', 3), ['mosquito']);

const emergencyFacts = retrieval.extractSafetyFacts('被虫咬后现在呼吸困难，嘴唇也肿了');
assert.strictEqual(emergencyFacts.redFlags.breathingDifficulty, true);
assert.strictEqual(emergencyFacts.redFlags.airwaySwelling, true);

const negatedFacts = retrieval.extractSafetyFacts('目前没有呼吸困难，也没有发热');
assert.strictEqual(negatedFacts.redFlags, undefined);
assert.strictEqual(negatedFacts.symptoms, undefined);

const worseningFacts = retrieval.extractSafetyFacts('红肿范围持续扩大，而且越来越痛');
assert.strictEqual(worseningFacts.local.trend, 'worsening');

const emergencyEntries = retrieval.retrieve(['mosquito'], emergencyFacts, '');
assert.strictEqual(emergencyEntries.length, 1);
assert.strictEqual(emergencyEntries[0].action.level, 'IMMEDIATE_HELP');
assert.strictEqual(emergencyEntries[0].status, 'DRAFT');
assert.ok(emergencyEntries[0].sources.length > 0);

const observeEntries = retrieval.retrieve([], {}, '白纹伊蚊叮咬');
assert.strictEqual(observeEntries[0].objectId, 'mosquito');
assert.strictEqual(observeEntries[0].action.level, 'OBSERVE');
const context = retrieval.formatContext(observeEntries);
assert.ok(context.includes('team-lead-draft-2026-08-full-v1'));
assert.ok(context.includes('图片候选不参与风险分级'));

assert.ok(retrieval.formatContext([]).includes('未匹配到'));

console.log('knowledge retrieval tests passed');
