const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = {
  plan: 'plans',
  event: 'events',
  review: 'reviews'
};
const ALLOWED_FIELDS = {
  plan: ['title','date','type','status','distance','destination','activity','environment','routeSummary','checklist','offlineCard'],
  event: ['type','level','place','body','symptoms','trend','createdAtText','reviewAt','status','measures','imageFileIds'],
  review: ['eventClientId','trend','range','symptoms','measures','imageFileIds','resultLevel']
};

function sanitize(type, source = {}) {
  const result = {};
  for (const key of ALLOWED_FIELDS[type]) {
    const value = source[key];
    if (value === undefined) continue;
    if (typeof value === 'string') result[key] = value.trim().slice(0, key === 'healthNote' ? 500 : 240);
    else if (Array.isArray(value)) result[key] = value.slice(0, 20);
    else if (typeof value === 'boolean' || typeof value === 'number' || (value && typeof value === 'object')) result[key] = value;
  }
  return result;
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const action = event.action;
  const type = event.type;
  const collectionName = COLLECTIONS[type];
  if (!OPENID || !collectionName) return { ok: false, code: 'BAD_REQUEST', message: '请求参数无效' };
  const collection = db.collection(collectionName);
  try {
    if (action === 'pull') {
      const limit = Math.min(Math.max(Number(event.limit) || 50, 1), 100);
      const result = await collection.where({ ownerOpenid: OPENID, deleted: db.command.neq(true) }).orderBy('updatedAt', 'desc').limit(limit).get();
      return { ok: true, data: result.data };
    }
    const clientId = String(event.clientId || event.record?.id || '').slice(0, 96);
    if (!clientId) return { ok: false, code: 'MISSING_ID', message: '缺少数据标识' };
    if (action === 'upsert') {
      const record = sanitize(type, event.record);
      const found = await collection.where({ ownerOpenid: OPENID, clientId }).limit(1).get();
      const data = { ...record, ownerOpenid: OPENID, clientId, deleted: false, updatedAt: db.serverDate() };
      if (found.data.length) await collection.doc(found.data[0]._id).update({ data });
      else await collection.add({ data: { ...data, createdAt: db.serverDate() } });
      return { ok: true, data: { clientId } };
    }
    if (action === 'delete') {
      const found = await collection.where({ ownerOpenid: OPENID, clientId }).limit(1).get();
      if (found.data.length) await collection.doc(found.data[0]._id).update({ data: { deleted: true, updatedAt: db.serverDate() } });
      return { ok: true, data: { clientId } };
    }
    return { ok: false, code: 'UNKNOWN_ACTION', message: '不支持的操作' };
  } catch (error) {
    console.error('userData', error);
    return { ok: false, code: 'DB_ERROR', message: '云同步失败，本地记录不受影响' };
  }
};
