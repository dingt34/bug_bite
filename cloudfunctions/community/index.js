const cloud = require('wx-server-sdk');
const domain = require('./domain.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const POSTS = 'community_posts';
const COMMENTS = 'community_comments';
const REACTIONS = 'community_reactions';
const REPORTS = 'community_reports';
const USERS = 'users';

function requireOpenid() {
  const context = cloud.getWXContext();
  if (!context.OPENID) throw new Error('无法获取微信用户身份');
  return context.OPENID;
}

async function readDocument(collection, id) {
  try {
    const result = await db.collection(collection).doc(id).get();
    return result.data || null;
  } catch (error) {
    return null;
  }
}

async function trustedProfile(openid) {
  const user = await readDocument(USERS, openid);
  if (!user) throw new Error('请先完成微信云登录');
  return domain.normalizeProfile(user);
}

async function checkTextSecurity(openid, content) {
  if (!cloud.openapi || !cloud.openapi.security || !cloud.openapi.security.msgSecCheck) return;
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      openid,
      scene: 2,
      version: 2,
      content
    });
    const suggest = result && result.result && result.result.suggest;
    if (suggest && suggest !== 'pass') throw new Error('内容安全检查未通过，请修改后重试');
  } catch (error) {
    if (error && error.message && error.message.indexOf('内容安全检查未通过') > -1) throw error;
    console.warn('content security unavailable', error && (error.errMsg || error.message));
  }
}

async function userCommunityState(openid) {
  const [reactionsResult, commentsResult, reportsResult] = await Promise.all([
    db.collection(REACTIONS).where({ authorOpenid: openid }).limit(100).get(),
    db.collection(COMMENTS).where({ authorOpenid: openid, status: 'active' }).limit(100).get(),
    db.collection(REPORTS).where({ reporterOpenid: openid }).limit(100).get()
  ]);
  const reactions = {};
  (reactionsResult.data || []).forEach(item => { reactions[item.postId] = item; });
  const commented = {};
  (commentsResult.data || []).forEach(item => { commented[item.postId] = true; });
  const reported = {};
  (reportsResult.data || []).forEach(item => { reported[item.postId] = true; });
  return { reactions, commented, reported };
}

async function listPosts(event, openid) {
  const filterMode = ['all', 'mine', 'collected', 'commented'].indexOf(event.filterMode) > -1
    ? event.filterMode
    : 'all';
  const sortMode = event.sortMode === 'hot' ? 'hot' : 'latest';
  const offset = Math.max(0, Number(event.offset) || 0);
  const pageSize = Math.min(30, Math.max(1, Number(event.limit) || 20));
  const conditions = { status: 'active' };
  if (event.topic) conditions.contactType = domain.text(event.topic, 32);
  if (filterMode === 'mine') conditions.authorOpenid = openid;

  const [postsResult, state] = await Promise.all([
    db.collection(POSTS).where(conditions).orderBy('createdAtTimestamp', 'desc').limit(100).get(),
    userCommunityState(openid)
  ]);
  let posts = (postsResult.data || []).filter(post => !state.reported[post._id]);
  if (filterMode === 'collected') posts = posts.filter(post => state.reactions[post._id] && state.reactions[post._id].collected);
  if (filterMode === 'commented') posts = posts.filter(post => state.commented[post._id]);
  posts = posts.filter(post => domain.matchesQuery(post, event.query));
  if (sortMode === 'hot') {
    posts.sort((a, b) => {
      const heatA = (a.likeCount || 0) * 2 + (a.collectCount || 0) * 3 + (a.commentCount || 0) * 2;
      const heatB = (b.likeCount || 0) * 2 + (b.collectCount || 0) * 3 + (b.commentCount || 0) * 2;
      return heatB - heatA || (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0);
    });
  }
  const total = posts.length;
  const page = posts.slice(offset, offset + pageSize).map(post =>
    domain.publicPost(post, state.reactions[post._id], openid)
  );
  return { posts: page, total, hasMore: offset + page.length < total };
}

async function getPost(event, openid) {
  const post = await readDocument(POSTS, domain.text(event.postId, 80));
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  const reactionId = domain.stableId('reaction', openid, post._id);
  const [reaction, commentsResult, report] = await Promise.all([
    readDocument(REACTIONS, reactionId),
    db.collection(COMMENTS).where({ postId: post._id, status: 'active' })
      .orderBy('createdAtTimestamp', 'asc').limit(100).get(),
    readDocument(REPORTS, domain.stableId('report', openid, post._id))
  ]);
  return {
    post: domain.publicPost(post, reaction, openid),
    comments: (commentsResult.data || []).map(comment => domain.publicComment(comment, openid)),
    reported: !!report
  };
}

async function publishPost(event, openid) {
  const profile = await trustedProfile(openid);
  const input = domain.normalizePost(event.post);
  await checkTextSecurity(openid, input.text);
  const timestamp = Date.now();
  const result = await db.collection(POSTS).add({
    data: Object.assign({}, input, profile, {
      authorOpenid: openid,
      status: 'active',
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      reportCount: 0,
      createdAtTimestamp: timestamp,
      updatedAtTimestamp: timestamp
    })
  });
  const saved = await readDocument(POSTS, result._id);
  return { post: domain.publicPost(saved, null, openid) };
}

async function toggleReaction(event, openid) {
  const postId = domain.text(event.postId, 80);
  const key = event.key === 'collected' ? 'collected' : 'liked';
  const countKey = key === 'liked' ? 'likeCount' : 'collectCount';
  const reactionId = domain.stableId('reaction', openid, postId);
  const result = await db.runTransaction(async transaction => {
    const postRef = transaction.collection(POSTS).doc(postId);
    const reactionRef = transaction.collection(REACTIONS).doc(reactionId);
    const postResult = await postRef.get();
    const post = postResult.data;
    if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
    let reaction = null;
    try {
      reaction = (await reactionRef.get()).data;
    } catch (error) {}
    const nextValue = !(reaction && reaction[key]);
    const nextReaction = {
      postId,
      authorOpenid: openid,
      liked: !!(reaction && reaction.liked),
      collected: !!(reaction && reaction.collected),
      createdAtTimestamp: reaction && reaction.createdAtTimestamp || Date.now(),
      [key]: nextValue,
      updatedAtTimestamp: Date.now()
    };
    await reactionRef.set({ data: nextReaction });
    await postRef.update({ data: {
      [countKey]: _.inc(nextValue ? 1 : -1),
      updatedAtTimestamp: Date.now()
    } });
    return {
      reaction: { liked: !!nextReaction.liked, collected: !!nextReaction.collected },
      likeCount: Math.max(0, (post.likeCount || 0) + (key === 'liked' ? (nextValue ? 1 : -1) : 0)),
      collectCount: Math.max(0, (post.collectCount || 0) + (key === 'collected' ? (nextValue ? 1 : -1) : 0))
    };
  });
  return domain.transactionValue(result);
}

async function createComment(event, openid) {
  const postId = domain.text(event.postId, 80);
  const profile = await trustedProfile(openid);
  const content = domain.normalizeComment(event.text);
  await checkTextSecurity(openid, content);
  const timestamp = Date.now();
  const commentId = domain.stableId('comment', openid, timestamp + ':' + Math.random());
  const result = await db.runTransaction(async transaction => {
    const postRef = transaction.collection(POSTS).doc(postId);
    const post = (await postRef.get()).data;
    if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
    const comment = Object.assign({}, profile, {
      postId,
      authorOpenid: openid,
      text: content,
      status: 'active',
      createdAtTimestamp: timestamp,
      updatedAtTimestamp: timestamp
    });
    await transaction.collection(COMMENTS).doc(commentId).set({ data: comment });
    await postRef.update({ data: { commentCount: _.inc(1), updatedAtTimestamp: timestamp } });
    return { comment: domain.publicComment(Object.assign({ _id: commentId }, comment), openid) };
  });
  return domain.transactionValue(result);
}

async function deleteComment(event, openid) {
  const commentId = domain.text(event.commentId, 80);
  const result = await db.runTransaction(async transaction => {
    const commentRef = transaction.collection(COMMENTS).doc(commentId);
    const comment = (await commentRef.get()).data;
    if (!comment || comment.status !== 'active') return { success: true };
    if (comment.authorOpenid !== openid) throw new Error('只能删除自己的评论');
    await commentRef.update({ data: { status: 'deleted', updatedAtTimestamp: Date.now() } });
    await transaction.collection(POSTS).doc(comment.postId).update({
      data: { commentCount: _.inc(-1), updatedAtTimestamp: Date.now() }
    });
    return { success: true };
  });
  return domain.transactionValue(result);
}

async function deletePost(event, openid) {
  const postId = domain.text(event.postId, 80);
  const post = await readDocument(POSTS, postId);
  if (!post || post.status !== 'active') return { success: true };
  if (post.authorOpenid !== openid) throw new Error('只能删除自己的分享');
  await db.collection(POSTS).doc(postId).update({
    data: { status: 'deleted', updatedAtTimestamp: Date.now() }
  });
  await Promise.all([
    db.collection(COMMENTS).where({ postId }).update({ data: { status: 'deleted', updatedAtTimestamp: Date.now() } }),
    db.collection(REACTIONS).where({ postId }).remove()
  ]);
  const fileList = (post.imageRefs || []).filter(item => typeof item === 'string' && item.indexOf('cloud://') === 0);
  if (fileList.length) {
    try { await cloud.deleteFile({ fileList }); } catch (error) {}
  }
  return { success: true };
}

async function reportPost(event, openid) {
  const postId = domain.text(event.postId, 80);
  const post = await readDocument(POSTS, postId);
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  const reportId = domain.stableId('report', openid, postId);
  const existing = await readDocument(REPORTS, reportId);
  if (existing) return { success: true, reported: true };
  await db.collection(REPORTS).doc(reportId).set({ data: {
    postId,
    reporterOpenid: openid,
    reason: domain.text(event.reason, 100) || '用户标记不当内容',
    status: 'pending',
    createdAtTimestamp: Date.now()
  } });
  await db.collection(POSTS).doc(postId).update({ data: { reportCount: _.inc(1) } });
  return { success: true, reported: true };
}

async function getStats(openid) {
  const [posts, comments, collections] = await Promise.all([
    db.collection(POSTS).where({ authorOpenid: openid, status: 'active' }).count(),
    db.collection(COMMENTS).where({ authorOpenid: openid, status: 'active' }).count(),
    db.collection(REACTIONS).where({ authorOpenid: openid, collected: true }).count()
  ]);
  return { posts: posts.total || 0, comments: comments.total || 0, collections: collections.total || 0 };
}

async function deleteAccount(openid) {
  const [postsResult, commentsResult, reactionsResult] = await Promise.all([
    db.collection(POSTS).where({ authorOpenid: openid, status: 'active' }).limit(100).get(),
    db.collection(COMMENTS).where({ authorOpenid: openid, status: 'active' }).limit(100).get(),
    db.collection(REACTIONS).where({ authorOpenid: openid }).limit(100).get()
  ]);
  const ownPostIds = {};
  for (const post of postsResult.data || []) {
    ownPostIds[post._id] = true;
    await deletePost({ postId: post._id }, openid);
  }
  for (const comment of commentsResult.data || []) await deleteComment({ commentId: comment._id }, openid);
  for (const reaction of reactionsResult.data || []) {
    if (ownPostIds[reaction.postId]) continue;
    if (reaction.liked) await toggleReaction({ postId: reaction.postId, key: 'liked' }, openid);
    if (reaction.collected) await toggleReaction({ postId: reaction.postId, key: 'collected' }, openid);
  }
  await Promise.all([
    db.collection(REACTIONS).where({ authorOpenid: openid }).remove(),
    db.collection(REPORTS).where({ reporterOpenid: openid }).remove()
  ]);
  return { success: true };
}

exports.main = async event => {
  const openid = requireOpenid();
  const action = event && event.action;
  if (action === 'list') return listPosts(event, openid);
  if (action === 'get') return getPost(event, openid);
  if (action === 'publish') return publishPost(event, openid);
  if (action === 'toggleReaction') return toggleReaction(event, openid);
  if (action === 'comment') return createComment(event, openid);
  if (action === 'deleteComment') return deleteComment(event, openid);
  if (action === 'deletePost') return deletePost(event, openid);
  if (action === 'report') return reportPost(event, openid);
  if (action === 'stats') return getStats(openid);
  if (action === 'deleteAccount') return deleteAccount(openid);
  throw new Error('不支持的社区操作');
};
