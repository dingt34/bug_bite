const FIXED_STORAGE_KEYS = [
  'userInfo', 'plans', 'latestPlan', 'offlineCard', 'events',
  'posts', 'postReactions', 'reportedPosts', 'cloudFileMap', 'cloudTombstones'
];

function unique(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function collectImagePaths(snapshot) {
  const paths = [];
  (snapshot.events || []).forEach(event => {
    (event.imageRefs || []).forEach(path => paths.push(path));
    (event.imageRecords || []).forEach(record => paths.push(record && record.path));
    paths.push(event.insectImageRef, event.woundImageRef);
    (event.reviews || []).forEach(review => {
      (review.imageRefs || []).forEach(path => paths.push(path));
    });
  });
  (snapshot.posts || []).forEach(post => {
    (post.imageRefs || []).forEach(path => paths.push(path));
  });
  return unique(paths);
}

function buildDataSummary(snapshot) {
  const reactions = snapshot.postReactions || {};
  return {
    plans: (snapshot.plans || []).length,
    events: (snapshot.events || []).length,
    posts: (snapshot.posts || []).length,
    collections: Object.keys(reactions).filter(id => reactions[id] && reactions[id].collected).length,
    images: collectImagePaths(snapshot).length,
    hasIdentity: !!snapshot.userInfo,
    hasOfflineCard: !!snapshot.offlineCard
  };
}

function readSnapshot(wxApi) {
  return {
    userInfo: wxApi.getStorageSync('userInfo') || null,
    plans: wxApi.getStorageSync('plans') || [],
    latestPlan: wxApi.getStorageSync('latestPlan') || null,
    offlineCard: wxApi.getStorageSync('offlineCard') || null,
    events: wxApi.getStorageSync('events') || [],
    posts: wxApi.getStorageSync('posts') || [],
    postReactions: wxApi.getStorageSync('postReactions') || {},
    reportedPosts: wxApi.getStorageSync('reportedPosts') || {},
    cloudFileMap: wxApi.getStorageSync('cloudFileMap') || {},
    cloudTombstones: wxApi.getStorageSync('cloudTombstones') || {}
  };
}

function resolveDataKeys(storageKeys) {
  return unique((storageKeys || []).filter(key =>
    FIXED_STORAGE_KEYS.indexOf(key) > -1 || key.indexOf('plan_') === 0
  ));
}

module.exports = {
  FIXED_STORAGE_KEYS,
  collectImagePaths,
  buildDataSummary,
  readSnapshot,
  resolveDataKeys
};
