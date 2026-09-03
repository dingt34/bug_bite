const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const clean = (value, max = 200) => String(value || '').trim().slice(0, max);
const fail = (code, message) => ({ ok: false, code, message });

async function removeWhere(collection, where) {
  let total = 0;
  while (true) {
    const rows = await db.collection(collection).where(where).field({ _id: true }).limit(100).get();
    if (!rows.data.length) break;
    await Promise.all(rows.data.map(item => db.collection(collection).doc(item._id).remove()));
    total += rows.data.length;
    if (rows.data.length < 100) break;
  }
  return total;
}

async function displayName(openid) {
  const result = await db.collection('users').where({ _openid: openid }).field({ nickname: true }).limit(1).get();
  return result.data[0] && result.data[0].nickname || '户外同行者';
}

async function checkContent(openid, text) {
  if (!text) return;
  try {
    const result = await cloud.openapi.security.msgSecCheck({ openid, version: 2, scene: 2, content: text });
    if (result.result && result.result.suggest !== 'pass') throw new Error('CONTENT_REJECTED');
  } catch (error) {
    if (error.message === 'CONTENT_REJECTED') throw error;
    console.warn('msgSecCheck unavailable', error.errCode || error.message);
  }
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail('NO_OPENID', '无法确认微信身份');
  const action = clean(event.action, 20);
  try {
    if (action === 'list') {
      const limit = Math.min(Math.max(Number(event.limit) || 20, 1), 50);
      const result = await db.collection('community_posts')
        .where({ status: 'published' }).orderBy('createdAt', 'desc').limit(limit).get();
      return { ok: true, data: result.data };
    }
    if (action === 'get') {
      const postId = clean(event.postId, 64);
      const post = await db.collection('community_posts').doc(postId).get();
      if (!post.data || post.data.status !== 'published') return fail('NOT_FOUND', '内容不存在');
      const comments = await db.collection('community_comments')
        .where({ postId, status: 'published' }).orderBy('createdAt', 'asc').limit(100).get();
      return { ok: true, data: { post: post.data, comments: comments.data } };
    }
    if (action === 'publish') {
      const title = clean(event.title, 60);
      const text = clean(event.text, 1000);
      if (!title || !text) return fail('INVALID_INPUT', '请填写标题和正文');
      await checkContent(OPENID, `${title}\n${text}`);
      const result = await db.collection('community_posts').add({ data: {
        ownerOpenid: OPENID,
        author: await displayName(OPENID),
        title, text,
        region: clean(event.region, 40),
        type: clean(event.type, 30),
        stage: clean(event.stage, 30),
        route: clean(event.route, 100),
        routePlan: event.routePlan && typeof event.routePlan === 'object' ? event.routePlan : null,
        eventId: clean(event.eventId, 64),
        imageFileIds: Array.isArray(event.imageFileIds) ? event.imageFileIds.slice(0, 6).map(v => clean(v, 256)) : [],
        likes: 0, comments: 0, favorites: 0,
        status: 'published', createdAt: db.serverDate(), updatedAt: db.serverDate()
      } });
      return { ok: true, data: { postId: result._id } };
    }
    if (action === 'comment') {
      const postId = clean(event.postId, 64);
      const text = clean(event.text, 500);
      if (!postId || !text) return fail('INVALID_INPUT', '请输入评论');
      await checkContent(OPENID, text);
      await db.collection('community_posts').doc(postId).get();
      const result = await db.collection('community_comments').add({ data: {
        ownerOpenid: OPENID, postId, author: await displayName(OPENID), text,
        status: 'published', createdAt: db.serverDate()
      } });
      await db.collection('community_posts').doc(postId).update({ data: { comments: _.inc(1), updatedAt: db.serverDate() } });
      return { ok: true, data: { commentId: result._id } };
    }
    if (action === 'report' || action === 'reportComment') {
      const targetType = action === 'reportComment' || event.targetType === 'comment' ? 'comment' : 'post';
      const targetId = clean(event.targetId || (targetType === 'comment' ? event.commentId : event.postId), 64);
      if (!targetId) return fail('INVALID_INPUT', '缺少举报对象');
      const reason = clean(event.reason, 200);
      if (!reason) return fail('INVALID_INPUT', '请填写举报原因');
      await db.collection('community_reports').add({ data: {
        reporterOpenid: OPENID, targetType, targetId,
        reason, status: 'pending', createdAt: db.serverDate()
      } });
      return { ok: true, data: { accepted: true } };
    }
    if (action === 'listReports') {
      const result = await db.collection('community_reports').orderBy('createdAt', 'desc').limit(100).get();
      const reports = await Promise.all(result.data.map(async report => {
        let target = null;
        try {
          const collection = report.targetType === 'comment' ? 'community_comments' : 'community_posts';
          const found = await db.collection(collection).doc(report.targetId).get();
          target = found.data || null;
        } catch (error) {}
        return Object.assign({}, report, { target });
      }));
      return { ok: true, data: { reports } };
    }
    if (action === 'reviewReport') {
      const reportId = clean(event.reportId, 64); const decision = event.decision === 'delete' ? 'deleted' : 'rejected';
      const report = await db.collection('community_reports').doc(reportId).get(); if (!report.data) return fail('NOT_FOUND', '举报不存在');
      const item = report.data;
      if (decision === 'deleted') await db.collection(item.targetType === 'comment' ? 'community_comments' : 'community_posts').doc(item.targetId).remove().catch(() => {});
      await db.collection('community_reports').doc(reportId).update({ data: { status: decision, reviewedAt: db.serverDate(), reviewerOpenid: OPENID } });
      await db.collection('user_notifications').add({ data: { recipientOpenid: item.reporterOpenid, type: 'report_result', title: decision === 'deleted' ? '举报已处理' : '举报审核结果', content: decision === 'deleted' ? '感谢你的反馈，相关内容已核实并删除。' : '感谢你的反馈，经审核该内容暂不违反社区规范。', reportId, read: false, createdAt: db.serverDate() } });
      return { ok: true, data: { status: decision } };
    }
    if (action === 'delete') {
      const postId = clean(event.postId, 64);
      const post = await db.collection('community_posts').doc(postId).get();
      if (!post.data || post.data.ownerOpenid !== OPENID) return fail('FORBIDDEN', '只能删除自己发布的内容');
      const fileIds = Array.isArray(post.data.imageFileIds) ? post.data.imageFileIds.filter(Boolean) : [];
      await removeWhere('community_comments', { postId });
      await removeWhere('community_reactions', { postId });
      await removeWhere('community_reports', { targetType: 'post', targetId: postId });
      await db.collection('community_posts').doc(postId).remove();
      if (fileIds.length) await cloud.deleteFile({ fileList: fileIds }).catch(error => console.warn('deleteFile', error));
      return { ok: true, data: { deleted: true } };
    }
    if (action === 'deleteComment') {
      const commentId = clean(event.commentId, 64);
      const comment = await db.collection('community_comments').doc(commentId).get();
      if (!comment.data || comment.data.ownerOpenid !== OPENID) return fail('FORBIDDEN', '只能删除自己的评论');
      await db.collection('community_comments').doc(commentId).remove();
      return { ok: true, data: { deleted: true } };
    }
    return fail('UNKNOWN_ACTION', '不支持的操作');
  } catch (error) {
    console.error('community', action, error);
    if (error.message === 'CONTENT_REJECTED') return fail('CONTENT_REJECTED', '内容未通过安全检查');
    return fail('CLOUD_ERROR', '社群服务暂时不可用');
  }
};
