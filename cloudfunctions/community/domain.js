const crypto = require('crypto');

function text(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeProfile(profile) {
  const source = profile || {};
  const displayName = text(source.displayName, 24) || '微信用户';
  return {
    displayName,
    avatarText: text(source.avatarText, 2) || displayName.slice(0, 1)
  };
}

function normalizePost(input) {
  const source = input || {};
  const content = text(source.text, 500);
  if (content.length < 5) throw new Error('请至少填写5个字，说明发生了什么');
  const contactType = text(source.contactType, 32);
  const stage = text(source.stage, 32);
  if (!contactType || !stage) throw new Error('请完成接触类型和当前阶段');
  const region = text(source.region, 32);
  const contactTypeName = text(source.contactTypeName, 32);
  return {
    text: content,
    region,
    contactType,
    contactTypeName,
    stage,
    tags: [region, contactTypeName, stage].filter(Boolean),
    imageRefs: (source.imageRefs || []).filter(item =>
      typeof item === 'string' && item.indexOf('cloud://') === 0
    ).slice(0, 1)
  };
}

function normalizeComment(value) {
  const content = text(value, 200);
  if (content.length < 2) throw new Error('评论至少需要2个字');
  return content;
}

function stableId(prefix, openid, targetId) {
  return prefix + '_' + crypto.createHash('sha1')
    .update(String(openid) + ':' + String(targetId))
    .digest('hex');
}

function matchesQuery(post, query) {
  const keyword = text(query, 50).toLowerCase();
  if (!keyword) return true;
  return [post.text, post.displayName, post.region].concat(post.tags || [])
    .some(value => String(value || '').toLowerCase().indexOf(keyword) > -1);
}

function publicPost(post, reaction, openid) {
  const value = post || {};
  const state = reaction || {};
  return {
    id: value._id,
    displayName: value.displayName,
    avatarText: value.avatarText,
    text: value.text,
    imageRefs: value.imageRefs || [],
    tags: value.tags || [],
    contactType: value.contactType || '',
    stage: value.stage || '',
    region: value.region || '',
    likeCount: Math.max(0, value.likeCount || 0),
    collectCount: Math.max(0, value.collectCount || 0),
    commentCount: Math.max(0, value.commentCount || 0),
    liked: !!state.liked,
    collected: !!state.collected,
    createdAtTimestamp: value.createdAtTimestamp || 0,
    updatedAtTimestamp: value.updatedAtTimestamp || 0,
    canDelete: !!openid && value.authorOpenid === openid
  };
}

function publicComment(comment, openid) {
  const value = comment || {};
  return {
    id: value._id,
    postId: value.postId,
    displayName: value.displayName,
    avatarText: value.avatarText,
    text: value.text,
    createdAtTimestamp: value.createdAtTimestamp || 0,
    canDelete: !!openid && value.authorOpenid === openid
  };
}

function transactionValue(value) {
  return value && value.result !== undefined ? value.result : value;
}

module.exports = {
  text,
  normalizeProfile,
  normalizePost,
  normalizeComment,
  stableId,
  matchesQuery,
  publicPost,
  publicComment,
  transactionValue
};
