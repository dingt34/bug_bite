const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    post: null,
    reported: false,
    comments: [],
    commentText: '',
    commentCount: 0,
    canDelete: false
  },

  onLoad(options) {
    this.postId = options.id;
  },

  onShow() {
    const post = community.findPost(
      wx.getStorageSync('posts') || [],
      mock.POSTS,
      wx.getStorageSync('postReactions') || {},
      this.postId
    );
    if (!post) {
      if (this.missingHandled) return;
      this.missingHandled = true;
      wx.showModal({
        title: '帖子不存在',
        content: '该帖子可能已被删除。',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }
    const reports = wx.getStorageSync('reportedPosts') || {};
    const commentsMap = wx.getStorageSync('postComments') || {};
    const comments = community.decorateComments(commentsMap[post.id] || []);
    const user = auth.readLocalUser(wx);
    const canDelete = !!user && !!post.local && (
      (post.authorId && post.authorId === user.id) ||
      (!post.authorId && post.displayName === user.displayName)
    );
    this.setData({
      post,
      reported: !!reports[post.id],
      comments,
      commentCount: comments.length,
      canDelete
    });
  },

  toggleLike() {
    const reactions = community.toggleReaction(wx.getStorageSync('postReactions') || {}, this.postId, 'liked');
    wx.setStorageSync('postReactions', reactions);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.onShow();
  },

  toggleCollect() {
    const reactions = community.toggleReaction(wx.getStorageSync('postReactions') || {}, this.postId, 'collected');
    wx.setStorageSync('postReactions', reactions);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.onShow();
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value || '' });
  },

  submitComment() {
    const user = auth.readLocalUser(wx);
    if (!user) {
      wx.showModal({
        title: '需要登录身份',
        content: '评论前请先创建体验身份或使用微信云登录。',
        confirmText: '去登录',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    const validation = community.validateComment(this.data.commentText);
    if (!validation.valid) {
      wx.showToast({ title: validation.message, icon: 'none' });
      return;
    }
    const commentsMap = wx.getStorageSync('postComments') || {};
    const comments = (commentsMap[this.postId] || []).slice();
    comments.push(community.buildComment(validation.text, user));
    commentsMap[this.postId] = comments;
    wx.setStorageSync('postComments', commentsMap);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.setData({ commentText: '' });
    this.onShow();
    wx.showToast({ title: '评论已发布', icon: 'success' });
  },

  deletePost() {
    if (!this.data.canDelete) return;
    wx.showModal({
      title: '删除我的分享',
      content: '删除后将不再在社群中显示，且无法恢复。',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        const post = this.data.post;
        const posts = (wx.getStorageSync('posts') || []).filter(item => item.id !== this.postId);
        wx.setStorageSync('posts', posts);
        ['postReactions', 'postComments', 'reportedPosts'].forEach(key => {
          const values = wx.getStorageSync(key) || {};
          delete values[this.postId];
          wx.setStorageSync(key, values);
        });
        const tombstones = wx.getStorageSync('cloudTombstones') || {};
        tombstones.posts = Object.assign({}, tombstones.posts || {}, { [this.postId]: Date.now() });
        wx.setStorageSync('cloudTombstones', tombstones);
        (post.imageRefs || []).filter(path => path && path.indexOf('cloud://') !== 0).forEach(path => {
          wx.removeSavedFile({ filePath: path, fail: () => {} });
        });
        cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
        wx.showToast({ title: '分享已删除', icon: 'success' });
        wx.navigateBack();
      }
    });
  },

  previewImage(e) {
    const urls = this.data.post.imageRefs || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  report() {
    if (this.data.reported) {
      wx.showToast({ title: '已标记并隐藏', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '标记不当内容',
      content: '标记后该内容会从你的社群列表隐藏；这不是平台人工审核结果。',
      confirmText: '确认标记',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          const reports = wx.getStorageSync('reportedPosts') || {};
          reports[this.postId] = { reportedAtTimestamp: Date.now() };
          wx.setStorageSync('reportedPosts', reports);
          cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
          this.setData({ reported: true });
          wx.showToast({ title: '已标记并隐藏', icon: 'success' });
        }
      }
    });
  },

  goSafety() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  }
});
