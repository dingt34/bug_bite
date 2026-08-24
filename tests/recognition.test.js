const assert = require('assert');
const recognition = require('../miniprogram/utils/recognition.js');

assert.strictEqual(recognition.clampScore(-1), 0);
assert.strictEqual(recognition.clampScore(2), 1);
assert.strictEqual(recognition.clampScore('bad'), 0);

const result = recognition.buildDemoResult({
  providerName: '本地模拟识别',
  versionName: '演示版',
  candidates: [
    { name: '候选甲', score: 0.876 },
    { name: '候选乙', score: 3 }
  ]
});
assert.strictEqual(result.provider, 'local_demo');
assert.deepStrictEqual(result.candidates, [
  { name: '候选甲', percent: 88 },
  { name: '候选乙', percent: 100 }
]);
assert.throws(() => recognition.buildDemoResult(null));

console.log('recognition tests passed');
