const cloud = require('wx-server-sdk');
const domain = require('./domain.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const POSTS = 'community_posts';
const COMMENTS = 'community_comments';
const REACTIONS = 'community_reactions';
const REPORTS = 'community_reports';
const FRIENDSHIPS = 'community_friendships';
const MESSAGES = 'community_messages';
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
    const now = Date.now();
    posts.sort((a, b) => {
      const heatA = domain.hotScore(a, now);
      const heatB = domain.hotScore(b, now);
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
      shareCount: 0,
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
    await commentRef.update({ data: { status: 'deleted', updatedAtTimestamp: Date.now() } });
    await transaction.collection(POSTS).doc(comment.postId).update({
      data: { commentCount: _.inc(-1) }
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

function friendshipId(firstOpenid, secondOpenid) {
  const pair = [String(firstOpenid), String(secondOpenid)].sort();
  return domain.stableId('friend', pair[0], pair[1]);
}

async function publicUserCard(openid, extra) {
  const user = await readDocument(USERS, openid);
  return domain.publicUser(user, openid, extra);
}

function relationshipStatus(record, openid) {
  if (!record) return 'none';
  if (record.status === 'accepted') return 'accepted';
  if (record.status === 'pending') {
    return record.requesterOpenid === openid ? 'outgoing' : 'incoming';
  }
  return 'none';
}

async function getAuthorCard(event, openid) {
  const post = await readDocument(POSTS, domain.text(event.postId, 80));
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  if (post.authorOpenid === openid) {
    return { user: await publicUserCard(openid), status: 'self', requestId: '' };
  }
  const id = friendshipId(openid, post.authorOpenid);
  const relationship = await readDocument(FRIENDSHIPS, id);
  return {
    user: await publicUserCard(post.authorOpenid),
    status: relationshipStatus(relationship, openid),
    requestId: relationship && relationship.status === 'pending' ? id : ''
  };
}

async function sendFriendRequest(event, openid) {
  await trustedProfile(openid);
  const post = await readDocument(POSTS, domain.text(event.postId, 80));
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  const targetOpenid = post.authorOpenid;
  if (!targetOpenid || targetOpenid === openid) throw new Error('不能添加自己为好友');
  const id = friendshipId(openid, targetOpenid);
  const existing = await readDocument(FRIENDSHIPS, id);
  const timestamp = Date.now();
  if (existing && existing.status === 'accepted') return { status: 'accepted', requestId: id };
  if (existing && existing.status === 'pending' && existing.recipientOpenid === openid) {
    await db.collection(FRIENDSHIPS).doc(id).update({
      data: { status: 'accepted', acceptedAtTimestamp: timestamp, updatedAtTimestamp: timestamp }
    });
    return { status: 'accepted', requestId: id };
  }
  if (existing && existing.status === 'pending') return { status: 'outgoing', requestId: id };
  await db.collection(FRIENDSHIPS).doc(id).set({ data: {
    requesterOpenid: openid,
    recipientOpenid: targetOpenid,
    status: 'pending',
    createdAtTimestamp: existing && existing.createdAtTimestamp || timestamp,
    updatedAtTimestamp: timestamp
  } });
  return { status: 'outgoing', requestId: id };
}

async function respondFriendRequest(event, openid) {
  const requestId = domain.text(event.requestId, 80);
  const request = await readDocument(FRIENDSHIPS, requestId);
  if (!request || request.status !== 'pending' || request.recipientOpenid !== openid) {
    throw new Error('好友申请不存在或已处理');
  }
  const accepted = event.accept === true;
  const timestamp = Date.now();
  await db.collection(FRIENDSHIPS).doc(requestId).update({ data: {
    status: accepted ? 'accepted' : 'rejected',
    acceptedAtTimestamp: accepted ? timestamp : 0,
    updatedAtTimestamp: timestamp
  } });
  return { status: accepted ? 'accepted' : 'rejected' };
}

async function listFriends(openid) {
  await trustedProfile(openid);
  const [sentResult, receivedResult, requestResult, unreadResult] = await Promise.all([
    db.collection(FRIENDSHIPS).where({ requesterOpenid: openid, status: 'accepted' }).limit(100).get(),
    db.collection(FRIENDSHIPS).where({ recipientOpenid: openid, status: 'accepted' }).limit(100).get(),
    db.collection(FRIENDSHIPS).where({ recipientOpenid: openid, status: 'pending' }).limit(100).get(),
    db.collection(MESSAGES).where({ recipientOpenid: openid, readAtTimestamp: 0 }).limit(100).get()
  ]);
  const unreadByOpenid = {};
  (unreadResult.data || []).forEach(message => {
    unreadByOpenid[message.senderOpenid] = (unreadByOpenid[message.senderOpenid] || 0) + 1;
  });
  const relationships = (sentResult.data || []).concat(receivedResult.data || []);
  const friends = await Promise.all(relationships.map(record => {
    const friendOpenid = record.requesterOpenid === openid ? record.recipientOpenid : record.requesterOpenid;
    return publicUserCard(friendOpenid, { unreadCount: unreadByOpenid[friendOpenid] || 0 });
  }));
  const requests = await Promise.all((requestResult.data || []).map(record =>
    publicUserCard(record.requesterOpenid, { requestId: record._id })
  ));
  return { friends, requests, unreadCount: Object.values(unreadByOpenid).reduce((sum, value) => sum + value, 0) };
}

async function resolveFriend(openid, friendId) {
  const [sentResult, receivedResult] = await Promise.all([
    db.collection(FRIENDSHIPS).where({ requesterOpenid: openid, status: 'accepted' }).limit(100).get(),
    db.collection(FRIENDSHIPS).where({ recipientOpenid: openid, status: 'accepted' }).limit(100).get()
  ]);
  const records = (sentResult.data || []).concat(receivedResult.data || []);
  for (const record of records) {
    const otherOpenid = record.requesterOpenid === openid ? record.recipientOpenid : record.requesterOpenid;
    if (domain.publicUserId(otherOpenid) === friendId) return otherOpenid;
  }
  throw new Error('对方不是你的好友');
}

async function listMessages(event, openid) {
  const friendId = domain.text(event.friendId, 80);
  const friendOpenid = await resolveFriend(openid, friendId);
  const conversation = domain.conversationId(openid, friendOpenid);
  const result = await db.collection(MESSAGES).where({ conversationId: conversation })
    .orderBy('createdAtTimestamp', 'desc').limit(50).get();
  const timestamp = Date.now();
  await db.collection(MESSAGES).where({
    conversationId: conversation,
    recipientOpenid: openid,
    readAtTimestamp: 0
  }).update({ data: { readAtTimestamp: timestamp } });
  return {
    friend: await publicUserCard(friendOpenid),
    messages: (result.data || []).slice().reverse().map(message => domain.publicMessage(message, openid))
  };
}

async function createPrivateMessage(event, openid) {
  await trustedProfile(openid);
  const friendId = domain.text(event.friendId, 80);
  const friendOpenid = await resolveFriend(openid, friendId);
  const content = domain.normalizeMessage(event.text);
  await checkTextSecurity(openid, content);
  const timestamp = Date.now();
  const message = {
    conversationId: domain.conversationId(openid, friendOpenid),
    senderOpenid: openid,
    recipientOpenid: friendOpenid,
    kind: 'text',
    text: content,
    postId: '',
    postPreview: null,
    readAtTimestamp: 0,
    createdAtTimestamp: timestamp
  };
  const result = await db.collection(MESSAGES).add({ data: message });
  return { message: domain.publicMessage(Object.assign({ _id: result._id }, message), openid) };
}

async function forwardPost(event, openid) {
  await trustedProfile(openid);
  const friendId = domain.text(event.friendId, 80);
  const friendOpenid = await resolveFriend(openid, friendId);
  const postId = domain.text(event.postId, 80);
  const post = await readDocument(POSTS, postId);
  if (!post || post.status !== 'active') throw new Error('帖子不存在或已删除');
  const timestamp = Date.now();
  const message = {
    conversationId: domain.conversationId(openid, friendOpenid),
    senderOpenid: openid,
    recipientOpenid: friendOpenid,
    kind: 'post',
    text: '向你转发了一篇社群帖子',
    postId,
    postPreview: {
      id: postId,
      displayName: post.displayName || '微信用户',
      text: domain.text(post.text, 100),
      imageRef: (post.imageRefs || [])[0] || ''
    },
    readAtTimestamp: 0,
    createdAtTimestamp: timestamp
  };
  const result = await db.collection(MESSAGES).add({ data: message });
  await db.collection(POSTS).doc(postId).update({ data: { shareCount: _.inc(1) } });
  return { message: domain.publicMessage(Object.assign({ _id: result._id }, message), openid) };
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
    db.collection(REPORTS).where({ reporterOpenid: openid }).remove(),
    db.collection(FRIENDSHIPS).where({ requesterOpenid: openid }).remove(),
    db.collection(FRIENDSHIPS).where({ recipientOpenid: openid }).remove(),
    db.collection(MESSAGES).where({ senderOpenid: openid }).remove(),
    db.collection(MESSAGES).where({ recipientOpenid: openid }).remove()
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
  if (action === 'deleteComment') return deleteComment(event, openid);
  if (action === 'deletePost') return deletePost(event, openid);
  if (action === 'report') return reportPost(event, openid);
  if (action === 'authorCard') return getAuthorCard(event, openid);
  if (action === 'sendFriendRequest') return sendFriendRequest(event, openid);
  if (action === 'respondFriendRequest') return respondFriendRequest(event, openid);
  if (action === 'friends') return listFriends(openid);
  if (action === 'messages') return listMessages(event, openid);
  if (action === 'sendMessage') return createPrivateMessage(event, openid);
  if (action === 'forwardPost') return forwardPost(event, openid);
  if (action === 'stats') return getStats(openid);
  if (action === 'deleteAccount') return deleteAccount(openid);
  throw new Error('不支持的社区操作');
};
