const assert = require('assert');
const fs = require('fs');
const path = require('path');

let definition;
let selected = [];
let navigatedUrl = '';
let toast = '';

global.Page = page => { definition = page; };
global.getCurrentPages = () => [{}, {}];
global.wx = {
  getStorageSync() { return selected; },
  setStorageSync(key, value) { selected = value; },
  showToast(options) { toast = options.title; },
  navigateBack() {},
  navigateTo(options) { navigatedUrl = options.url; },
  setNavigationBarTitle() {}
};

require('../miniprogram/pages/insect-detail/insect-detail.js');
const page = Object.assign({}, definition, {
  data: Object.assign({}, definition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

page.onLoad({ id: 'tick' });
assert.strictEqual(page.data.name, '长角血蜱');
assert.ok(page.data.features.length);
assert.strictEqual(page.data.images.length, 3);
assert.ok(page.data.appearance && page.data.identificationKeys.length >= 3);
page.compare();
assert.strictEqual(page.data.inCompare, true);
assert.deepStrictEqual(selected, ['tick']);
page.openCompare();
assert.ok(toast.includes('再选一种'));

selected = ['tick', 'mosquito'];
page.openCompare();
assert.ok(navigatedUrl.startsWith('/pages/compare/compare?ids='));
page.danger();
assert.strictEqual(navigatedUrl, '/pages/danger/danger?source=insect');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/insect-detail/insect-detail.wxml'), 'utf8');
assert.ok(template.includes('安全判断'));
assert.ok(template.includes('<swiper class="species-gallery"'));
assert.ok(template.includes('形态与辨识'));
assert.ok(template.includes('分布与环境'));
assert.ok(template.includes('资料来源'));

const candidate = Object.assign({}, definition, {
  data: Object.assign({}, definition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});
candidate.onLoad({ id: 'spider' });
assert.strictEqual(candidate.data.images.length, 3);
assert.strictEqual(candidate.data.mediaPending, true);
assert.ok(candidate.data.caution.includes('不是物种确证照片'));

console.log('insect detail page tests passed');
