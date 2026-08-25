const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let modalTitle = '';
let navigatedBack = false;
let postDeleted = false;
let reported = false;
let reaction = { liked: false, collected: false };
let comments = [];
const post = {
  id: 'cloud_post_1', displayName: '云用户', avatarText: '云', text: '我的户外经历',
  createdAtTimestamp: 100, imageRefs: [], tags: [], likeCount: 0, collectCount: 0,
  commentCount: 0, canDelete: true
};

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return { id: 'u1', displayName: '云用户', avatarText: '云', mode: 'wechat_cloud' };
    return null;
  },
  setStorageSync() {},
  showModal(options) {
    modalTitle = options.title;
    if (options.success) options.success({ confirm: true });
  },
  showToast() {},
  navigateBack() { navigatedBack = true; },
  navigateTo() {},
  previewImage() {},
  cloud: {
    init() {},
    callFunction(options) {
      const data = options.data;
      if (data.action === 'get') {
        if (data.postId === 'missing_post' || postDeleted) {
          return Promise.reject(new Error('帖子不存在或已删除'));
        }
        return Promise.resolve({ result: {
          post: Object.assign({}, post, reaction, {
            likeCount: reaction.liked ? 1 : 0,
            collectCount: reaction.collected ? 1 : 0,
            commentCount: comments.length
          }),
          comments: comments.slice(),
          reported
        } });
      }
      if (data.action === 'toggleReaction') {
        reaction[data.key] = !reaction[data.key];
        return Promise.resolve({ result: { reaction } });
      }
      if (data.action === 'comment') {
        comments.push({
          id: 'comment_1', displayName: data.profile.displayName, avatarText: '云',
          text: data.text, createdAtTimestamp: 200, canDelete: true
        });
        return Promise.resolve({ result: { comment: comments[0] } });
      }
      if (data.action === 'deleteComment') {
        comments = comments.filter(item => item.id !== data.commentId);
        return Promise.resolve({ result: { success: true } });
      }
      if (data.action === 'report') {
        reported = true;
        return Promise.resolve({ result: { success: true, reported: true } });
      }
      if (data.action === 'deletePost') {
        postDeleted = true;
        return Promise.resolve({ result: { success: true } });
      }
      if (data.action === 'stats') return Promise.resolve({ result: { posts: postDeleted ? 0 : 1, comments: comments.length, collections: reaction.collected ? 1 : 0 } });
      return Promise.resolve({ result: {} });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/post-detail/post-detail.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

(async () => {
  const page = createPage();
  page.onLoad({ id: 'cloud_post_1' });
  await page.loadThread();
  assert.strictEqual(page.data.post.id, 'cloud_post_1');

  page.toggleLike();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.post.liked, true);
  page.toggleCollect();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.post.collected, true);

  page.onCommentInput({ detail: { value: '谢谢分享这段经历' } });
  page.submitComment();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.commentCount, 1);
  assert.strictEqual(page.data.comments[0].canDelete, true);
  page.deleteComment({ currentTarget: { dataset: { id: 'comment_1' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.commentCount, 0);

  page.report();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.reported, true);
  assert.strictEqual(modalTitle, '举报不当内容');

  page.deletePost();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(postDeleted, true);
  assert.strictEqual(navigatedBack, true);

  const missingPage = createPage();
  missingPage.onLoad({ id: 'missing_post' });
  await missingPage.loadThread();
  assert.strictEqual(modalTitle, '帖子不存在');
  cloudService.resetForTests();
  console.log('post detail page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
