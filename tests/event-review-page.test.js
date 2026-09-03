const assert = require('assert');

let pageDefinition = null;
let redirectedUrl = '';
const originalEvent = {
  id: 'event_review_page_001',
  contactType: 'bite',
  contactTypeName: '叮咬',
  riskLevel: 'observe',
  levelName: '观察记录',
  answers: {
    occurredAt: '1小时内',
    bodyParts: ['下肢'],
    localSymptoms: ['红肿'],
    systemicSymptoms: ['无明显'],
    trend: '保持不变',
    count: '单处'
  },
  imageRefs: [],
  summary: '原始事件摘要'
};
let storedEvents = [originalEvent];

global.Page = definition => {
  pageDefinition = definition;
};
global.wx = {
  getStorageSync(key) {
    return key === 'events' ? storedEvents : null;
  },
  setStorageSync(key, value) {
    if (key === 'events') storedEvents = value;
  },
  showToast() {},
  redirectTo(options) {
    redirectedUrl = options.url;
  }
};
global.setTimeout = callback => callback();

require('../miniprogram/pages/event-review/event-review.js');

const loadedPage = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});
loadedPage.onLoad({ id: originalEvent.id });
assert.deepStrictEqual(
  loadedPage.data.questions.map(question => question.key),
  ['bodyParts', 'localSymptoms', 'systemicSymptoms', 'trend', 'dailyImpact']
);
assert.strictEqual(loadedPage.data.questions.some(question => question.key === 'count'), false);
assert.strictEqual(loadedPage.data.questions.some(question => question.key === 'occurredAt'), false);

loadedPage.onActionTap({ currentTarget: { dataset: { v: '未处理' } } });
assert.deepStrictEqual(loadedPage.data.actionsTaken, ['未处理']);
loadedPage.onActionTap({ currentTarget: { dataset: { v: '冷敷' } } });
assert.deepStrictEqual(loadedPage.data.actionsTaken, ['冷敷']);

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data, {
    event: originalEvent,
    answers: {
      bodyParts: [],
      localSymptoms: [],
      systemicSymptoms: [],
      trend: '',
      count: ''
    },
    selectedDanger: ['breath'],
    actionsTaken: ['已就医'],
    previewImage: ''
  }),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.saveReview();
assert.strictEqual(storedEvents.length, 1);
assert.strictEqual(storedEvents[0].reviews.length, 1);
assert.strictEqual(storedEvents[0].riskLevel, 'emergency');
assert.deepStrictEqual(storedEvents[0].answers.bodyParts, ['下肢']);
assert.deepStrictEqual(storedEvents[0].reviews[0].dangerSignals, ['breath']);
assert.ok(storedEvents[0].latestReviewSummary.includes('呼吸异常'));
assert.ok(redirectedUrl.includes(originalEvent.id));

console.log('event review page tests passed');
