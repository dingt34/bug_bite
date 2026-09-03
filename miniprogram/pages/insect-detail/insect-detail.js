const nav = require('../../utils/nav');
const store = require('../../utils/store');
const species = require('../../utils/species');

const SELECTION_KEY = 'compare_selection';

Page({
  data: {
    id: '',
    name: '',
    latin: '',
    typeLabel: '',
    photo: '',
    photoCredit: '',
    features: [],
    environments: [],
    summary: '',
    compareClues: '',
    detailNote: '',
    inCompare: false
  },

  onLoad(query) {
    const item = species.getById(query.id);
    const selected = species.sanitize(store.get(SELECTION_KEY, []));
    this.setData({
      id: item.id,
      name: item.name,
      latin: item.latin,
      typeLabel: item.typeLabel,
      photo: item.photo,
      photoCredit: item.photoCredit,
      // 已整理过的虫种显示关键特征和环境标签；
      // 其余用知识库里的概述与对比要点，不留空页
      features: item.features || [],
      environments: item.environments || [],
      summary: item.summary,
      compareClues: item.compareClues,
      detailNote: item.detailNote,
      inCompare: selected.indexOf(item.id) >= 0
    });
    wx.setNavigationBarTitle({ title: item.name });
  },

  back() {
    nav.back();
  },

  // 加入 / 移出对比清单，选择会保存下来，返回图鉴时保持一致
  compare() {
    const current = species.sanitize(store.get(SELECTION_KEY, []));
    const result = species.toggle(current, this.data.id);
    if (!result.ok) {
      wx.showToast({ title: result.reason, icon: 'none' });
      return;
    }
    store.set(SELECTION_KEY, result.ids);
    const added = result.ids.indexOf(this.data.id) >= 0;
    this.setData({ inCompare: added });
    wx.showToast({ title: added ? '已加入对比' : '已移出对比', icon: 'none' });
  },

  // 直接查看对比结果；不足两种时先提示
  openCompare() {
    const selected = species.sanitize(store.get(SELECTION_KEY, []));
    if (selected.length < 2) {
      wx.showToast({ title: '再选一种才能对比', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/compare/compare?ids=${selected.join(',')}` });
  },

  danger() {
    wx.navigateTo({ url: '/pages/danger/danger?source=insect' });
  }
});
