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

async function attachCurrentAvatars(items) {
  const values = items || [];
  const authorIds = Array.from(new Set(values.map(item => item && item.authorOpenid).filter(Boolean)));
  if (!authorIds.length) return values;
  try {
    const result = await db.collection(USERS).where({ _id: _.in(authorIds) }).limit(100).get();
    const avatarByAuthor = {};
    (result.data || []).forEach(user => {
      if (user && user._id && typeof user.avatarUrl === 'string' && user.avatarUrl.indexOf('cloud://') === 0) {
        avatarByAuthor[user._id] = user.avatarUrl;
      }
    });
    return values.map(item => avatarByAuthor[item.authorOpenid]
      ? Object.assign({}, item, { avatarUrl: avatarByAuthor[item.authorOpenid] })
      : item);
  } catch (error) {
    return values;
  }
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
  (reactionsResult.data || []).forEach(item => {
    if (item.targetType !== 'comment') reactions[item.postId] = item;
  });
  const commented = {};
  (commentsResult.data || []).forEach(item => { commented[item.postId] = true; });
  const reported = {};
  (reportsResult.data || []).forEach(item => {
    if (item.targetType !== 'comment') reported[item.postId] = true;
  });
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
    const now = Date.now();
    posts.sort((a, b) => {
      const heatA = domain.hotScore(a, now);
      const heatB = domain.hotScore(b, now);
      return heatB - heatA || (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0);
    });
  }
  const total = posts.length;
  const pagePosts = await attachCurrentAvatars(posts.slice(offset, offset + pageSize));
  const page = pagePosts.map(post =>
    domain.publicPost(post, state.reactions[post._id], openid)
  );
  return { posts: page, total, hasMore: offset + page.length < total };
}

async function getPost(event, openid) {
  const post = await readDocument(POSTS, domain.text(event.postId, 80));
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  const reactionId = domain.stableId('reaction', openid, post._id);
  const [reaction, commentsResult, commentReactionsResult, report] = await Promise.all([
    readDocument(REACTIONS, reactionId),
    db.collection(COMMENTS).where({ postId: post._id, status: 'active' })
      .orderBy('createdAtTimestamp', 'asc').limit(100).get(),
    db.collection(REACTIONS).where({
      authorOpenid: openid,
      postId: post._id,
      targetType: 'comment'
    }).limit(100).get(),
    readDocument(REPORTS, domain.stableId('report', openid, post._id))
  ]);
  const commentReactions = {};
  (commentReactionsResult.data || []).forEach(item => { commentReactions[item.commentId] = item; });
  const comments = commentsResult.data || [];
  const profiled = await attachCurrentAvatars([post].concat(comments));
  const profiledPost = profiled[0];
  const profiledComments = profiled.slice(1);
  return {
    post: domain.publicPost(profiledPost, reaction, openid),
    comments: profiledComments.map(comment =>
      domain.publicComment(comment, openid, commentReactions[comment._id])
    ),
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

async function updatePost(event, openid) {
  const postId = domain.text(event.postId, 80);
  const current = await readDocument(POSTS, postId);
  if (!current || current.status !== 'active') throw new Error('帖子不存在或已删除');
  if (current.authorOpenid !== openid) throw new Error('只能编辑自己的分享');
  const input = domain.normalizePost(event.post);
  await checkTextSecurity(openid, input.text);
  const timestamp = Date.now();
  await db.collection(POSTS).doc(postId).update({
    data: Object.assign({}, input, { updatedAtTimestamp: timestamp })
  });
  const removedFiles = (current.imageRefs || []).filter(item =>
    typeof item === 'string' && item.indexOf('cloud://') === 0 && input.imageRefs.indexOf(item) < 0
  );
  if (removedFiles.length) {
    try { await cloud.deleteFile({ fileList: removedFiles }); } catch (error) {}
  }
  const saved = await readDocument(POSTS, postId);
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
      [countKey]: _.inc(nextValue ? 1 : -1)
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
  const parentCommentId = domain.text(event.parentCommentId, 80);
  const profile = await trustedProfile(openid);
  const content = domain.normalizeComment(event.text);
  await checkTextSecurity(openid, content);
  const timestamp = Date.now();
  const commentId = domain.stableId('comment', openid, timestamp + ':' + Math.random());
  const result = await db.runTransaction(async transaction => {
    const postRef = transaction.collection(POSTS).doc(postId);
    const post = (await postRef.get()).data;
    if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
    let parentComment = null;
    let rootCommentId = '';
    if (parentCommentId) {
      parentComment = (await transaction.collection(COMMENTS).doc(parentCommentId).get()).data;
      if (!parentComment || parentComment.status !== 'active' || parentComment.postId !== postId || parentComment.deletedByAuthor) {
        throw new Error('要回复的评论不存在或已删除');
      }
      rootCommentId = parentComment.rootCommentId || parentCommentId;
    }
    const comment = Object.assign({}, profile, {
      postId,
      authorOpenid: openid,
      text: content,
      status: 'active',
      parentCommentId: parentCommentId || '',
      rootCommentId,
      replyToDisplayName: parentComment ? parentComment.displayName : '',
      replyCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      createdAtTimestamp: timestamp,
      updatedAtTimestamp: timestamp
    });
    await transaction.collection(COMMENTS).doc(commentId).set({ data: comment });
    if (rootCommentId) {
      await transaction.collection(COMMENTS).doc(rootCommentId).update({ data: { replyCount: _.inc(1) } });
    }
    await postRef.update({ data: { commentCount: _.inc(1) } });
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
    const timestamp = Date.now();
    if (!comment.rootCommentId && (comment.replyCount || 0) > 0) {
      await commentRef.update({ data: {
        authorOpenid: '',
        displayName: '',
        avatarText: '',
        avatarUrl: '',
        text: '',
        deletedByAuthor: true,
        updatedAtTimestamp: timestamp
      } });
    } else {
      await commentRef.update({ data: { status: 'deleted', updatedAtTimestamp: timestamp } });
    }
    if (comment.rootCommentId) {
      const rootRef = transaction.collection(COMMENTS).doc(comment.rootCommentId);
      const root = (await rootRef.get()).data;
      if (root && root.deletedByAuthor && (root.replyCount || 0) <= 1) {
        await rootRef.update({ data: { status: 'deleted', replyCount: 0, updatedAtTimestamp: timestamp } });
      } else if (root) {
        await rootRef.update({ data: { replyCount: _.inc(-1), updatedAtTimestamp: timestamp } });
      }
    }
    await transaction.collection(POSTS).doc(comment.postId).update({
      data: { commentCount: _.inc(-1) }
    });
    return { success: true };
  });
  await db.collection(REACTIONS).where({ targetType: 'comment', commentId }).remove();
  return domain.transactionValue(result);
}

async function toggleCommentVote(event, openid) {
  const commentId = domain.text(event.commentId, 80);
  const reactionId = domain.stableId('comment_like', openid, commentId);
  const requestedVote = event.vote === 'down' ? -1 : 1;
  const result = await db.runTransaction(async transaction => {
    const commentRef = transaction.collection(COMMENTS).doc(commentId);
    const reactionRef = transaction.collection(REACTIONS).doc(reactionId);
    const comment = (await commentRef.get()).data;
    if (!comment || comment.status !== 'active' || comment.deletedByAuthor) throw new Error('评论不存在或已删除');
    let reaction = null;
    try {
      reaction = (await reactionRef.get()).data;
    } catch (error) {}
    const transition = domain.commentVoteTransition(reaction, requestedVote, comment);
    const timestamp = Date.now();
    await reactionRef.set({ data: {
      targetType: 'comment',
      postId: comment.postId,
      commentId,
      authorOpenid: openid,
      vote: transition.vote,
      liked: transition.liked,
      disliked: transition.disliked,
      createdAtTimestamp: reaction && reaction.createdAtTimestamp || timestamp,
      updatedAtTimestamp: timestamp
    } });
    await commentRef.update({ data: {
      likeCount: _.inc(transition.likeDelta),
      dislikeCount: _.inc(transition.dislikeDelta)
    } });
    return {
      commentId,
      liked: transition.liked,
      disliked: transition.disliked,
      vote: transition.vote,
      likeCount: transition.likeCount,
      dislikeCount: transition.dislikeCount
    };
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
  const reason = domain.normalizeReportReason(event.reason);
  await db.collection(REPORTS).doc(reportId).set({ data: {
    postId,
    reporterOpenid: openid,
    reason,
    status: 'pending',
    createdAtTimestamp: Date.now()
  } });
  await db.collection(POSTS).doc(postId).update({ data: { reportCount: _.inc(1) } });
  return { success: true, reported: true };
}

async function reportComment(event, openid) {
  const commentId = domain.text(event.commentId, 80);
  const comment = await readDocument(COMMENTS, commentId);
  if (!comment || comment.status !== 'active' || comment.deletedByAuthor) {
    throw new Error('评论不存在或已删除');
  }
  if (comment.authorOpenid === openid) throw new Error('不能举报自己的评论');
  const reportId = domain.stableId('comment_report', openid, commentId);
  const existing = await readDocument(REPORTS, reportId);
  if (existing) return { success: true, reported: true };
  const reason = domain.normalizeReportReason(event.reason);
  await db.collection(REPORTS).doc(reportId).set({ data: {
    targetType: 'comment',
    postId: comment.postId,
    commentId,
    reporterOpenid: openid,
    reason,
    status: 'pending',
    createdAtTimestamp: Date.now()
  } });
  await db.collection(COMMENTS).doc(commentId).update({ data: { reportCount: _.inc(1) } });
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
    if (reaction.targetType === 'comment') {
      if (reaction.vote || reaction.liked || reaction.disliked) {
        try {
          await toggleCommentVote({
            commentId: reaction.commentId,
            vote: reaction.vote === -1 || reaction.disliked ? 'down' : 'up'
          }, openid);
        } catch (error) {}
      }
      continue;
    }
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
  if (action === 'updatePost') return updatePost(event, openid);
  if (action === 'toggleReaction') return toggleReaction(event, openid);
  if (action === 'comment') return createComment(event, openid);
  if (action === 'toggleCommentLike') return toggleCommentVote(Object.assign({}, event, { vote: 'up' }), openid);
  if (action === 'toggleCommentVote') return toggleCommentVote(event, openid);
  if (action === 'deleteComment') return deleteComment(event, openid);
  if (action === 'deletePost') return deletePost(event, openid);
  if (action === 'report') return reportPost(event, openid);
  if (action === 'reportComment') return reportComment(event, openid);
  if (action === 'stats') return getStats(openid);
  if (action === 'deleteAccount') return deleteAccount(openid);
  throw new Error('不支持的社区操作');
};
