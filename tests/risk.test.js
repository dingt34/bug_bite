const assert = require('assert');
const risk = require('../miniprogram/utils/risk.js');
const mock = require('../miniprogram/utils/mock.js');

assert.deepStrictEqual(
  mock.DANGER_SIGNALS.map(signal => signal.key),
  ['breath', 'swell', 'conscious', 'multi', 'worsen']
);
assert.strictEqual(mock.DANGER_SIGNALS.find(signal => signal.key === 'multi').contactTypes.join(','), 'bite,sting');
assert.strictEqual(mock.COMMON_QUESTIONS.find(question => question.key === 'trend').options.includes('快速加重'), false);
assert.strictEqual(mock.SPECIFIC_QUESTIONS.bite[0].options.includes('大量多处'), false);
assert.strictEqual(mock.SPECIFIC_QUESTIONS.sting[0].options.includes('大量多处'), false);
assert.deepStrictEqual(
  mock.REVIEW_QUESTIONS.common.map(question => question.key),
  ['bodyParts', 'localSymptoms', 'systemicSymptoms', 'trend', 'dailyImpact']
);
assert.strictEqual(mock.REVIEW_QUESTIONS.attachment.length, 1);
assert.strictEqual(mock.REVIEW_QUESTIONS.attachment[0].key, 'removed');

const questions = [
  { key: 'occurredAt', label: '发生时间', type: 'single' },
  { key: 'bodyParts', label: '身体部位', type: 'chips' }
];

assert.deepStrictEqual(
  risk.validateRequiredAnswers(questions, { occurredAt: '', bodyParts: [] }).map(item => item.key),
  ['occurredAt', 'bodyParts']
);

assert.strictEqual(
  risk.evaluateRisk('bite', {
    systemicSymptoms: ['无明显'],
    localSymptoms: ['红肿'],
    trend: '保持不变',
    count: '单处'
  }).level,
  'observe'
);

assert.strictEqual(
  risk.evaluateRisk('sting', {
    systemicSymptoms: ['无明显'],
    localSymptoms: ['红肿'],
    trend: '保持不变',
    count: '少数几处',
    distribution: '分散全身'
  }).level,
  'consult'
);

const ordinaryAssessment = risk.evaluateRisk('bite', {
  systemicSymptoms: ['无明显'],
  localSymptoms: ['红肿'],
  trend: '逐渐加重',
  count: '单处'
});
assert.strictEqual(ordinaryAssessment.level, 'consult');
assert.strictEqual(ordinaryAssessment.matchedRules[0].id, 'symptoms_worsening');

assert.strictEqual(
  risk.evaluateRisk('bite', {
    systemicSymptoms: ['无明显'],
    localSymptoms: ['渗液/脓液'],
    trend: '基本不变'
  }).level,
  'consult'
);

assert.strictEqual(
  risk.evaluateRisk('bite', {
    bodyParts: ['眼周'],
    systemicSymptoms: ['无明显'],
    localSymptoms: ['红斑/红肿'],
    trend: '略有好转'
  }).level,
  'consult'
);

const attachment = risk.evaluateRisk('attachment', {
  systemicSymptoms: ['无明显'],
  localSymptoms: ['无明显'],
  trend: '保持不变',
  attachedTime: '超过24小时',
  removed: '未移除'
});
assert.strictEqual(attachment.level, 'consult');
assert.strictEqual(attachment.matchedRules.length, 2);
assert.strictEqual(attachment.ruleVersion, risk.RULE_VERSION);

console.log('risk tests passed');
