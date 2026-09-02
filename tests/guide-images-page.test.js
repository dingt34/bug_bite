const assert = require('assert');

let pageDefinition = null;
let nextImage = '';
let navigatedUrl = '';
const savedPaths = [];
const app = {
  globalData: {
    draftEvent: {
      id: 'event_guide_images_001',
      contactType: 'bite',
      contactTypeName: '叮咬'
    }
  }
};

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
global.wx = {
  chooseImage(options) { options.success({ tempFilePaths: [nextImage] }); },
  saveFile(options) {
    savedPaths.push(options.tempFilePath);
    options.success({ savedFilePath: 'wxfile://usr/' + options.tempFilePath.split('/').pop() });
  },
  navigateTo(options) { navigatedUrl = options.url; },
  showModal() {}
};

require('../miniprogram/pages/guide/guide.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data, {
    contactType: 'bite',
    answers: {
      systemicSymptoms: ['无明显'],
      localSymptoms: ['红肿'],
      trend: '保持不变'
    },
    persistedImages: { insect: false, wound: false }
  }),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

assert.strictEqual(page.data.actionOptions.includes('服药'), false);
assert.strictEqual(page.data.actionOptions.includes('挤压伤口'), false);
page.data.actionOptions = page.buildActionOptions('bite');
assert.strictEqual(page.data.actionOptions.includes('尚未处理'), true);

nextImage = '/tmp/insect.jpg';
page.chooseImage({ currentTarget: { dataset: { type: 'insect' } } });
nextImage = '/tmp/wound.jpg';
page.chooseImage({ currentTarget: { dataset: { type: 'wound' } } });
assert.strictEqual(page.data.insectImage, '/tmp/insect.jpg');
assert.strictEqual(page.data.woundImage, '/tmp/wound.jpg');

page.onActionTap({ currentTarget: { dataset: { v: '尚未处理' } } });
assert.deepStrictEqual(page.data.actionsTaken, ['尚未处理']);
page.onActionTap({ currentTarget: { dataset: { v: '已隔布冷敷' } } });
assert.deepStrictEqual(page.data.actionsTaken, ['已隔布冷敷']);

let persisted = false;
page.persistImage(() => { persisted = true; });
assert.strictEqual(persisted, true);
assert.deepStrictEqual(savedPaths, ['/tmp/insect.jpg', '/tmp/wound.jpg']);
assert.strictEqual(page.data.insectImage, 'wxfile://usr/insect.jpg');
assert.strictEqual(page.data.woundImage, 'wxfile://usr/wound.jpg');

page.finishSubmit();
assert.deepStrictEqual(app.globalData.draftEvent.imageRefs, [
  'wxfile://usr/insect.jpg',
  'wxfile://usr/wound.jpg'
]);
assert.deepStrictEqual(
  app.globalData.draftEvent.imageRecords.map(item => item.category),
  ['insect', 'wound']
);
assert.ok(navigatedUrl.startsWith('/pages/result/result?level='));

console.log('guide image page tests passed');
