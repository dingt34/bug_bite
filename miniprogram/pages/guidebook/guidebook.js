const nav = require('../../utils/nav');
const store = require('../../utils/store');
const species = require('../../utils/species');

const SELECTION_KEY = 'compare_selection';

Page({
  data: {
    categories: species.CATEGORIES,
    category: '全部',
    keyword: '',
    selected: [],
    compareDisabled: true,
    items: [],
    total: 0
  },

  onLoad() {
    const saved = species.sanitize(store.get(SELECTION_KEY, ['tick', 'mosquito']));
    this.setData({
      selected: saved,
      compareDisabled: saved.length < 2,
      total: species.all().length
    });
    this.refresh();
  },

  onShow() {
    // 从详情页"加入对比"回来时，已选虫种可能已经变了
    const saved = species.sanitize(store.get(SELECTION_KEY, this.data.selected));
    this.setData({ selected: saved, compareDisabled: saved.length < 2 });
    this.refresh();
  },

  // 按当前分类和关键词重新生成列表
  refresh() {
    const { category, keyword, selected } = this.data;
    const items = species.filter({ category, keyword }).map(item => ({
      id: item.id,
      name: item.name,
      meta: item.meta,
      photo: item.photo,
      selected: selected.indexOf(item.id) >= 0
    }));
    this.setData({ items });
  },

  back() {
    nav.back();
  },

  setCategory(e) {
    this.setData({ category: e.currentTarget.dataset.v }, () => this.refresh());
  },

  onKeyword(e) {
    this.setData({ keyword: e.detail.value }, () => this.refresh());
  },

  clearKeyword() {
    this.setData({ keyword: '' }, () => this.refresh());
  },

  toggle(e) {
    const result = species.toggle(this.data.selected, e.currentTarget.dataset.id);
    if (!result.ok) {
      wx.showToast({ title: result.reason, icon: 'none' });
      return;
    }
    store.set(SELECTION_KEY, result.ids);
    this.setData({
      selected: result.ids,
      compareDisabled: result.ids.length < 2
    }, () => this.refresh());
  },

  detail(e) {
    wx.navigateTo({ url: `/pages/insect-detail/insect-detail?id=${e.currentTarget.dataset.id}` });
  },

  compare() {
    const { selected } = this.data;
    if (selected.length < 2) {
      wx.showToast({ title: '请先选择 2–3 种再对比', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/compare/compare?ids=${selected.join(',')}` });
  },

  danger() {
    wx.navigateTo({ url: '/pages/danger/danger?source=guidebook' });
  }
});
