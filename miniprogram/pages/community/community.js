const mock = require('../../utils/mock.js');

Page({
  data: {
    posts: []
  },

  onShow() {
    const local = wx.getStorageSync('posts') || [];
    const base = local.concat(mock.POSTS);
    const reactions = wx.getStorageSync('postReactions') || {};
    const posts = base.map(function (p) {
      const r = reactions[p.id] || {};
      return Object.assign({}, p, {
        liked: !!r.liked,
        likeCount: (p.likeCount || 0) + (r.liked ? 1 : 0),
        collected: !!r.collected,
        collectCount: (p.collectCount || 0) + (r.collected ? 1 : 0)
      });
    });
    this.setData({ posts: posts });
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const reactions = wx.getStorageSync('postReactions') || {};
    const r = reactions[id] || {};
    r.liked = !r.liked;
    reactions[id] = r;
    wx.setStorageSync('postReactions', reactions);
    this.onShow();
  },

  toggleCollect(e) {
    const id = e.currentTarget.dataset.id;
    const reactions = wx.getStorageSync('postReactions') || {};
    const r = reactions[id] || {};
    r.collected = !r.collected;
    reactions[id] = r;
    wx.setStorageSync('postReactions', reactions);
    this.onShow();
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/post-publish/post-publish' });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + e.currentTarget.dataset.id });
  }
});
