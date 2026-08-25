const assert = require('assert');
const domain = require('../cloudfunctions/community/domain.js');

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
assert.throws(() => domain.normalizeComment('一'), /至少需要2个字/);
assert.strictEqual(
  domain.stableId('reaction', 'openid', 'post'),
  domain.stableId('reaction', 'openid', 'post')
);
assert.strictEqual(domain.matchesQuery({ text: '丽水徒步', tags: [] }, '丽水'), true);

const publicValue = domain.publicPost({
  _id: 'p1', authorOpenid: 'u1', displayName: '作者', text: '内容', likeCount: 2
}, { liked: true }, 'u1');
assert.strictEqual(publicValue.canDelete, true);
assert.strictEqual(publicValue.liked, true);
assert.strictEqual(publicValue.authorOpenid, undefined);
assert.deepStrictEqual(domain.transactionValue({ result: { success: true }, errMsg: 'ok' }), { success: true });

console.log('community cloud domain tests passed');
