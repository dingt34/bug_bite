const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function normalizeProfile(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const displayName = String(source.displayName || '微信用户').trim().slice(0, 20);
  const avatarUrl = typeof source.avatarUrl === 'string' && source.avatarUrl.indexOf('cloud://') === 0
    ? source.avatarUrl
    : '';
  return { displayName: displayName || '微信用户', avatarUrl };
}

exports.main = async event => {
  const context = cloud.getWXContext();
  if (!context.OPENID) throw new Error('无法获取微信用户身份');

  const profile = normalizeProfile(event.profile);
  const timestamp = Date.now();
  const userRef = db.collection('users').doc(context.OPENID);
  let createdAtTimestamp = timestamp;
  let previousAvatarUrl = '';
  try {
    const existing = await userRef.get();
    createdAtTimestamp = existing.data.createdAtTimestamp || timestamp;
    previousAvatarUrl = existing.data.avatarUrl || '';
  } catch (error) {
    // 首次登录时文档不存在，后续 set 会创建。
  }

  await userRef.set({
    data: {
      _openid: context.OPENID,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      createdAtTimestamp,
      updatedAtTimestamp: timestamp,
      lastLoginAtTimestamp: timestamp
    }
  });

  if (previousAvatarUrl && previousAvatarUrl !== profile.avatarUrl && previousAvatarUrl.indexOf('cloud://') === 0) {
    try {
      await cloud.deleteFile({ fileList: [previousAvatarUrl] });
    } catch (error) {
      // 头像资料已成功更新；旧文件清理失败不应阻断登录。
    }
  }

  return {
    userId: context.OPENID,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    createdAtTimestamp,
    loginAtTimestamp: timestamp
  };
};
