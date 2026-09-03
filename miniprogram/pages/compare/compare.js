const nav = require('../../utils/nav');
const store = require('../../utils/store');
const species = require('../../utils/species');

const SELECTION_KEY = 'compare_selection';

Page({
  data: {
    ids: [],
    species: [],
    rows: [],
    headStyle: '',
    tableStyle: ''
  },

  onLoad(query) {
    const fromQuery = (query.ids || '').split(',').filter(Boolean);
    const ids = fromQuery.length ? fromQuery : store.get(SELECTION_KEY, []);
    this.apply(ids);
  },

  // 列数跟着实际选中的虫种走：选 2 种就是 2 列，不再固定 3 列
  apply(ids) {
    const view = species.buildCompare(ids);
    const count = view.species.length;
    this.setData({
      ids: view.species.map(item => item.id),
      species: view.species,
      rows: count ? view.rows : [],
      headStyle: `grid-template-columns:repeat(${count || 1},1fr)`,
      tableStyle: `grid-template-columns:104rpx repeat(${count || 1},1fr)`
    });
  },

  clear() {
    if (!this.data.ids.length) return;
    store.set(SELECTION_KEY, []);
    this.apply([]);
    wx.showToast({ title: '已清空对比', icon: 'none' });
  },

  toGuidebook() {
    wx.navigateTo({ url: '/pages/guidebook/guidebook' });
  },

  back() {
    nav.back();
  },

  danger() {
    wx.navigateTo({ url: '/pages/danger/danger?source=compare' });
  }
});
