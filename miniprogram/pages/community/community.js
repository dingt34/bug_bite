const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

function decorate(post) {
  const id = post._id || post.id;
  const reaction = store.get('communityReactions', {})[id] || {};
  return Object.assign({}, post, { id, initial: (post.author || '访').charAt(0), likes: Number(post.likes) || 0, comments: Number(post.comments) || 0, favorites: Number(post.favorites) || 0, liked: !!reaction.liked, favorited: !!reaction.favorited });
}

Page({
  data: {
    posts: [], allPosts: [],
    regionFilters: ['全部', '浙江杭州', '浙江宁波', '浙江温州', '浙江丽水', '浙江台州'],
    typeFilters: ['全部', '叮咬', '蜇伤', '发现附着虫体', '接触后皮疹/不适', '不确定'],
    stageFilters: ['全部', '刚发生', '处理中', '观察中', '观察完成'],
    regionFilter: '全部', typeFilter: '全部', stageFilter: '全部', routeOnly: false,
    draftRegionFilter: '全部', draftTypeFilter: '全部', draftStageFilter: '全部', draftRouteOnly: false,
    showFilter: false, hasFilter: false, keyword: '', loading: false, loadFailed: false
  },
  onShow() { nav.syncTab(this, 3); if (wx.hideHomeButton) wx.hideHomeButton({ fail: () => {} }); this.loadPosts(); },
  loadPosts() {
    const cachedPosts = store.get('posts', []);
    const local = (Array.isArray(cachedPosts) ? cachedPosts : []).map(decorate);
    this.setData({ allPosts: local, loading: true, loadFailed: false }, () => this.applyFilters());
    cloud.call('community', { action: 'list', limit: 30 }).then(posts => {
      if (!Array.isArray(posts)) return;
      // 云端连接成功时以云端数据为准；本地副本只用于离线兜底，避免同一帖子显示两次。
      const allPosts = posts.map(decorate);
      store.set('posts', allPosts);
      this.setData({ allPosts }, () => this.applyFilters());
    }).catch(() => this.setData({ loadFailed: local.length === 0 })).finally(() => this.setData({ loading: false }));
  },
  applyFilters() {
    const key = this.data.keyword.trim();
    const posts = this.data.allPosts.filter(item => {
      const text = [item.region, item.type, item.stage, item.title, item.text, item.route].join(' ');
      const regionMatch = this.data.regionFilter === '全部' || String(item.region || '').includes(this.data.regionFilter);
      const typeMatch = this.data.typeFilter === '全部' || String(item.type || '').includes(this.data.typeFilter);
      const stageMatch = this.data.stageFilter === '全部' || String(item.stage || '').includes(this.data.stageFilter);
      return regionMatch && typeMatch && stageMatch && (!this.data.routeOnly || !!item.route) && (!key || text.includes(key));
    });
    this.setData({ posts, hasFilter: this.data.regionFilter !== '全部' || this.data.typeFilter !== '全部' || this.data.stageFilter !== '全部' || this.data.routeOnly });
  },
  search(e) { this.setData({ keyword: e.detail.value }, () => this.applyFilters()); },
  clearSearch() { this.setData({ keyword: '' }, () => this.applyFilters()); },
  resetFilters() { this.setData({ keyword: '', regionFilter: '全部', typeFilter: '全部', stageFilter: '全部', routeOnly: false }, () => this.applyFilters()); },
  openFilters() { this.setData({ showFilter: true, draftRegionFilter: this.data.regionFilter, draftTypeFilter: this.data.typeFilter, draftStageFilter: this.data.stageFilter, draftRouteOnly: this.data.routeOnly }); },
  closeFilters() { this.setData({ showFilter: false }); },
  noop() {},
  filterRegion(e) { this.setData({ draftRegionFilter: e.currentTarget.dataset.v }); },
  filterType(e) { this.setData({ draftTypeFilter: e.currentTarget.dataset.v }); },
  filterStage(e) { this.setData({ draftStageFilter: e.currentTarget.dataset.v }); },
  toggleRoute() { this.setData({ draftRouteOnly: !this.data.draftRouteOnly }); },
  clearDraftFilters() { this.setData({ draftRegionFilter: '全部', draftTypeFilter: '全部', draftStageFilter: '全部', draftRouteOnly: false }); },
  confirmFilters() { this.setData({ regionFilter: this.data.draftRegionFilter, typeFilter: this.data.draftTypeFilter, stageFilter: this.data.draftStageFilter, routeOnly: this.data.draftRouteOnly, showFilter: false }, () => this.applyFilters()); },
  open(e) { const id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + id }); },
  updateReaction(id, key, countKey) {
    const reactions = store.get('communityReactions', {});
    const enabled = !((reactions[id] || {})[key]);
    reactions[id] = Object.assign({}, reactions[id], { [key]: enabled });
    const allPosts = this.data.allPosts.map(item => item.id === id ? Object.assign({}, item, { [countKey]: Math.max(0, (item[countKey] || 0) + (enabled ? 1 : -1)), [key]: enabled }) : item);
    store.set('communityReactions', reactions);
    store.set('posts', allPosts);
    this.setData({ allPosts }, () => this.applyFilters());
    wx.showToast({ title: enabled ? (key === 'liked' ? '已点赞' : '已收藏') : (key === 'liked' ? '已取消点赞' : '已取消收藏'), icon: 'none' });
  },
  toggleLike(e) { this.updateReaction(e.currentTarget.dataset.id, 'liked', 'likes'); },
  toggleFavorite(e) { this.updateReaction(e.currentTarget.dataset.id, 'favorited', 'favorites'); },
  share(e) { wx.setClipboardData({ data: '虫咬识途经历：' + (e.currentTarget.dataset.title || '') }); },
  publish() { wx.navigateTo({ url: '/pages/publish/publish' }); }
});
