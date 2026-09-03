const SESSION_VERSION = 1;

function createDemoUser(timestamp) {
  return {
    id: 'local_demo_user',
    displayName: '山野观察员',
    avatarText: '山',
    mode: 'local_demo',
    sessionVersion: SESSION_VERSION,
    createdAtTimestamp: timestamp || Date.now()
  };
}

function normalizeUserInfo(value) {
  if (!value || typeof value !== 'object' || !value.displayName) return null;
  return {
    id: value.id || 'local_demo_user',
    displayName: String(value.displayName),
    avatarText: value.avatarText || String(value.displayName).slice(0, 1),
    mode: value.mode || 'local_demo',
    avatarUrl: value.avatarUrl || '',
    cloudUserId: value.cloudUserId || '',
    cloudSyncAtTimestamp: value.cloudSyncAtTimestamp || 0,
    sessionVersion: value.sessionVersion || SESSION_VERSION,
    createdAtTimestamp: value.createdAtTimestamp || 0
  };
}

function readLocalUser(wxApi) {
  return normalizeUserInfo(wxApi.getStorageSync('userInfo'));
}

function saveLocalUser(wxApi, userInfo) {
  const normalized = normalizeUserInfo(userInfo);
  if (!normalized) throw new Error('invalid local user');
  wxApi.setStorageSync('userInfo', normalized);
  return normalized;
}

module.exports = {
  SESSION_VERSION,
  createDemoUser,
  normalizeUserInfo,
  readLocalUser,
  saveLocalUser
};
