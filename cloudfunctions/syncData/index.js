const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ALLOWED_KEYS = [
  'plans', 'latestPlan', 'offlineCard', 'events',
  'posts', 'postReactions', 'postComments', 'reportedPosts', 'cloudFileMap', 'cloudTombstones'
];

function normalizeSnapshot(snapshot) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const result = {};
  ALLOWED_KEYS.forEach(key => {
    if (source[key] !== undefined) result[key] = source[key];
  });
  const bytes = Buffer.byteLength(JSON.stringify(result), 'utf8');
  if (bytes > 8 * 1024 * 1024) throw new Error('同步数据过大，请清理部分历史记录后重试');
  return result;
}

async function removeIfExists(collection, id) {
  try {
    await db.collection(collection).doc(id).remove();
  } catch (error) {
    // 文档不存在时仍视为删除完成。
  }
}

exports.main = async event => {
  const context = cloud.getWXContext();
  if (!context.OPENID) throw new Error('无法获取微信用户身份');
  const action = event.action;
  const dataRef = db.collection('user_data').doc(context.OPENID);

  if (action === 'pull') {
    try {
      const result = await dataRef.get();
      return {
        snapshot: result.data.snapshot || null,
        updatedAtTimestamp: result.data.updatedAtTimestamp || 0
      };
    } catch (error) {
      return { snapshot: null, updatedAtTimestamp: 0 };
    }
  }

  if (action === 'push') {
    const snapshot = normalizeSnapshot(event.snapshot);
    const timestamp = Date.now();
    await dataRef.set({
      data: {
        _openid: context.OPENID,
        snapshot,
        updatedAtTimestamp: timestamp
      }
    });
    return { success: true, updatedAtTimestamp: timestamp };
  }

  if (action === 'delete') {
    await removeIfExists('user_data', context.OPENID);
    await removeIfExists('users', context.OPENID);
    return { success: true };
  }

  throw new Error('不支持的同步操作');
};
