const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let navigatedUrl = '';
let backed = false;

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  navigateBack() { backed = true; },
  navigateTo(options) { navigatedUrl = options.url; }
};

require('../miniprogram/pages/insect-compare/insect-compare.js');
const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

page.onLoad({ ids: encodeURIComponent('mosquito,tick,bee_wasp') });
assert.deepStrictEqual(
  page.data.comparison.items.map(item => item.id),
  ['mosquito', 'tick', 'bee_wasp']
);
assert.ok(page.data.comparison.rows.some(row => row.label === '常见环境'));
assert.ok(page.data.comparison.items.every(item => item.coverImage.endsWith('.webp')));

page.goContact();
assert.strictEqual(navigatedUrl, '/pages/contact/contact');
page.backToGuide();
assert.strictEqual(backed, true);

page.onLoad({ ids: 'mosquito' });
assert.ok(page.data.errorMessage.includes('至少 2 个物种'));

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/insect-compare/insect-compare.wxml'), 'utf8');
assert.ok(template.includes('item.coverImage'));
assert.ok(template.includes('item.scientificName'));

console.log('insect compare page tests passed');
