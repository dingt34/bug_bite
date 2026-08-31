const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { ok: false, code: 'NO_OPENID', message: '无法确认微信身份' };
  const action = String(event.action || 'event');
  try {
    if (action === 'event') {
      const clientId = String(event.clientId || '').slice(0, 80);
      const deleted = await removeWhere('reviews', { ownerOpenid: OPENID, eventClientId: clientId });
      const events = await removeWhere('events', { ownerOpenid: OPENID, clientId });
      return { ok: true, data: { deleted: deleted + events } };
    }
    if (action === 'community') {
      const postId = String(event.postId || '').slice(0, 64);
      const post = await db.collection('community_posts').doc(postId).get();
      if (!post.data || post.data.ownerOpenid !== OPENID) return { ok: false, code: 'FORBIDDEN', message: '只能删除自己的内容' };
      const fileIds = Array.isArray(post.data.imageFileIds) ? post.data.imageFileIds.filter(Boolean) : [];
      const comments = await removeWhere('community_comments', { postId });
      const reactions = await removeWhere('community_reactions', { postId });
      const reports = await removeWhere('community_reports', { targetType: 'post', targetId: postId });
      await db.collection('community_posts').doc(postId).remove();
      if (fileIds.length) await cloud.deleteFile({ fileList: fileIds }).catch(error => console.warn('deleteFile', error));
      return { ok: true, data: { deleted: 1 + comments + reactions + reports } };
    }
    if (action === 'account') {
      const ownedPosts = await db.collection('community_posts').where({ ownerOpenid: OPENID }).field({ _id: true, imageFileIds: true }).limit(100).get();
      for (const post of ownedPosts.data) {
        await removeWhere('community_comments', { postId: post._id });
        await removeWhere('community_reactions', { postId: post._id });
        await db.collection('community_posts').doc(post._id).remove();
        const files = Array.isArray(post.imageFileIds) ? post.imageFileIds.filter(Boolean) : [];
        if (files.length) await cloud.deleteFile({ fileList: files }).catch(error => console.warn('deleteFile', error));
      }
      const collections = ['plans', 'events', 'reviews', 'reminders', 'ai_audits', 'recognition_results'];
      let deleted = ownedPosts.data.length;
      for (const name of collections) deleted += await removeWhere(name, { ownerOpenid: OPENID });
      deleted += await removeWhere('community_comments', { ownerOpenid: OPENID });
      deleted += await removeWhere('community_reactions', { ownerOpenid: OPENID });
      deleted += await removeWhere('community_reports', { reporterOpenid: OPENID });
      deleted += await removeWhere('users', { _openid: OPENID });
      return { ok: true, data: { deleted } };
    }
    return { ok: false, code: 'UNKNOWN_ACTION', message: '不支持的删除范围' };
  } catch (error) {
    console.error('deleteData', action, error);
    return { ok: false, code: 'DELETE_FAILED', message: '数据删除未完成，请稍后重试' };
  }
};
