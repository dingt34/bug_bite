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

function postHeat(post) {
  return (post.likeCount || 0) * 2 + (post.collectCount || 0) * 3;
}

function matchesQuery(post, query) {
  const keyword = String(query || '').trim().toLowerCase();
  if (!keyword) return true;
  return [post.text, post.displayName, post.region].concat(post.tags || [])
    .some(value => String(value || '').toLowerCase().indexOf(keyword) > -1);
}

function listPosts(localPosts, demoPosts, reactions, filterMode, now, options) {
  const settings = options || {};
  const reportedPosts = settings.reportedPosts || {};
  let posts = mergePosts(localPosts, demoPosts)
    .map(post => Object.assign({}, decoratePost(post, reactions, now), {
      commentCount: ((settings.postComments || {})[post.id] || []).length
    }))
    .filter(post => !reportedPosts[post.id]);
  if (filterMode === 'collected') posts = posts.filter(post => post.collected);
  if (filterMode === 'mine') {
    const user = settings.currentUser || {};
    posts = posts.filter(post =>
      (post.authorId && post.authorId === user.id) ||
      (!post.authorId && post.local && post.displayName === user.displayName)
    );
  }
  if (filterMode === 'commented') {
    const user = settings.currentUser || {};
    const postComments = settings.postComments || {};
    posts = posts.filter(post => (postComments[post.id] || []).some(comment =>
      (comment.authorId && comment.authorId === user.id) ||
      (!comment.authorId && user.displayName && comment.displayName === user.displayName)
    ));
  }
  if (settings.topic) posts = posts.filter(post => post.contactType === settings.topic);
  posts = posts.filter(post => matchesQuery(post, settings.query));
  if (settings.sortMode === 'hot') {
    posts.sort((a, b) => postHeat(b) - postHeat(a) || (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
  } else if (settings.sortMode === 'latest') {
    posts.sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
  }
  return posts;
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
    authorId: userInfo.id || '',
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

function validateComment(text) {
  const value = String(text || '').trim();
  if (value.length < 2) return { valid: false, message: '评论至少需要 2 个字。' };
  if (value.length > 200) return { valid: false, message: '评论不能超过 200 个字。' };
  return { valid: true, text: value };
}

function buildComment(text, userInfo, timestamp) {
  const time = timestamp || Date.now();
  return {
    id: 'comment_' + time + '_' + Math.random().toString(36).slice(2, 7),
    authorId: userInfo.id || '',
    displayName: userInfo.displayName,
    avatarText: userInfo.avatarText || String(userInfo.displayName || '匿').slice(0, 1),
    text: String(text || '').trim(),
    createdAtTimestamp: time,
    time: '刚刚'
  };
}

function decorateComments(comments, now) {
  return (comments || []).slice().sort((a, b) =>
    (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0)
  ).map(comment => Object.assign({}, comment, {
    time: formatRelativeTime(comment.createdAtTimestamp, comment.time, now)
  }));
}

module.exports = {
  mergePosts,
  formatRelativeTime,
  decoratePost,
  listPosts,
  findPost,
  toggleReaction,
  postHeat,
  matchesQuery,
  validatePost,
  buildPost,
  validateComment,
  buildComment,
  decorateComments
};
