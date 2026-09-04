const assert = require('assert');
const adapter = require('../miniprogram/utils/precheck-knowledge');
const knowledgeBase = require('../cloudfunctions/aiAssistant/knowledge-base');

assert.strictEqual(adapter.CATALOG_SIZE, 45);
assert.strictEqual(adapter.REVIEW_STATUS, 'DRAFT');

adapter.ENTRIES.forEach(entry => {
  const pack = knowledgeBase.getKnowledgePack(entry.objectId);
  const prevention = pack.contentBlocks.find(block => block.stage === 'prevention');
  assert.ok(prevention, `${entry.objectId} 缺少 prevention 内容块`);
  assert.deepStrictEqual(entry.prevention, prevention.body, `${entry.objectId} 离线预防文案与知识库不一致`);
  assert.strictEqual(entry.possiblePlaces, pack.organism.occurrenceReference.possiblePlaceDescription, `${entry.objectId} 离线地点参考与知识库不一致`);
  assert.strictEqual(entry.packVersion, pack.meta.version);
  assert.strictEqual(entry.ruleVersion, pack.meta.ruleVersion);
  assert.strictEqual(adapter.REVIEW_STATUS, pack.meta.status);
});

const forestTrip = adapter.matchKnowledge({ month: '8月', activityType: '徒步登山', habitatTags: ['高草/灌木', '林地/落叶层'], overnight: '当日往返', companionTags: [] });
assert.ok(forestTrip.some(item => item.objectId === 'tick'));
assert.ok(forestTrip.some(item => item.objectId === 'caterpillar'));
assert.ok(forestTrip.every(item => item.status === 'DRAFT'));

const indoorTrip = adapter.matchKnowledge({ month: '1月', activityType: '其他户外活动', habitatTags: ['室内住宿'], overnight: '室内住宿', companionTags: [] });
assert.deepStrictEqual(indoorTrip.map(item => item.objectId), ['bedbug']);
assert.ok(indoorTrip[0].possiblePlaces.includes('床垫包边'));

console.log('precheck knowledge adapter tests passed');
