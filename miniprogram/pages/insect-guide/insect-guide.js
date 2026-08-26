const guide = require('../../utils/insect-guide.js');

function decorate(items, selectedIds) {
  return items.map(item => Object.assign({}, item, {
    aliasText: item.aliases.slice(0, 3).join(' · '),
    selected: selectedIds.indexOf(item.id) > -1
  }));
}

Page({
  data: {
    groups: guide.GROUPS,
    activeGroup: 'all',
    query: '',
    items: [],
    selectedIds: [],
    selectedCount: 0
  },

  onLoad(options) {
    let selectedIds = guide.sanitizeSelection(wx.getStorageSync('insectGuideCompare') || []);
    if (options && options.preset) {
      selectedIds = guide.toggleSelection(selectedIds, options.preset, 3).selectedIds;
      wx.setStorageSync('insectGuideCompare', selectedIds);
    }
    wx.setStorageSync('insectGuideCompare', selectedIds);
    this.setData({ selectedIds, selectedCount: selectedIds.length });
    this.refreshList();
  },

  onShow() {
    if (!this.loadedOnce) {
      this.loadedOnce = true;
      return;
    }
    const selectedIds = guide.sanitizeSelection(wx.getStorageSync('insectGuideCompare') || []);
    wx.setStorageSync('insectGuideCompare', selectedIds);
    this.setData({ selectedIds, selectedCount: selectedIds.length });
    this.refreshList();
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value || '' });
    this.refreshList();
  },

  clearSearch() {
    this.setData({ query: '' });
    this.refreshList();
  },

  setGroup(event) {
    this.setData({ activeGroup: event.currentTarget.dataset.group || 'all' });
    this.refreshList();
  },

  refreshList() {
    const items = guide.list({ query: this.data.query, group: this.data.activeGroup });
    this.setData({ items: decorate(items, this.data.selectedIds) });
  },

  toggleCompare(event) {
    const result = guide.toggleSelection(this.data.selectedIds, event.currentTarget.dataset.id, 3);
    if (result.error) {
      wx.showToast({ title: result.error, icon: 'none' });
      return;
    }
    wx.setStorageSync('insectGuideCompare', result.selectedIds);
    this.setData({ selectedIds: result.selectedIds, selectedCount: result.selectedIds.length });
    this.refreshList();
  },

  clearSelection() {
    wx.setStorageSync('insectGuideCompare', []);
    this.setData({ selectedIds: [], selectedCount: 0 });
    this.refreshList();
  },

  goDetail(event) {
    wx.navigateTo({ url: '/pages/insect-detail/insect-detail?id=' + event.currentTarget.dataset.id });
  },

  goCompare() {
    if (this.data.selectedIds.length < 2) {
      wx.showToast({ title: '请至少选择 2 种', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/insect-compare/insect-compare?ids=' + encodeURIComponent(this.data.selectedIds.join(','))
    });
  }
});
