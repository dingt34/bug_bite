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

console.log('ai context tests passed');
