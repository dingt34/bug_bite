const auth = require('./auth.js');
const privacy = require('./privacy.js');
const cloudService = require('./cloud-service.js');
const planUtils = require('./plan.js');

let pushTimer = null;

function itemTimestamp(item) {
  return (item && (item.updatedAtTimestamp || item.createdAtTimestamp)) || 0;
}

function mergeById(localItems, remoteItems) {
  const result = [];
  const positions = {};
  (remoteItems || []).concat(localItems || []).forEach(item => {
    if (!item || !item.id) return;
    if (positions[item.id] === undefined) {
      positions[item.id] = result.length;
      result.push(item);
      return;
    }
    const index = positions[item.id];
    if (itemTimestamp(item) >= itemTimestamp(result[index])) result[index] = item;
  });
  return result.sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
}

function mergeTombstones(localTombstones, remoteTombstones) {
  const local = localTombstones || {};
  const remote = remoteTombstones || {};
  const plans = Object.assign({}, remote.plans || {});
  Object.keys(local.plans || {}).forEach(id => {
    plans[id] = Math.max(plans[id] || 0, local.plans[id] || 0);
  });
  const posts = Object.assign({}, remote.posts || {});
  Object.keys(local.posts || {}).forEach(id => {
    posts[id] = Math.max(posts[id] || 0, local.posts[id] || 0);
  });
  return {
    plans,
    posts,
    offlineCard: Math.max(local.offlineCard || 0, remote.offlineCard || 0)
  };
}

function mergePostComments(localComments, remoteComments) {
  const result = {};
  const postIds = Object.keys(remoteComments || {}).concat(Object.keys(localComments || {}));
  postIds.forEach(postId => {
    result[postId] = mergeById(
      (localComments || {})[postId] || [],
      (remoteComments || {})[postId] || []
    ).sort((a, b) => itemTimestamp(a) - itemTimestamp(b));
  });
  return result;
}

function mergeSnapshots(localSnapshot, remoteSnapshot) {
  const local = localSnapshot || {};
  const remote = remoteSnapshot || {};
  const postReactions = {};
  const reactionIds = Object.keys(remote.postReactions || {}).concat(Object.keys(local.postReactions || {}));
  reactionIds.forEach(id => {
    postReactions[id] = Object.assign(
      {},
      (remote.postReactions || {})[id] || {},
      (local.postReactions || {})[id] || {}
    );
  });
  const cloudTombstones = mergeTombstones(local.cloudTombstones, remote.cloudTombstones);
  const plans = mergeById(local.plans, remote.plans).filter(plan =>
    (cloudTombstones.plans[plan.id] || 0) < itemTimestamp(plan)
  );
  const posts = mergeById(local.posts, remote.posts).filter(post =>
    (cloudTombstones.posts[post.id] || 0) < itemTimestamp(post)
  );
  const localCardTime = local.offlineCard && local.offlineCard.cachedAtTimestamp || 0;
  const remoteCardTime = remote.offlineCard && remote.offlineCard.cachedAtTimestamp || 0;
  const newestCardTime = Math.max(localCardTime, remoteCardTime);
  const offlineCard = cloudTombstones.offlineCard >= newestCardTime
    ? null
    : (localCardTime >= remoteCardTime ? (local.offlineCard || remote.offlineCard || null) : remote.offlineCard);
  return {
    plans,
    latestPlan: plans.length ? planUtils.toLatestPlan(plans[0]) : (local.latestPlan || remote.latestPlan || null),
    offlineCard,
    events: mergeById(local.events, remote.events),
    posts,
    postReactions,
    postComments: mergePostComments(local.postComments, remote.postComments),
    reportedPosts: Object.assign({}, remote.reportedPosts || {}, local.reportedPosts || {}),
    cloudFileMap: Object.assign({}, remote.cloudFileMap || {}, local.cloudFileMap || {}),
    cloudTombstones
  };
}

function readSyncSnapshot(wxApi) {
  const snapshot = privacy.readSnapshot(wxApi);
  return {
    plans: snapshot.plans,
    latestPlan: snapshot.latestPlan,
    offlineCard: snapshot.offlineCard,
    events: snapshot.events,
    posts: snapshot.posts,
    postReactions: snapshot.postReactions,
    postComments: snapshot.postComments || {},
    reportedPosts: snapshot.reportedPosts,
    cloudFileMap: snapshot.cloudFileMap || {},
    cloudTombstones: snapshot.cloudTombstones || {}
  };
}

function applySnapshot(wxApi, snapshot) {
  const source = snapshot || {};
  const keys = [
    'plans', 'latestPlan', 'offlineCard', 'events',
    'posts', 'postReactions', 'postComments', 'reportedPosts', 'cloudFileMap', 'cloudTombstones'
  ];
  keys.forEach(key => {
    if (source[key] === null || source[key] === undefined) wxApi.removeStorageSync(key);
    else wxApi.setStorageSync(key, source[key]);
  });
}

function replacePaths(value, fileMap) {
  if (Array.isArray(value)) return value.map(item => replacePaths(item, fileMap));
  if (value && typeof value === 'object') {
    const next = {};
    Object.keys(value).forEach(key => { next[key] = replacePaths(value[key], fileMap); });
    return next;
  }
  return typeof value === 'string' && fileMap[value] ? fileMap[value] : value;
}

function fileExtension(path) {
  const match = String(path || '').match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'jpg';
}

function uploadSnapshotImages(wxApi, snapshot) {
  const paths = privacy.collectImagePaths(snapshot).filter(path =>
    typeof path === 'string' && path.indexOf('cloud://') !== 0 && path.indexOf('https://') !== 0
  );
  const fileMap = Object.assign({}, snapshot.cloudFileMap || {});
  let sequence = Promise.resolve();
  paths.forEach((path, index) => {
    if (fileMap[path]) return;
    sequence = sequence.then(() => {
      const cloudPath = 'user-content/' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 8) + '.' + fileExtension(path);
      return cloudService.uploadFile(wxApi, cloudPath, path).then(result => {
        fileMap[path] = result.fileID;
      });
    });
  });
  return sequence.then(() => {
    const cloudSnapshot = replacePaths(snapshot, fileMap);
    cloudSnapshot.cloudFileMap = fileMap;
    return cloudSnapshot;
  });
}

function pushNow(wxApi) {
  const user = auth.readLocalUser(wxApi);
  if (!user || user.mode !== 'wechat_cloud') return Promise.resolve({ skipped: true, reason: 'not_cloud_user' });
  const snapshot = readSyncSnapshot(wxApi);
  return uploadSnapshotImages(wxApi, snapshot).then(cloudSnapshot => {
    wxApi.setStorageSync('cloudFileMap', cloudSnapshot.cloudFileMap || {});
    return cloudService.syncData(wxApi, 'push', cloudSnapshot);
  });
}

function pullAndMerge(wxApi) {
  return cloudService.syncData(wxApi, 'pull').then(result => {
    if (!result.snapshot) return { merged: false, snapshot: readSyncSnapshot(wxApi) };
    const merged = mergeSnapshots(readSyncSnapshot(wxApi), result.snapshot);
    applySnapshot(wxApi, merged);
    return { merged: true, snapshot: merged, updatedAtTimestamp: result.updatedAtTimestamp };
  });
}

function queuePush(wxApi, app) {
  const user = auth.readLocalUser(wxApi);
  if (!user || user.mode !== 'wechat_cloud' || !cloudService.isConfigured()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (app && app.globalData) app.globalData.cloudSyncStatus = 'syncing';
    pushNow(wxApi).then(() => {
      if (app && app.globalData) app.globalData.cloudSyncStatus = 'synced';
    }).catch(() => {
      if (app && app.globalData) app.globalData.cloudSyncStatus = 'failed';
    });
  }, 800);
}

function deleteCloudAccount(wxApi) {
  const fileMap = wxApi.getStorageSync('cloudFileMap') || {};
  const user = auth.readLocalUser(wxApi);
  const fileList = Object.keys(fileMap).map(key => fileMap[key]);
  if (user && user.avatarUrl) fileList.push(user.avatarUrl);
  const cloudFiles = fileList.filter((id, index) =>
    typeof id === 'string' && id.indexOf('cloud://') === 0 && fileList.indexOf(id) === index
  );
  return cloudService.deleteFiles(wxApi, cloudFiles)
    .then(() => cloudService.syncData(wxApi, 'delete'));
}

module.exports = {
  mergeById,
  mergeTombstones,
  mergePostComments,
  mergeSnapshots,
  readSyncSnapshot,
  applySnapshot,
  replacePaths,
  uploadSnapshotImages,
  pushNow,
  pullAndMerge,
  queuePush,
  deleteCloudAccount
};
