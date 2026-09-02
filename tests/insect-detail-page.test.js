const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let selectedIds = ['mosquito'];
let navigatedUrl = '';
let copiedUrl = '';
let previewOptions = null;

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync() { return selectedIds; },
  setStorageSync(key, value) { selectedIds = value; },
  showToast() {},
  navigateBack() {},
  navigateTo(options) { navigatedUrl = options.url; },
  setClipboardData(options) { copiedUrl = options.data; },
  previewImage(options) { previewOptions = options; }
};

require('../miniprogram/pages/insect-detail/insect-detail.js');
const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

page.onLoad({ id: 'tick' });
assert.strictEqual(page.data.item.name, '长角血蜱');
assert.ok(page.data.item.aliasText.includes('蜱虫'));
assert.strictEqual(page.data.item.images.length, 3);
assert.strictEqual(page.data.activePhoto.src, page.data.item.images[0].src);
assert.strictEqual(page.data.selected, false);

page.onGalleryChange({ detail: { current: 1 } });
assert.strictEqual(page.data.activeImageIndex, 1);
assert.strictEqual(page.data.activePhoto.src, page.data.item.images[1].src);
page.previewImage({ currentTarget: { dataset: { index: 2 } } });
assert.strictEqual(previewOptions.urls.length, 3);
assert.strictEqual(previewOptions.current, page.data.item.images[2].src);

page.toggleCompare();
assert.strictEqual(page.data.selected, true);
assert.deepStrictEqual(selectedIds, ['mosquito', 'tick']);

page.goCompare();
assert.ok(navigatedUrl.includes('/pages/insect-compare/insect-compare?ids='));

page.copySource({ currentTarget: { dataset: { url: page.data.item.sources[0].url } } });
assert.ok(copiedUrl.startsWith('https://'));
page.copyImageSource({ currentTarget: { dataset: { url: page.data.item.images[0].sourceUrl } } });
assert.ok(copiedUrl.includes('commons.wikimedia.org'));

page.goContact();
assert.strictEqual(navigatedUrl, '/pages/danger/danger');

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/insect-detail/insect-detail.wxml'), 'utf8');
assert.ok(template.includes('<swiper'));
assert.ok(template.includes('bindtap="previewImage"'));
assert.ok(template.includes('图片来源与许可'));

console.log('insect detail page tests passed');
