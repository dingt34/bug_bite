const assert = require('assert');

let pageDefinition = null;
let reactions = {};
let reports = {};
let modalTitle = '';
let navigatedBack = false;

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'posts') return [];
    if (key === 'postReactions') return reactions;
    if (key === 'reportedPosts') return reports;
    return null;
  },
  setStorageSync(key, value) {
    if (key === 'postReactions') reactions = value;
    if (key === 'reportedPosts') reports = value;
  },
  showModal(options) {
    modalTitle = options.title;
    if (options.success) options.success({ confirm: true });
  },
  showToast() {},
  navigateBack() { navigatedBack = true; },
  navigateTo() {}
};

require('../miniprogram/pages/post-detail/post-detail.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  });
}

const page = createPage();
page.onLoad({ id: 'post_001' });
page.onShow();
assert.strictEqual(page.data.post.id, 'post_001');
page.toggleLike();
assert.strictEqual(page.data.post.liked, true);
assert.strictEqual(page.data.post.likeCount, 13);
page.toggleCollect();
assert.strictEqual(page.data.post.collected, true);

page.report();
assert.strictEqual(page.data.reported, true);
assert.ok(reports.post_001);
assert.strictEqual(modalTitle, '标记不当内容');

const missingPage = createPage();
missingPage.onLoad({ id: 'missing_post' });
missingPage.onShow();
assert.strictEqual(missingPage.data.post, null);
assert.strictEqual(modalTitle, '帖子不存在');
assert.strictEqual(navigatedBack, true);

console.log('post detail page tests passed');
