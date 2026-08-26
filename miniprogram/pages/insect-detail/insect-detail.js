const guide = require('../../utils/insect-guide.js');

Page({
  data: {
    item: null,
    activeImageIndex: 0,
    activePhoto: null,
    selected: false,
    selectedCount: 0
  },

  onLoad(options) {
    const item = guide.getById(options && options.id);
    if (!item) {
      wx.showToast({ title: '未找到图鉴条目', icon: 'none' });
      wx.navigateBack();
      return;
    }
    item.aliasText = item.aliases.join(' · ');
    this.itemId = item.id;
    this.setData({ item, activePhoto: item.images[0] });
    this.syncSelection();
  },

  onShow() {
    if (this.itemId) this.syncSelection();
  },

  syncSelection() {
    const stored = wx.getStorageSync('insectGuideCompare');
    const selectedIds = guide.sanitizeSelection(Array.isArray(stored) ? stored : []);
    wx.setStorageSync('insectGuideCompare', selectedIds);
    this.setData({
      selected: selectedIds.indexOf(this.itemId) > -1,
      selectedCount: selectedIds.length
    });
  },

  toggleCompare() {
    const stored = wx.getStorageSync('insectGuideCompare');
    const selectedIds = Array.isArray(stored) ? stored : [];
    const result = guide.toggleSelection(selectedIds, this.itemId, 3);
    if (result.error) {
      wx.showToast({ title: result.error, icon: 'none' });
      return;
    }
    wx.setStorageSync('insectGuideCompare', result.selectedIds);
    this.syncSelection();
  },

  goCompare() {
    const stored = wx.getStorageSync('insectGuideCompare');
    const selectedIds = Array.isArray(stored) ? stored : [];
    if (selectedIds.length < 2) {
      wx.navigateTo({ url: '/pages/insect-guide/insect-guide?preset=' + this.itemId });
      return;
    }
    wx.navigateTo({
      url: '/pages/insect-compare/insect-compare?ids=' + encodeURIComponent(selectedIds.join(','))
    });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },

  onGalleryChange(event) {
    const activeImageIndex = Number(event.detail.current) || 0;
    this.setData({
      activeImageIndex,
      activePhoto: this.data.item.images[activeImageIndex]
    });
  },

  previewImage(event) {
    const index = Number(event.currentTarget.dataset.index) || 0;
    const urls = this.data.item.images.map(photo => photo.src);
    wx.previewImage({ current: urls[index], urls });
  },

  copySource(event) {
    wx.setClipboardData({ data: event.currentTarget.dataset.url });
  },

  copyImageSource(event) {
    wx.setClipboardData({ data: event.currentTarget.dataset.url });
  }
});
