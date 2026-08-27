const assert = require('assert');
const domain = require('../cloudfunctions/community/domain.js');

const cloudAvatar = 'cloud://env/avatars/user.jpg';
const profile = domain.normalizeProfile({
  displayName: '云端作者',
  avatarText: '云',
  avatarUrl: cloudAvatar
});
assert.strictEqual(profile.avatarUrl, cloudAvatar, '社群资料应保留已上传的云头像地址');

const post = domain.normalizePost({
  text: '记录一次林地活动后的叮咬经历',
  region: '丽水',
  contactType: 'bite',
  contactTypeName: '叮咬',
  stage: '观察中',
  imageRefs: ['cloud://env/community.jpg', 'wxfile://local.jpg']
});
assert.deepStrictEqual(post.tags, ['丽水', '叮咬', '观察中']);
assert.deepStrictEqual(post.imageRefs, ['cloud://env/community.jpg']);
assert.throws(() => domain.normalizePost({ text: '太短' }), /至少填写5个字/);
assert.throws(() => domain.normalizePost({
  text: '记录一次完整的户外叮咬经历', contactType: 'bite', stage: '观察中'
}), /请选择事件发生地点/);
assert.throws(() => domain.normalizeComment('一'), /至少需要2个字/);
assert.strictEqual(
  domain.stableId('reaction', 'openid', 'post'),
  domain.stableId('reaction', 'openid', 'post')
);
const voteUp = domain.commentVoteTransition({}, 1, { likeCount: 2, dislikeCount: 1 });
assert.deepStrictEqual(
  { vote: voteUp.vote, likeDelta: voteUp.likeDelta, dislikeDelta: voteUp.dislikeDelta },
  { vote: 1, likeDelta: 1, dislikeDelta: 0 }
);
const switchToDown = domain.commentVoteTransition({ vote: 1 }, -1, { likeCount: 3, dislikeCount: 1 });
assert.deepStrictEqual(
  { vote: switchToDown.vote, likeDelta: switchToDown.likeDelta, dislikeDelta: switchToDown.dislikeDelta },
  { vote: -1, likeDelta: -1, dislikeDelta: 1 }
);
const cancelDown = domain.commentVoteTransition({ vote: -1 }, -1, { likeCount: 2, dislikeCount: 2 });
assert.deepStrictEqual(
  { vote: cancelDown.vote, likeDelta: cancelDown.likeDelta, dislikeDelta: cancelDown.dislikeDelta },
  { vote: 0, likeDelta: 0, dislikeDelta: -1 }
);
assert.strictEqual(domain.matchesQuery({ text: '丽水徒步', tags: [] }, '丽水'), true);

const publicValue = domain.publicPost({
  _id: 'p1', authorOpenid: 'u1', displayName: '作者', avatarUrl: cloudAvatar,
  text: '内容', likeCount: 2
}, { liked: true }, 'u1');
assert.strictEqual(publicValue.canDelete, true);
assert.strictEqual(publicValue.liked, true);
assert.strictEqual(publicValue.avatarUrl, cloudAvatar, '重新读取帖子时应返回云头像地址');
assert.strictEqual(publicValue.authorOpenid, undefined);
const publicComment = domain.publicComment({
  _id: 'c1', authorOpenid: 'u2', displayName: '评论者', avatarUrl: cloudAvatar, text: '有帮助',
  likeCount: 3, dislikeCount: 1, parentCommentId: 'parent', rootCommentId: 'root',
  replyToDisplayName: '被回复者'
}, 'u1', { vote: -1 });
assert.strictEqual(publicComment.likeCount, 3);
assert.strictEqual(publicComment.dislikeCount, 1);
assert.strictEqual(publicComment.liked, false);
assert.strictEqual(publicComment.disliked, true);
assert.strictEqual(publicComment.rootCommentId, 'root');
assert.strictEqual(publicComment.replyToDisplayName, '被回复者');
assert.strictEqual(publicComment.avatarUrl, cloudAvatar, '重新读取评论时应返回云头像地址');
const deletedComment = domain.publicComment({
  _id: 'deleted', deletedByAuthor: true, displayName: '原作者', avatarText: '原', text: '私密正文'
}, 'u1');
assert.strictEqual(deletedComment.displayName, '已删除评论');
assert.strictEqual(deletedComment.text, '该评论已删除');
assert.strictEqual(deletedComment.canDelete, false);
assert.deepStrictEqual(domain.transactionValue({ result: { success: true }, errMsg: 'ok' }), { success: true });

console.log('community cloud domain tests passed');
