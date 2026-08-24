function mergePosts(localPosts, demoPosts) {
  const seen = {};
  return (localPosts || []).concat(demoPosts || []).filter(post => {
    if (!post || !post.id || seen[post.id]) return false;
    seen[post.id] = true;
    return true;
  });
}

function formatRelativeTime(timestamp, fallback, now) {
  if (!timestamp) return fallback || '时间未知';
  const diff = Math.max(0, (now || Date.now()) - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + '分钟前';
  if (diff < day) return Math.floor(diff / hour) + '小时前';
  if (diff < 7 * day) return Math.floor(diff / day) + '天前';
  const date = new Date(timestamp);
  const pad = value => String(value).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function decoratePost(post, reactions, now) {
  const reaction = (reactions || {})[post.id] || {};
  return Object.assign({}, post, {
    avatarText: post.avatarText || String(post.displayName || '匿').slice(0, 1),
    time: formatRelativeTime(post.createdAtTimestamp, post.time, now),
    liked: !!reaction.liked,
    collected: !!reaction.collected,
    likeCount: (post.likeCount || 0) + (reaction.liked ? 1 : 0),
    collectCount: (post.collectCount || 0) + (reaction.collected ? 1 : 0)
  });
}

function listPosts(localPosts, demoPosts, reactions, filterMode, now) {
  const posts = mergePosts(localPosts, demoPosts).map(post => decoratePost(post, reactions, now));
  return filterMode === 'collected' ? posts.filter(post => post.collected) : posts;
}

function findPost(localPosts, demoPosts, reactions, id, now) {
  const post = mergePosts(localPosts, demoPosts).find(item => item.id === id);
  return post ? decoratePost(post, reactions, now) : null;
}

function toggleReaction(reactions, id, key) {
  const next = Object.assign({}, reactions || {});
  const current = Object.assign({}, next[id] || {});
  current[key] = !current[key];
  next[id] = current;
  return next;
}

function validatePost(input) {
  const text = String(input.text || '').trim();
  if (!text) return { valid: false, message: '请填写经历内容。' };
  if (text.length < 5) return { valid: false, message: '请至少填写 5 个字，说明发生了什么。' };
  if (!input.contactType) return { valid: false, message: '请选择接触类型。' };
  if (!input.stage) return { valid: false, message: '请选择当前阶段。' };
  return { valid: true, text };
}

function buildPost(input, userInfo, timestamp) {
  const time = timestamp || Date.now();
  return {
    id: 'post_local_' + time,
    displayName: userInfo.displayName,
    avatarText: userInfo.avatarText || String(userInfo.displayName).slice(0, 1),
    createdAtTimestamp: time,
    time: '刚刚',
    text: String(input.text || '').trim(),
    imageRefs: input.imageRef ? [input.imageRef] : [],
    tags: [input.region, input.contactTypeName, input.stage].filter(Boolean),
    contactType: input.contactType,
    stage: input.stage,
    region: input.region || '',
    likeCount: 0,
    collectCount: 0,
    local: true
  };
}

module.exports = {
  mergePosts,
  formatRelativeTime,
  decoratePost,
  listPosts,
  findPost,
  toggleReaction,
  validatePost,
  buildPost
};
