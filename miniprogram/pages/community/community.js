const mock = require('../../utils/mock.js');
const community = require('../../utils/community.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    posts: [],
    filterMode: 'all'
  },

  onShow() {
    const app = getApp();
    const requestedFilter = app.globalData.communityFilter;
    if (requestedFilter === 'all' || requestedFilter === 'collected') {
      this.setData({ filterMode: requestedFilter });
      app.globalData.communityFilter = null;
    }
    this.loadPosts();
  },

  onHide() {
    this.setData({ filterMode: 'all' });
  },

  loadPosts() {
    const local = wx.getStorageSync('posts') || [];
    const reactions = wx.getStorageSync('postReactions') || {};
    const posts = community.listPosts(local, mock.POSTS, reactions, this.data.filterMode);
    this.setData({ posts: posts });
  },

  setFilter(e) {
    this.setData({ filterMode: e.currentTarget.dataset.mode });
    this.loadPosts();
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const reactions = community.toggleReaction(wx.getStorageSync('postReactions') || {}, id, 'liked');
    wx.setStorageSync('postReactions', reactions);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.loadPosts();
  },

  toggleCollect(e) {
    const id = e.currentTarget.dataset.id;
    const reactions = community.toggleReaction(wx.getStorageSync('postReactions') || {}, id, 'collected');
    wx.setStorageSync('postReactions', reactions);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.loadPosts();
  },

  previewImage(e) {
    const urls = e.currentTarget.dataset.urls || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/post-publish/post-publish' });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + e.currentTarget.dataset.id });
  }
});
