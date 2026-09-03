const assert = require('assert');
const resultContent = require('../miniprogram/utils/result-content.js');

const tickAdvice = resultContent.getResultContent('observe', 'attachment');
assert.ok(tickAdvice.actions.some(item => item.includes('细尖镊子')));
assert.ok(tickAdvice.actions.some(item => item.includes('不要用油脂')));
assert.ok(tickAdvice.seekHelp.some(item => item.includes('数天至数周')));

const hairAdvice = resultContent.getResultContent('consult', 'contact');
assert.strictEqual(hairAdvice.actions[0], '尽快联系医疗机构或专业人员');
assert.ok(hairAdvice.actions.some(item => item.includes('胶带')));
assert.ok(hairAdvice.seekHelp.some(item => item.includes('疑似吸入毒毛')));

const emergencyAdvice = resultContent.getResultContent('emergency', 'sting');
assert.strictEqual(emergencyAdvice.actions[0], '立即拨打 120 或前往最近急诊');
assert.strictEqual(emergencyAdvice.actions.some(item => item.includes('蜂刺')), false);

console.log('result content tests passed');
