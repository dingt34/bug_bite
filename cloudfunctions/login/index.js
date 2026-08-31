const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function cleanText(value, max = 80) {
  return String(value || '').trim().slice(0, max);
}

exports.main = async event => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();
  if (!OPENID) return { ok: false, code: 'NO_OPENID', message: '无法确认微信身份' };
  const profile = event && event.profile;
  const now = db.serverDate();
  try {
    const existing = await db.collection('users').where({ _openid: OPENID }).limit(1).get();
    const data = {
      appid: APPID || '',
      unionid: UNIONID || '',
      updatedAt: now,
      ...(profile ? {
        nickname: cleanText(profile.nickname, 30),
        avatarFileId: cleanText(profile.avatarFileId, 256),
        ageRange: cleanText(profile.ageRange, 20),
        region: cleanText(profile.region, 60),
        healthNote: cleanText(profile.health, 500)
      } : {})
    };
    let userId;
    if (existing.data.length) {
      userId = existing.data[0]._id;
      await db.collection('users').doc(userId).update({ data });
    } else {
      const created = await db.collection('users').add({ data: { ...data, _openid: OPENID, createdAt: now } });
      userId = created._id;
    }
    return { ok: true, data: { openid: OPENID, userId } };
  } catch (error) {
    console.error('login', error);
    return { ok: false, code: 'DB_ERROR', message: '用户云数据尚未就绪' };
  }
};
