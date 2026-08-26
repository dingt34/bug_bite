const assert = require('assert');
const fs = require('fs');
const path = require('path');

let pageDefinition = null;
let selectedIds = [];
let navigatedUrl = '';
let toastTitle = '';

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) { return key === 'insectGuideCompare' ? selectedIds : null; },
  setStorageSync(key, value) {
    if (key === 'insectGuideCompare') selectedIds = value;
  },
  navigateTo(options) { navigatedUrl = options.url; },
  showToast(options) { toastTitle = options.title; }
};

require('../miniprogram/pages/insect-guide/insect-guide.js');
const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) { this.data = Object.assign({}, this.data, update); }
});

page.onLoad({});
assert.strictEqual(page.data.items.length, 29);

page.setGroup({ currentTarget: { dataset: { group: 'attached' } } });
assert.deepStrictEqual(page.data.items.map(item => item.id), ['tick', 'brown_dog_tick', 'chigger', 'head_louse', 'scabies_mite']);

page.setData({ activeGroup: 'all' });
page.onSearchInput({ detail: { value: '床虱' } });
assert.deepStrictEqual(page.data.items.map(item => item.id), ['bedbug']);

page.toggleCompare({ currentTarget: { dataset: { id: 'bedbug' } } });
page.toggleCompare({ currentTarget: { dataset: { id: 'tick' } } });
assert.strictEqual(page.data.selectedCount, 2);
page.goCompare();
assert.ok(navigatedUrl.includes('/pages/insect-compare/insect-compare?ids='));

page.goDetail({ currentTarget: { dataset: { id: 'tick' } } });
assert.strictEqual(navigatedUrl, '/pages/insect-detail/insect-detail?id=tick');

page.clearSelection();
page.goCompare();
assert.ok(toastTitle.includes('至少选择'));

const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/insect-guide/insect-guide.wxml'), 'utf8');
assert.ok(template.includes('item.coverImage'));
assert.ok(template.includes('item.scientificName'));
assert.ok(template.includes('item.imageCount'));
assert.ok(template.includes('item.zhejiangStatus'));

console.log('insect guide page tests passed');
