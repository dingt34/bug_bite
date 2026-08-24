const assert = require('assert');

let pageDefinition = null;
let redirectedUrl = '';
let navigatedUrl = '';
const app = { globalData: { draftEvent: null } };

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  redirectTo(options) { redirectedUrl = options.url; },
  navigateTo(options) { navigatedUrl = options.url; },
  makePhoneCall() {}
};

require('../miniprogram/pages/danger/danger.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  });
}

const emergencyPage = createPage();
emergencyPage.onLoad({ contactType: 'bite' });
emergencyPage.setData({ selected: ['breath'] });
emergencyPage.goEmergency();
assert.strictEqual(app.globalData.draftEvent.contactType, 'bite');
assert.deepStrictEqual(app.globalData.draftEvent.dangerSignals, ['breath']);
assert.strictEqual(app.globalData.draftEvent.matchedRules[0].id, 'danger_breath');
assert.ok(app.globalData.draftEvent.ruleVersion);
assert.ok(redirectedUrl.includes('level=emergency'));

app.globalData.draftEvent = null;
const guidePage = createPage();
guidePage.onLoad({ contactType: 'attachment' });
guidePage.continueGuide();
assert.strictEqual(app.globalData.draftEvent.contactType, 'attachment');
assert.strictEqual(navigatedUrl, '/pages/guide/guide?contactType=attachment');

console.log('danger page tests passed');
