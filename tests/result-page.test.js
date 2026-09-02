const assert = require('assert');

let pageDefinition = null;
let storedEvents = [];
let backDelta = 0;
const app = {
  globalData: {
    draftEvent: {
      id: 'event_page_001',
      contactType: 'bite',
      contactTypeName: '叮咬',
      answers: {
        occurredAt: '刚刚',
        bodyParts: ['下肢'],
        localSymptoms: ['红肿'],
        systemicSymptoms: ['无明显'],
        trend: '保持不变',
        count: '单处'
      },
      imageRefs: ['wxfile://usr/event-page-image.jpg'],
      actionsTaken: ['冷敷'],
      matchedRules: [],
      ruleVersion: 'contact-demo-1.1.0'
    }
  }
};

global.Page = definition => {
  pageDefinition = definition;
};
global.getApp = () => app;
global.wx = {
  getStorageSync(key) {
    return key === 'events' ? storedEvents : null;
  },
  setStorageSync(key, value) {
    if (key === 'events') {
      storedEvents = value;
    }
  },
  navigateBack(options) { backDelta = options.delta; }
};

require('../miniprogram/pages/result/result.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  });
}

const firstPage = createPage();
firstPage.onLoad({ level: 'observe' });
assert.strictEqual(storedEvents.length, 1);
assert.strictEqual(storedEvents[0].id, 'event_page_001');
assert.strictEqual(storedEvents[0].occurredAt, '刚刚');
assert.deepStrictEqual(storedEvents[0].imageRefs, ['wxfile://usr/event-page-image.jpg']);
assert.ok(storedEvents[0].summary.includes('身体部位：下肢'));
assert.ok(storedEvents[0].summary.includes('已采取措施：冷敷'));

// 结果页刷新时草稿已经被清理，不应创建第二条空白事件。
const refreshedPage = createPage();
refreshedPage.onLoad({ level: 'observe' });
assert.strictEqual(storedEvents.length, 1);

// 即使同一草稿被重新提交，也应按固定 ID 更新而不是重复新增。
app.globalData.draftEvent = Object.assign({}, storedEvents[0], {
  summary: '',
  answers: Object.assign({}, storedEvents[0].answers, { trend: '正在好转' })
});
const repeatedPage = createPage();
repeatedPage.onLoad({ level: 'observe' });
assert.strictEqual(storedEvents.length, 1);
assert.ok(storedEvents[0].summary.includes('变化趋势：正在好转'));

repeatedPage.onStepChange({ detail: { step: 3 } });
assert.strictEqual(backDelta, 1);
assert.strictEqual(app.globalData.draftEvent.id, 'event_page_001');
assert.notStrictEqual(app.globalData.draftEvent.answers, repeatedPage.data.eventSnapshot.answers);

console.log('result page tests passed');
