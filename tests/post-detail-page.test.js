const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let modalTitle = '';
let navigatedBack = false;
let postDeleted = false;
let reported = false;
let reportedCommentId = '';
let navigatedUrl = '';
let reaction = { liked: false, collected: false };
let comments = [];
let commentSequence = 0;
const app = { globalData: {} };
const post = {
  id: 'cloud_post_1', displayName: '云用户', avatarText: '云', text: '我的户外经历',
  createdAtTimestamp: 100, imageRefs: [], tags: [], likeCount: 0, collectCount: 0,
  commentCount: 0, canDelete: true, contactType: 'bite'
};

global.Page = definition => { pageDefinition = definition; };
global.getApp = () => app;
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
  navigateTo(options) { navigatedUrl = options.url; },
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
        commentSequence += 1;
        const parent = comments.find(item => item.id === data.parentCommentId);
        const comment = {
          id: 'comment_' + commentSequence,
          displayName: data.profile.displayName,
          avatarText: '云',
          text: data.text,
          createdAtTimestamp: 100 + commentSequence * 100,
          canDelete: true,
          parentCommentId: parent ? parent.id : '',
          rootCommentId: parent ? (parent.rootCommentId || parent.id) : '',
          replyToDisplayName: parent ? parent.displayName : '',
          liked: false,
          disliked: false,
          likeCount: 0,
          dislikeCount: 0
        };
        comments.push(comment);
        return Promise.resolve({ result: { comment } });
      }
      if (data.action === 'toggleCommentVote') {
        const comment = comments.find(item => item.id === data.commentId);
        const previousVote = comment.liked ? 1 : (comment.disliked ? -1 : 0);
        const requestedVote = data.vote === 'down' ? -1 : 1;
        const nextVote = previousVote === requestedVote ? 0 : requestedVote;
        comment.likeCount += (nextVote === 1 ? 1 : 0) - (previousVote === 1 ? 1 : 0);
        comment.dislikeCount += (nextVote === -1 ? 1 : 0) - (previousVote === -1 ? 1 : 0);
        comment.liked = nextVote === 1;
        comment.disliked = nextVote === -1;
        return Promise.resolve({ result: {
          commentId: comment.id,
          liked: comment.liked,
          disliked: comment.disliked,
          likeCount: comment.likeCount,
          dislikeCount: comment.dislikeCount
        } });
      }
      if (data.action === 'deleteComment') {
        comments = comments.filter(item => item.id !== data.commentId);
        return Promise.resolve({ result: { success: true } });
      }
      if (data.action === 'report') {
        reported = true;
        return Promise.resolve({ result: { success: true, reported: true } });
      }
      if (data.action === 'reportComment') {
        reportedCommentId = data.commentId;
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
    dataUpdates: [],
    setData(update) {
      this.dataUpdates.push(update);
      this.data = Object.assign({}, this.data, update);
    }
  });
}

(async () => {
  const page = createPage();
  page.onLoad({ id: 'cloud_post_1' });
  await page.loadThread();
  assert.strictEqual(page.data.post.id, 'cloud_post_1');
  page.goSafety();
  assert.strictEqual(app.globalData.safetyReturnPostId, 'cloud_post_1');
  assert.strictEqual(navigatedUrl, '/pages/contact/contact?fromPost=cloud_post_1&recommended=bite');

  page.dataUpdates = [];
  page.toggleLike();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.post.liked, true);
  assert.strictEqual(page.dataUpdates.some(update => update.loading === true), false,
    '详情页点赞不应触发页面级加载状态');
  page.dataUpdates = [];
  page.toggleCollect();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.post.collected, true);
  assert.strictEqual(page.dataUpdates.some(update => update.loading === true), false,
    '详情页收藏不应触发页面级加载状态');

  page.onCommentInput({ detail: { value: '谢谢分享这段经历' } });
  page.submitComment();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.commentCount, 1);
  assert.strictEqual(page.data.comments[0].canDelete, true);
  page.toggleCommentVote({ currentTarget: { dataset: { id: 'comment_1', vote: 'up' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.comments[0].liked, true);
  assert.strictEqual(page.data.comments[0].likeCount, 1);
  page.toggleCommentVote({ currentTarget: { dataset: { id: 'comment_1', vote: 'down' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.comments[0].liked, false);
  assert.strictEqual(page.data.comments[0].disliked, true);
  assert.strictEqual(page.data.comments[0].likeCount, 0);
  assert.strictEqual(page.data.comments[0].dislikeCount, 1);

  page.startReply({ currentTarget: { dataset: {
    id: 'comment_1', root: 'comment_1', name: '云用户'
  } } });
  page.onCommentInput({ detail: { value: '这是对主评论的回复' } });
  page.submitComment();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.strictEqual(page.data.commentCount, 2);
  assert.strictEqual(page.data.comments[0].replies.length, 1);
  assert.strictEqual(page.data.comments[0].replies[0].replyToDisplayName, '云用户');
  assert.strictEqual(page.data.comments[0].repliesExpanded, true);

  page.startReply({ currentTarget: { dataset: {
    id: 'comment_2', root: 'comment_1', name: '云用户'
  } } });
  page.onCommentInput({ detail: { value: '这是对回复的继续回复' } });
  page.submitComment();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.strictEqual(page.data.commentCount, 3);
  assert.strictEqual(page.data.comments[0].replies.length, 2);
  assert.strictEqual(page.data.comments[0].replies[1].rootCommentId, 'comment_1');
  assert.strictEqual(page.data.comments[0].replies[1].parentCommentId, 'comment_2');

  const externalComment = {
    id: 'comment_external', displayName: '其他用户', text: '需要审核的评论',
    canDelete: false, replies: [], createdAtTimestamp: 50
  };
  page.setData({ comments: page.data.comments.concat([externalComment]) });
  page.deleteComment({ currentTarget: { dataset: { id: 'comment_external' } } });
  assert.ok(page.findComment('comment_external'));
  page.confirmCommentReport('comment_external', '不当或冒犯内容');
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(reportedCommentId, 'comment_external');

  const sortedByLikes = page.sortComments([
    { id: 'new', likeCount: 0, dislikeCount: 0, createdAtTimestamp: 300 },
    { id: 'liked', likeCount: 4, dislikeCount: 1, createdAtTimestamp: 100 }
  ], 'liked');
  assert.strictEqual(sortedByLikes[0].id, 'liked');
  const sortedByLatest = page.sortComments(sortedByLikes, 'latest');
  assert.strictEqual(sortedByLatest[0].id, 'new');

  page.deleteComment({ currentTarget: { dataset: { id: 'comment_3' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.commentCount, 2);
  page.deleteComment({ currentTarget: { dataset: { id: 'comment_2' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.commentCount, 1);
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
  const template = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/post-detail/post-detail.wxml'), 'utf8');
  assert.ok(template.includes('wx:if="{{post.avatarUrl}}"'), '帖子详情应优先显示云头像图片');
  assert.ok(template.includes('wx:if="{{item.avatarUrl}}"'), '评论应优先显示云头像图片');
  assert.ok(template.includes('wx:if="{{reply.avatarUrl}}"'), '回复应优先显示云头像图片');
  cloudService.resetForTests();
  console.log('post detail page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
