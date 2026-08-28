const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const communityCloud = require('../../utils/community-cloud.js');
const tabBar = require('../../utils/tab-bar.js');

Page({
  data: {
    posts: [],
    filterMode: 'all',
    sortMode: 'latest',
    region: '',
    regions: ['全部地区'].concat(mock.REGIONS),
    query: '',
    topic: '',
    topics: [{ key: '', name: '全部主题' }].concat(mock.CONTACT_TYPES.map(item => ({
      key: item.key,
      name: item.name
    }))),
    resultCount: 0,
    initialLoading: true,
    loading: false,
    loadingMore: false,
    loadError: '',
    hasMore: false,
    actionPostId: ''
  },

  onShow() {
    tabBar.syncSelected(this, 1);
    const app = getApp();
    const requestedFilter = app.globalData.communityFilter;
    if (['all', 'collected', 'mine', 'commented'].indexOf(requestedFilter) > -1) {
      this.setData({ filterMode: requestedFilter });
      app.globalData.communityFilter = null;
    }
    this.prepareAndLoad();
  },

  prepareAndLoad() {
    if (this.preparing) return this.preparing;
    this.setData({ loading: true, loadError: '' });
    this.preparing = communityCloud.migrateLegacy(wx, auth.readLocalUser(wx))
      .catch(error => {
        wx.showToast({ title: '旧社群数据稍后重试迁移', icon: 'none' });
        return { migrationError: error };
      })
      .then(() => this.loadPosts({ reset: true }))
      .then(result => {
        this.preparing = null;
        return result;
      });
    return this.preparing;
  },

  onHide() {
    this.setData({ filterMode: 'all' });
  },

  onPullDownRefresh() {
    this.loadPosts({ reset: true, pullDown: true });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) this.loadPosts({ append: true });
  },

  loadPosts(options) {
    const settings = options || {};
    const append = !!settings.append;
    if (append && (!this.data.hasMore || this.data.loadingMore)) return Promise.resolve();
    const token = (this.loadToken || 0) + 1;
    this.loadToken = token;
    this.setData(append
      ? { loadingMore: true, loadError: '' }
      : { loading: true, loadError: '' });
    return communityCloud.getFeed(wx, {
      filterMode: this.data.filterMode,
      query: this.data.query,
      topic: this.data.topic,
      region: this.data.region,
      sortMode: this.data.sortMode,
      offset: append ? this.data.posts.length : 0,
      limit: 20
    }).then(result => {
      if (this.loadToken !== token) return;
      const posts = append ? this.data.posts.concat(result.posts) : result.posts;
      this.setData({
        posts,
        resultCount: result.total,
        hasMore: result.hasMore,
        initialLoading: false,
        loading: false,
        loadingMore: false,
        loadError: ''
      });
    }).catch(error => {
      if (this.loadToken !== token) return;
      this.setData({
        initialLoading: false,
        loading: false,
        loadingMore: false,
        loadError: error && error.message ? error.message : '云端社区加载失败'
      });
    }).then(() => {
      if (settings.pullDown && wx.stopPullDownRefresh) wx.stopPullDownRefresh();
    });
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value || '' });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPosts({ reset: true }), 300);
  },

  clearSearch() {
    this.setData({ query: '' });
    this.loadPosts({ reset: true });
  },

  setTopic(e) {
    this.setData({ topic: e.currentTarget.dataset.topic || '' });
    this.loadPosts({ reset: true });
  },

  setSort(e) {
    this.setData({ sortMode: e.currentTarget.dataset.mode });
    this.loadPosts({ reset: true });
  },

  setRegion(e) {
    const value = e.currentTarget.dataset.region || '';
    this.setData({ region: value === '全部地区' ? '' : value });
    this.loadPosts({ reset: true });
  },

  toggleLike(e) {
    this.toggleReaction(e.currentTarget.dataset.id, 'liked');
  },

  toggleCollect(e) {
    this.toggleReaction(e.currentTarget.dataset.id, 'collected');
  },

  toggleReaction(id, key) {
    if (this.data.actionPostId) return;
    const originalPosts = this.data.posts;
    const originalResultCount = this.data.resultCount;
    const originalPost = originalPosts.find(post => post.id === id);
    if (!originalPost) return;
    const countKey = key === 'liked' ? 'likeCount' : 'collectCount';
    const optimisticValue = !originalPost[key];
    const optimisticPost = Object.assign({}, originalPost, {
      [key]: optimisticValue,
      [countKey]: Math.max(0, (originalPost[countKey] || 0) + (optimisticValue ? 1 : -1))
    });
    const removeOptimistically = key === 'collected' && this.data.filterMode === 'collected' && !optimisticValue;
    this.setData({
      actionPostId: id,
      posts: removeOptimistically
        ? originalPosts.filter(post => post.id !== id)
        : originalPosts.map(post => post.id === id ? optimisticPost : post),
      resultCount: removeOptimistically ? Math.max(0, originalResultCount - 1) : originalResultCount
    });
    return communityCloud.toggleReaction(wx, id, key)
      .then(result => {
        const reaction = result.reaction || {};
        const reconciledPost = Object.assign({}, originalPost, reaction, {
          [countKey]: typeof result[countKey] === 'number' ? result[countKey] : optimisticPost[countKey]
        });
        const removedFromCollected = key === 'collected' && this.data.filterMode === 'collected' && !reaction.collected;
        const posts = removedFromCollected
          ? originalPosts.filter(post => post.id !== id)
          : originalPosts.map(post => post.id === id ? reconciledPost : post);
        this.setData({
          posts,
          resultCount: removedFromCollected ? Math.max(0, originalResultCount - 1) : originalResultCount
        });
        if (key === 'collected') communityCloud.getStats(wx).catch(() => null);
      })
      .catch(error => {
        this.setData({ posts: originalPosts, resultCount: originalResultCount });
        wx.showToast({ title: error.message || '操作失败', icon: 'none' });
      })
      .then(() => this.setData({ actionPostId: '' }));
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
  },

  retryLoad() {
    this.loadPosts({ reset: true });
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.loadToken = (this.loadToken || 0) + 1;
  }
});
