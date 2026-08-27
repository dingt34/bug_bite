const crypto = require('crypto');

const CONTACT_TYPE_NAMES = {
  bite: '叮咬',
  sting: '蜇伤',
  attachment: '发现附着虫体',
  contact: '接触后皮疹/不适',
  unknown: '不确定'
};
const ALLOWED_STAGES = ['已处理', '观察中', '已恢复'];
const REPORT_REASONS = ['医疗误导', '不当或冒犯内容', '广告或垃圾信息', '侵犯隐私', '其他'];

function text(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeProfile(profile) {
  const source = profile || {};
  const displayName = text(source.displayName, 24) || '微信用户';
  const avatarUrl = typeof source.avatarUrl === 'string' && source.avatarUrl.indexOf('cloud://') === 0
    ? source.avatarUrl
    : '';
  return {
    displayName,
    avatarText: text(source.avatarText, 2) || displayName.slice(0, 1),
    avatarUrl
  };
}

function normalizePost(input) {
  const source = input || {};
  const content = text(source.text, 500);
  if (content.length < 5) throw new Error('请至少填写5个字，说明发生了什么');
  const contactType = text(source.contactType, 32);
  const stage = text(source.stage, 32);
  if (!CONTACT_TYPE_NAMES[contactType] || ALLOWED_STAGES.indexOf(stage) < 0) {
    throw new Error('请完成有效的接触类型和当前阶段');
  }
  const region = text(source.region, 32);
  if (!region) throw new Error('请选择事件发生地点');
  const contactTypeName = CONTACT_TYPE_NAMES[contactType];
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

function normalizeReportReason(value) {
  const reason = text(value, 100);
  if (reason === '用户标记不当内容') return '其他';
  if (REPORT_REASONS.indexOf(reason) < 0) throw new Error('请选择有效的举报原因');
  return reason;
}

function hotScore(post, now) {
  const value = post || {};
  const engagement = (value.likeCount || 0) * 2 +
    (value.collectCount || 0) * 3 + (value.commentCount || 0) * 2;
  if (!value.createdAtTimestamp) return engagement;
  const ageHours = Math.max(0, ((now || Date.now()) - value.createdAtTimestamp) / (60 * 60 * 1000));
  return (engagement + 1) / Math.pow(ageHours + 2, 1.15);
}

function stableId(prefix, openid, targetId) {
  return prefix + '_' + crypto.createHash('sha1')
    .update(String(openid) + ':' + String(targetId))
    .digest('hex');
}

function commentVoteTransition(reaction, requestedVote, comment) {
  const state = reaction || {};
  const value = comment || {};
  const requested = requestedVote === -1 ? -1 : 1;
  const previous = typeof state.vote === 'number'
    ? state.vote
    : (state.disliked ? -1 : (state.liked ? 1 : 0));
  const next = previous === requested ? 0 : requested;
  const likeDelta = (next === 1 ? 1 : 0) - (previous === 1 ? 1 : 0);
  const dislikeDelta = (next === -1 ? 1 : 0) - (previous === -1 ? 1 : 0);
  return {
    previousVote: previous,
    vote: next,
    liked: next === 1,
    disliked: next === -1,
    likeDelta,
    dislikeDelta,
    likeCount: Math.max(0, (value.likeCount || 0) + likeDelta),
    dislikeCount: Math.max(0, (value.dislikeCount || 0) + dislikeDelta)
  };
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
    avatarUrl: value.avatarUrl || '',
    text: value.text,
    imageRefs: value.imageRefs || [],
    tags: value.tags || [],
    contactType: value.contactType || '',
    contactTypeName: value.contactTypeName || CONTACT_TYPE_NAMES[value.contactType] || '',
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

function publicComment(comment, openid, reaction) {
  const value = comment || {};
  const state = reaction || {};
  const deleted = !!value.deletedByAuthor;
  return {
    id: value._id,
    postId: value.postId,
    parentCommentId: value.parentCommentId || '',
    rootCommentId: value.rootCommentId || '',
    replyToDisplayName: value.replyToDisplayName || '',
    displayName: deleted ? '已删除评论' : value.displayName,
    avatarText: deleted ? '—' : value.avatarText,
    avatarUrl: deleted ? '' : (value.avatarUrl || ''),
    text: deleted ? '该评论已删除' : value.text,
    likeCount: Math.max(0, value.likeCount || 0),
    dislikeCount: Math.max(0, value.dislikeCount || 0),
    liked: state.vote === 1 || !!state.liked,
    disliked: state.vote === -1 || !!state.disliked,
    deleted,
    createdAtTimestamp: value.createdAtTimestamp || 0,
    canDelete: !deleted && !!openid && value.authorOpenid === openid
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
  normalizeReportReason,
  hotScore,
  stableId,
  commentVoteTransition,
  matchesQuery,
  publicPost,
  publicComment,
  transactionValue
};
