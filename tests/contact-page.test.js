const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let navigatedUrl = '';
const app = { globalData: { draftEvent: null } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  navigateTo(options) { navigatedUrl = options.url; },
  navigateBack(options) { navigatedUrl = 'back:' + options.delta; }
};

require('../miniprogram/pages/contact/contact.js');

pageDefinition.select({ currentTarget: { dataset: { key: 'contact' } } });
assert.strictEqual(app.globalData.draftEvent.contactType, 'contact');
assert.strictEqual(app.globalData.draftEvent.contactTypeName, '毒毛、体液或皮肤接触');
assert.strictEqual(navigatedUrl, '/pages/guide/guide?contactType=contact');

pageDefinition.onStepChange({ detail: { step: 1 } });
assert.strictEqual(navigatedUrl, 'back:1');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/contact/contact.wxml'), 'utf8');
assert.ok(template.includes('<safety-nav current="2"'));
const navSource = fs.readFileSync(path.join(__dirname, '../miniprogram/components/safety-nav/safety-nav.js'), 'utf8');
assert.ok(navSource.includes('危险筛查'));
assert.ok(navSource.includes('接触类型'));
assert.ok(navSource.includes('症状记录'));
assert.ok(navSource.includes('行动建议'));

console.log('contact page tests passed');
