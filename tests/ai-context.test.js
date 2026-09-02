const assert = require('assert');
const aiContext = require('../miniprogram/utils/ai-context.js');

const context = aiContext.buildRecordsContext({
  plans: [{
    id: 'p1', destinations: [{ name: '杭州' }, { name: '丽水' }],
    month: '8月', activityType: '徒步', riskTags: ['草地', '高温']
  }],
  events: [{
    id: 'e1', contactTypeName: '叮咬', occurredAt: '今天', riskLevel: 'observe',
    summary: '左小腿局部红肿', reviews: [{ summary: '范围没有扩大' }]
  }]
});

assert.strictEqual(context.planCount, 1);
assert.strictEqual(context.eventCount, 1);
assert.strictEqual(context.empty, false);
assert.ok(context.text.includes('杭州、丽水'));
assert.ok(context.text.includes('最近复查：范围没有扩大'));
assert.strictEqual(aiContext.buildRecordsContext({ plans: [], events: [] }).empty, true);

const cards = aiContext.buildRecordCards({
  plans: [{ destinations: [{ name: '杭州' }], month: '8月', activityType: '徒步', riskTags: ['草地'] }],
  events: [{ contactTypeName: '叮咬', occurredAt: '今天', summary: '局部发红' }]
});
assert.strictEqual(cards.length, 2);
assert.deepStrictEqual(cards[0], {
  kind: 'plan', key: 'plan-0', badge: '行程计划', title: '杭州', subtitle: '8月 · 徒步', detail: '草地'
});
assert.strictEqual(cards[1].kind, 'event');
assert.strictEqual(cards[1].detail, '局部发红');

console.log('ai context tests passed');
