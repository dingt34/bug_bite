const assert = require('assert');
const eventUtils = require('../miniprogram/utils/event.js');

const draft = {
  id: 'event_fixed_001',
  contactType: 'bite',
  contactTypeName: '叮咬',
  answers: {
    occurredAt: '1小时内',
    bodyParts: ['下肢']
  },
  imageRefs: ['wxfile://usr/persistent-image.jpg'],
  ruleVersion: 'contact-demo-1.1.0'
};

const event = eventUtils.buildEvent(draft, {
  level: 'observe',
  levelName: '观察记录',
  nextReviewAt: '建议 3 天后复查',
  summary: '接触类型：叮咬\n发生时间：1小时内'
}, 1000);

assert.strictEqual(event.id, 'event_fixed_001');
assert.strictEqual(event.occurredAt, '1小时内');
assert.strictEqual(event.summary, '接触类型：叮咬\n发生时间：1小时内');
assert.deepStrictEqual(event.imageRefs, ['wxfile://usr/persistent-image.jpg']);
assert.strictEqual(event.ruleVersion, 'contact-demo-1.1.0');

const categorizedEvent = eventUtils.buildEvent({
  id: 'event_images_001',
  contactType: 'bite',
  insectImageRef: 'wxfile://usr/insect.jpg',
  woundImageRef: 'wxfile://usr/wound.jpg',
  imageRecords: [
    { category: 'insect', label: '虫体照片', path: 'wxfile://usr/insect.jpg' },
    { category: 'wound', label: '伤口/皮肤表现照片', path: 'wxfile://usr/wound.jpg' }
  ]
}, {
  level: 'observe',
  levelName: '观察记录',
  nextReviewAt: '建议复查',
  summary: '双图片事件'
}, 1500);
assert.deepStrictEqual(categorizedEvent.imageRefs, [
  'wxfile://usr/insect.jpg',
  'wxfile://usr/wound.jpg'
]);
assert.strictEqual(categorizedEvent.imageRecords[0].category, 'insect');

const inserted = eventUtils.upsertEvent([], event);
assert.strictEqual(inserted.length, 1);

const updated = eventUtils.upsertEvent(inserted, Object.assign({}, event, { summary: '更新后的摘要' }));
assert.strictEqual(updated.length, 1);
assert.strictEqual(updated[0].summary, '更新后的摘要');

const emergency = eventUtils.buildEvent({
  id: 'event_emergency_001',
  contactType: 'sting',
  imageRefs: []
}, {
  level: 'emergency',
  levelName: '紧急求助',
  nextReviewAt: '遵医嘱',
  summary: '紧急事件'
}, 2000);
assert.strictEqual(emergency.occurredAt, '未填写（紧急流程）');

const reviewed = eventUtils.appendReview(event, {
  id: 'review_001',
  createdAt: '2026-08-24 18:00',
  answers: { trend: '正在好转' },
  imageRefs: ['wxfile://usr/review-image.jpg'],
  dangerSignals: [],
  riskLevel: 'observe',
  levelName: '观察记录',
  nextReviewAt: '建议 3 天后复查',
  summary: '本次复查正在好转'
}, 3000);
assert.strictEqual(reviewed.reviews.length, 1);
assert.strictEqual(reviewed.riskLevel, 'observe');
assert.strictEqual(reviewed.answers.occurredAt, '1小时内');
assert.strictEqual(reviewed.answers.trend, '正在好转');
assert.deepStrictEqual(reviewed.imageRefs, [
  'wxfile://usr/persistent-image.jpg',
  'wxfile://usr/review-image.jpg'
]);
assert.strictEqual(reviewed.summary, event.summary);
assert.strictEqual(reviewed.latestReviewSummary, '本次复查正在好转');

assert.deepStrictEqual(eventUtils.resolveReviewLevel('consult', 'observe'), {
  level: 'observe',
  downgradeBlocked: false
});
assert.deepStrictEqual(eventUtils.resolveReviewLevel('emergency', 'observe'), {
  level: 'emergency',
  downgradeBlocked: true
});

console.log('event tests passed');
