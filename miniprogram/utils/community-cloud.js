const config = require('../config/cloud.js');
const cloudService = require('./cloud-service.js');
const community = require('./community.js');

function call(wxApi, action, data) {
  return cloudService.callFunction(
    wxApi,
    config.COMMUNITY_FUNCTION,
    Object.assign({ action }, data || {})
  );
}

function fileExtension(path) {
  const match = String(path || '').match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'jpg';
}

function uploadImage(wxApi, filePath) {
  if (!filePath) return Promise.resolve('');
  if (filePath.indexOf('cloud://') === 0) return Promise.resolve(filePath);
  const cloudPath = 'community/' + Date.now() + '-' + Math.random().toString(36).slice(2, 9) + '.' + fileExtension(filePath);
  return cloudService.uploadFile(wxApi, cloudPath, filePath).then(result => result.fileID);
}

function getFeed(wxApi, filters) {
  return call(wxApi, 'list', filters).then(result => ({
    posts: (result.posts || []).map(item => community.decorateCloudPost(item)),
    total: result.total || 0,
    hasMore: !!result.hasMore
  }));
}

function getThread(wxApi, postId) {
  return call(wxApi, 'get', { postId }).then(result => ({
    post: result.post ? community.decorateCloudPost(result.post) : null,
    comments: (result.comments || []).map(item => community.decorateCloudComment(item)),
    reported: !!result.reported
  }));
}

function publish(wxApi, draft, profile) {
  let uploadedFileId = '';
  return uploadImage(wxApi, draft.previewImage).then(fileId => {
    uploadedFileId = fileId;
    return call(wxApi, 'publish', {
      profile,
      post: {
        text: draft.text,
        region: draft.region,
        contactType: draft.contactType,
        contactTypeName: draft.contactTypeName,
        stage: draft.stage,
        imageRefs: fileId ? [fileId] : []
      }
    });
  }).catch(error => {
    if (uploadedFileId) cloudService.deleteFiles(wxApi, [uploadedFileId]).catch(() => {});
    throw error;
  });
}

function update(wxApi, postId, draft) {
  let uploadedFileId = '';
  const isNewUpload = draft.previewImage && draft.previewImage.indexOf('cloud://') !== 0;
  return uploadImage(wxApi, draft.previewImage).then(fileId => {
    if (isNewUpload) uploadedFileId = fileId;
    return call(wxApi, 'updatePost', {
      postId,
      post: {
        text: draft.text,
        region: draft.region,
        contactType: draft.contactType,
        contactTypeName: draft.contactTypeName,
        stage: draft.stage,
        imageRefs: fileId ? [fileId] : []
      }
    });
  }).catch(error => {
    if (uploadedFileId) cloudService.deleteFiles(wxApi, [uploadedFileId]).catch(() => {});
    throw error;
  });
}

function toggleReaction(wxApi, postId, key) {
  return call(wxApi, 'toggleReaction', { postId, key });
}

function comment(wxApi, postId, text, profile) {
  return call(wxApi, 'comment', { postId, text, profile });
}

function deleteComment(wxApi, commentId) {
  return call(wxApi, 'deleteComment', { commentId });
}

function deletePost(wxApi, postId) {
  return call(wxApi, 'deletePost', { postId });
}

function report(wxApi, postId, reason) {
  return call(wxApi, 'report', { postId, reason });
}

function deleteAccount(wxApi) {
  return call(wxApi, 'deleteAccount');
}

function getStats(wxApi) {
  return call(wxApi, 'stats').then(stats => {
    const normalized = {
      posts: stats.posts || 0,
      comments: stats.comments || 0,
      collections: stats.collections || 0,
      updatedAtTimestamp: Date.now()
    };
    wxApi.setStorageSync('communityCloudStats', normalized);
    return normalized;
  });
}

function readCachedStats(wxApi) {
  return wxApi.getStorageSync('communityCloudStats') || {
    posts: 0,
    comments: 0,
    collections: 0,
    updatedAtTimestamp: 0
  };
}

function saveMigrationState(wxApi, state) {
  wxApi.setStorageSync('communityMigrationV1', state);
  return state;
}

function migrateLegacy(wxApi, profile) {
  const previous = wxApi.getStorageSync('communityMigrationV1') || {};
  if (previous.completed) return Promise.resolve({ skipped: true, state: previous });
  if (!profile || profile.mode !== 'wechat_cloud') {
    return Promise.resolve({ skipped: true, reason: 'not_cloud_user' });
  }
  const legacyPosts = (wxApi.getStorageSync('posts') || []).filter(post => post && post.local);
  const commentsMap = wxApi.getStorageSync('postComments') || {};
  const reactions = wxApi.getStorageSync('postReactions') || {};
  const state = Object.assign({
    version: 1,
    completed: false,
    postMap: {},
    commentMap: {},
    reactionMap: {}
  }, previous);
  let sequence = Promise.resolve();
  legacyPosts.forEach(post => {
    sequence = sequence.then(() => {
      if (state.postMap[post.id]) return state.postMap[post.id];
      return publish(wxApi, {
        text: post.text,
        previewImage: (post.imageRefs || [])[0] || '',
        region: post.region || '',
        contactType: post.contactType || 'unknown',
        contactTypeName: (post.tags || [])[1] || '不确定',
        stage: post.stage || (post.tags || [])[2] || '观察中'
      }, profile).then(result => {
        state.postMap[post.id] = result.post.id;
        saveMigrationState(wxApi, state);
        return result.post.id;
      });
    }).then(cloudPostId => {
      let commentSequence = Promise.resolve();
      (commentsMap[post.id] || []).forEach(legacyComment => {
        const legacyCommentId = legacyComment.id || (post.id + ':' + legacyComment.createdAtTimestamp);
        if (state.commentMap[legacyCommentId]) return;
        commentSequence = commentSequence.then(() => comment(
          wxApi,
          cloudPostId,
          legacyComment.text,
          {
            displayName: legacyComment.displayName || profile.displayName,
            avatarText: legacyComment.avatarText || profile.avatarText
          }
        ).then(result => {
          state.commentMap[legacyCommentId] = result.comment.id;
          saveMigrationState(wxApi, state);
        }));
      });
      return commentSequence.then(() => cloudPostId);
    }).then(cloudPostId => {
      const legacyReaction = reactions[post.id] || {};
      const migrated = state.reactionMap[post.id] || {};
      let reactionSequence = Promise.resolve();
      ['liked', 'collected'].forEach(key => {
        if (!legacyReaction[key] || migrated[key]) return;
        reactionSequence = reactionSequence.then(() => toggleReaction(wxApi, cloudPostId, key).then(() => {
          state.reactionMap[post.id] = Object.assign({}, state.reactionMap[post.id] || {}, { [key]: true });
          saveMigrationState(wxApi, state);
        }));
      });
      return reactionSequence;
    });
  });
  return sequence.then(() => {
    state.completed = true;
    state.completedAtTimestamp = Date.now();
    saveMigrationState(wxApi, state);
    return getStats(wxApi).catch(() => readCachedStats(wxApi)).then(stats => ({ migrated: true, stats, state }));
  });
}

module.exports = {
  call,
  uploadImage,
  getFeed,
  getThread,
  publish,
  update,
  toggleReaction,
  comment,
  deleteComment,
  deletePost,
  report,
  deleteAccount,
  getStats,
  readCachedStats,
  migrateLegacy
};
