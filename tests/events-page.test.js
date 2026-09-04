const assert = require('assert');
const fs = require('fs');
const path = require('path');

let definition;
const now = Date.now();
let storedEvents = [
  { id: 'pending', type: '蚊虫叮咬', contactType: 'bite', level: '观察记录', createdAtTimestamp: now - 60000, nextReviewAtTimestamp: now + 20 * 60000, status: '待复查', body: '小腿', place: '杭州', symptoms: ['红肿'], trend: '基本不变', syncStatus: '已同步' },
  { id: 'done', type: '蜂类蜇伤', contactType: 'sting', level: '观察记录', createdAtTimestamp: now - 120000, status: '已恢复', body: '手背', place: '宁波', symptoms: [], trend: '明显减轻', syncStatus: '已同步' }
];

global.Page = page => { definition = page; };
global.wx = { navigateTo() {}, showActionSheet() {}, showToast() {} };
const store = require('../miniprogram/utils/store.js');
const originalGet = store.get;
const originalSet = store.set;
store.get = key => key === 'events' ? storedEvents : null;
store.set = (key, value) => { if (key === 'events') storedEvents = value; };

require('../miniprogram/pages/events/events.js');
const page = Object.assign({}, definition, { data: Object.assign({}, definition.data) });
page.setData = function (changes, callback) { Object.keys(changes).forEach(key => { this.data[key] = changes[key]; }); if (callback) callback(); };

page.loadEvents();
assert.strictEqual(page.data.pendingEvents.length, 1);
assert.strictEqual(page.data.allEvents.length, 2);
assert.strictEqual(page.data.visibleEvents.length, 1);
assert.strictEqual(page.data.visibleEvents[0].statusText, '即将复查');

page.setTab({ currentTarget: { dataset: { tab: 'all' } } });
assert.strictEqual(page.data.visibleEvents.length, 2);
assert.strictEqual(page.data.visibleEvents[0].footerText, '计划于 ' + page.data.visibleEvents[0].reviewAt + ' 复查');
assert.strictEqual(page.data.visibleEvents[1].footerText, '本次事件已结束');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/events/events.wxml'), 'utf8');
assert.ok(template.includes("<block wx:if=\"{{tab==='pending'}}\"><view class=\"event-symptoms\""));

store.get = originalGet;
store.set = originalSet;
console.log('events page tests passed');
