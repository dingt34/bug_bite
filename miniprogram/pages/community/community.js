const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    posts: [],
    filterMode: 'all',
    sortMode: 'latest',
    query: '',
    topic: '',
    topics: [{ key: '', name: '全部主题' }].concat(mock.CONTACT_TYPES.map(item => ({
      key: item.key,
      name: item.name
    }))),
    hiddenCount: 0,
    resultCount: 0
  },

  onShow() {
    const app = getApp();
    const requestedFilter = app.globalData.communityFilter;
    if (['all', 'collected', 'mine', 'commented'].indexOf(requestedFilter) > -1) {
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
    const reportedPosts = wx.getStorageSync('reportedPosts') || {};
    const posts = community.listPosts(local, mock.POSTS, reactions, this.data.filterMode, Date.now(), {
      query: this.data.query,
      topic: this.data.topic,
      sortMode: this.data.sortMode,
      currentUser: auth.readLocalUser(wx),
      reportedPosts,
      postComments: wx.getStorageSync('postComments') || {}
    });
    this.setData({
      posts,
      resultCount: posts.length,
      hiddenCount: Object.keys(reportedPosts).length
    });
  },

  setFilter(e) {
    this.setData({ filterMode: e.currentTarget.dataset.mode });
    this.loadPosts();
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value || '' });
    this.loadPosts();
  },

  clearSearch() {
    this.setData({ query: '' });
    this.loadPosts();
  },

  setTopic(e) {
    this.setData({ topic: e.currentTarget.dataset.topic || '' });
    this.loadPosts();
  },

  setSort(e) {
    this.setData({ sortMode: e.currentTarget.dataset.mode });
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
