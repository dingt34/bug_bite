const assert = require('assert');

let pageDefinition = null;
let reactions = {};
let reports = {};
let comments = {};
let localPosts = [];
let tombstones = {};
let modalTitle = '';
let navigatedBack = false;

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'posts') return localPosts;
    if (key === 'postReactions') return reactions;
    if (key === 'reportedPosts') return reports;
    if (key === 'postComments') return comments;
    if (key === 'cloudTombstones') return tombstones;
    if (key === 'userInfo') return { id: 'u1', displayName: '山野观察员', avatarText: '山' };
    return null;
  },
  setStorageSync(key, value) {
    if (key === 'postReactions') reactions = value;
    if (key === 'reportedPosts') reports = value;
    if (key === 'postComments') comments = value;
    if (key === 'posts') localPosts = value;
    if (key === 'cloudTombstones') tombstones = value;
  },
  showModal(options) {
    modalTitle = options.title;
    if (options.success) options.success({ confirm: true });
  },
  showToast() {},
  navigateBack() { navigatedBack = true; },
  navigateTo() {},
  removeSavedFile() {}
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
page.onCommentInput({ detail: { value: '谢谢分享这段经历' } });
page.submitComment();
assert.strictEqual(page.data.commentCount, 1);
assert.strictEqual(comments.post_001[0].displayName, '山野观察员');

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

localPosts = [{
  id: 'mine_1', authorId: 'u1', displayName: '山野观察员', avatarText: '山',
  text: '我的户外经历', local: true, createdAtTimestamp: 100, imageRefs: []
}];
const ownPage = createPage();
ownPage.onLoad({ id: 'mine_1' });
ownPage.onShow();
assert.strictEqual(ownPage.data.canDelete, true);
ownPage.deletePost();
assert.strictEqual(localPosts.length, 0);
assert.ok(tombstones.posts.mine_1);

console.log('post detail page tests passed');
