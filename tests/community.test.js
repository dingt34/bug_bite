const assert = require('assert');
const community = require('../miniprogram/utils/community.js');

const local = [{
  id: 'post_1',
  displayName: '本地用户',
  createdAtTimestamp: 1_000_000,
  text: '本地内容',
  likeCount: 0,
  collectCount: 0
}];
const demos = [
  { id: 'post_1', displayName: '重复示例', text: '不应出现' },
  { id: 'post_2', displayName: '示例用户', time: '昨天', text: '示例内容', likeCount: 2, collectCount: 3 }
];
const reactions = {
  post_1: { liked: true, collected: true }
};

const all = community.listPosts(local, demos, reactions, 'all', 1_120_000);
assert.strictEqual(all.length, 2);
assert.strictEqual(all[0].displayName, '本地用户');
assert.strictEqual(all[0].time, '2分钟前');
assert.strictEqual(all[0].likeCount, 1);
assert.strictEqual(all[0].collectCount, 1);
assert.strictEqual(community.listPosts(local, demos, reactions, 'collected', 1_120_000).length, 1);
assert.strictEqual(community.listPosts(local, demos, reactions, 'all', 1_120_000, { query: '示例用户' }).length, 1);
assert.strictEqual(community.listPosts(local, demos, reactions, 'all', 1_120_000, {
  reportedPosts: { post_2: { reportedAtTimestamp: 1 } }
}).length, 1);
assert.strictEqual(community.listPosts(local, demos, reactions, 'mine', 1_120_000, {
  currentUser: { displayName: '本地用户' }
}).length, 0);
assert.strictEqual(community.listPosts(local, demos, reactions, 'all', 1_120_000, {
  postComments: { post_1: [{ id: 'c1' }] }
})[0].commentCount, 1);
assert.strictEqual(community.listPosts(local, demos, reactions, 'commented', 1_120_000, {
  currentUser: { id: 'u1', displayName: '本地用户' },
  postComments: { post_1: [{ id: 'c1', authorId: 'u1' }] }
}).length, 1);

const toggled = community.toggleReaction(reactions, 'post_1', 'liked');
assert.strictEqual(toggled.post_1.liked, false);
assert.strictEqual(reactions.post_1.liked, true);

assert.strictEqual(community.findPost(local, demos, reactions, 'missing'), null);
assert.strictEqual(community.validatePost({ text: '太短', contactType: 'bite', stage: '观察中' }).valid, false);
assert.strictEqual(community.validatePost({ text: '这是一段完整经历', contactType: '', stage: '观察中' }).valid, false);
assert.strictEqual(community.validatePost({ text: '这是一段完整经历', contactType: 'bite', stage: '观察中' }).valid, true);

const post = community.buildPost({
  text: '  记录一次户外叮咬经历  ',
  imageRef: 'wxfile://usr/post.jpg',
  region: '丽水',
  contactType: 'bite',
  contactTypeName: '叮咬',
  stage: '观察中'
}, { displayName: '体验用户', avatarText: '体' }, 5000);
assert.strictEqual(post.id, 'post_local_5000');
assert.strictEqual(post.text, '记录一次户外叮咬经历');
assert.deepStrictEqual(post.tags, ['丽水', '叮咬', '观察中']);
assert.deepStrictEqual(post.imageRefs, ['wxfile://usr/post.jpg']);
assert.strictEqual(post.authorId, '');

const commentValidation = community.validateComment('很有帮助');
assert.strictEqual(commentValidation.valid, true);
assert.strictEqual(community.validateComment('好').valid, false);
const comment = community.buildComment('  谢谢分享  ', {
  id: 'u1', displayName: '林间观察员', avatarText: '林'
}, 6000);
assert.strictEqual(comment.authorId, 'u1');
assert.strictEqual(comment.text, '谢谢分享');
assert.strictEqual(community.decorateComments([comment], 126000)[0].time, '2分钟前');

console.log('community tests passed');
