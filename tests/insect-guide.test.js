const assert = require('assert');
const fs = require('fs');
const path = require('path');
const guide = require('../miniprogram/utils/insect-guide.js');

assert.strictEqual(guide.list().length, 45);
assert.deepStrictEqual(guide.list({ group: 'attached' }).map(item => item.id), [
  'tick', 'brown_dog_tick', 'chigger', 'head_louse', 'scabies_mite',
  'hard_ticks_other', 'body_pubic_lice', 'leech'
]);
assert.deepStrictEqual(guide.list({ query: '床虱' }).map(item => item.id), ['bedbug', 'tropical_bedbug']);
assert.ok(guide.list({ query: '宠物' }).some(item => item.id === 'flea'));
assert.deepStrictEqual(guide.list({ query: 'Aedes albopictus' }).map(item => item.id), ['mosquito']);
assert.deepStrictEqual(guide.list({ query: '杭州常见林业害虫' }).map(item => item.id), ['pine_caterpillar']);
assert.deepStrictEqual(guide.list({ query: '三斑家蚊' }).map(item => item.id), ['culex_tritaeniorhynchus']);
assert.ok(guide.list().every(item => item.imageCount === 3 && /\.(webp|svg)$/.test(item.coverImage)));
guide.list().forEach(summary => {
  const item = guide.getById(summary.id);
  assert.ok(item.appearance && item.identificationKeys.length >= 3);
  assert.ok(item.distribution && item.habitat && item.contactPattern && item.commonReaction);
  assert.ok(item.firstActions.length >= 3 && item.caution);
  item.images.forEach(image => {
    const absolutePath = path.join(__dirname, '../miniprogram', image.src.replace(/^\//, ''));
    assert.ok(fs.existsSync(absolutePath), 'missing image: ' + image.src);
  });
});

const tick = guide.getById('tick');
assert.strictEqual(tick.name, '长角血蜱');
assert.strictEqual(tick.scientificName, 'Haemaphysalis longicornis');
assert.strictEqual(tick.images.length, 3);
assert.ok(tick.images.every(image => image.credit && image.license && image.sourceUrl));
assert.ok(tick.firstActions.some(item => item.includes('细尖镊子')));
assert.ok(tick.sources.length >= 1);
const teaTussockMoth = guide.getById('tea_tussock_moth');
assert.strictEqual(teaTussockMoth.zhejiangStatus, '浙江林业防治对象');
assert.ok(teaTussockMoth.aliases.includes('Arna pseudoconspersa'));
assert.ok(teaTussockMoth.sources.some(source => source.title.includes('浙江省地方标准')));
const zhejiangItems = guide.list().filter(item => item.zhejiangStatus);
assert.deepStrictEqual(zhejiangItems.map(item => item.id), [
  'culex_tritaeniorhynchus', 'anopheles_sinensis', 'armigeres_subalbatus',
  'tea_tussock_moth', 'pine_caterpillar', 'brown_dog_tick'
]);
assert.strictEqual(guide.getById('missing'), null);
assert.deepStrictEqual(guide.sanitizeSelection(['midge', 'tick', 'tick', 'mosquito']), ['tick', 'mosquito']);

let selection = guide.toggleSelection([], 'mosquito', 3);
selection = guide.toggleSelection(selection.selectedIds, 'tick', 3);
selection = guide.toggleSelection(selection.selectedIds, 'bee_wasp', 3);
const overflow = guide.toggleSelection(selection.selectedIds, 'flea', 3);
assert.strictEqual(overflow.selectedIds.length, 3);
assert.ok(overflow.error.includes('最多选择'));
const removed = guide.toggleSelection(selection.selectedIds, 'tick', 3);
assert.deepStrictEqual(removed.selectedIds, ['mosquito', 'bee_wasp']);

const comparison = guide.buildComparison(['mosquito', 'tick']);
assert.deepStrictEqual(comparison.items.map(item => item.id), ['mosquito', 'tick']);
assert.ok(comparison.rows.some(row => row.label === '学名'));
assert.ok(comparison.rows.some(row => row.label === '辨识重点'));
assert.ok(comparison.rows.some(row => row.label === '判断边界'));
assert.throws(() => guide.buildComparison(['mosquito']));

console.log('insect guide tests passed');
