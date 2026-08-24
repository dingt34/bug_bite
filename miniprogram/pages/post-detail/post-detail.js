const mock = require('../../utils/mock.js');
const community = require('../../utils/community.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    post: null,
    reported: false
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
    this.setData({ post, reported: !!reports[post.id] });
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

  previewImage(e) {
    const urls = this.data.post.imageRefs || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  report() {
    if (this.data.reported) {
      wx.showToast({ title: '已在本地标记', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '标记不当内容',
      content: '演示版会在当前设备记录此标记，不会真正提交到审核平台。',
      confirmText: '确认标记',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          const reports = wx.getStorageSync('reportedPosts') || {};
          reports[this.postId] = { reportedAtTimestamp: Date.now() };
          wx.setStorageSync('reportedPosts', reports);
          cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
          this.setData({ reported: true });
          wx.showToast({ title: '已在本地标记', icon: 'success' });
        }
      }
    });
  },

  goSafety() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  }
});
