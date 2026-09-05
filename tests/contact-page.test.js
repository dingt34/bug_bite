const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let navigatedUrl = '';
const storage = {};

global.Page = definition => { pageDefinition = definition; };
global.getCurrentPages = () => [];
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  redirectTo(options) { navigatedUrl = options.url; },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast() {}
};

storage.bugtrail_v4_safetyDraft = {
  sessionId: 'finished-session', screened: true, contactType: 'bite', completedAt: 123,
  eventId: 'old-event', symptoms: ['瘙痒'], facts: { bodyPart: '手臂' }, step: 4
};

require('../miniprogram/pages/contact/contact.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update, callback) { this.data = Object.assign({}, this.data, update); if (callback) callback(); }
});

page.onLoad();
assert.strictEqual(page.data.selected, '');
assert.strictEqual(storage.bugtrail_v4_safetyDraft.eventId, undefined);
assert.notStrictEqual(storage.bugtrail_v4_safetyDraft.sessionId, 'finished-session');

page.select({ currentTarget: { dataset: { id: 'contact' } } });
page.next();
assert.strictEqual(storage.bugtrail_v4_safetyDraft.contactType, 'contact');
assert.strictEqual(navigatedUrl, '/pages/guide/guide?type=contact');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/contact/contact.wxml'), 'utf8');
assert.ok(template.includes('unknown-card'));
assert.ok(template.includes('contact-footer'));

console.log('contact page tests passed');
