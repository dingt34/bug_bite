const assert = require('assert');

let pageDefinition = null;
let chooseMode = 'success';
let navigatedUrl = '';

global.Page = definition => { pageDefinition = definition; };
global.setTimeout = callback => callback();
global.wx = {
  chooseImage(options) {
    if (chooseMode === 'success') options.success({ tempFilePaths: ['/tmp/insect.jpg'] });
    else options.fail({ errMsg: 'chooseImage:fail permission denied' });
  },
  navigateTo(options) { navigatedUrl = options.url; }
};

require('../miniprogram/pages/identify/identify.js');

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(update) {
    this.data = Object.assign({}, this.data, update);
  }
});

page.chooseImage();
assert.strictEqual(page.data.status, 'ready');
page.recognize();
assert.strictEqual(page.data.status, 'done');
assert.strictEqual(page.data.result.provider, 'local_demo');
assert.ok(page.data.result.note.includes('固定演示候选'));

chooseMode = 'fail';
page.chooseImage();
assert.strictEqual(page.data.status, 'error');
assert.ok(page.data.errorMessage.includes('图片选择失败'));

page.goContact();
assert.strictEqual(navigatedUrl, '/pages/contact/contact');

console.log('identify page tests passed');
