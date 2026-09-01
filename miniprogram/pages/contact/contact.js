const mock = require('../../utils/mock.js');

Page({
  data: {
    types: mock.CONTACT_TYPES,
    recommendedKey: '',
    recommendedName: '',
    selectedKey: ''
  },

  onLoad(options) {
    const app = getApp();
    const sourcePostId = options && options.fromPost || '';
    if (app && app.globalData) app.globalData.safetyReturnPostId = sourcePostId;
    const recommendedKey = options && options.recommended || '';
    const recommended = mock.CONTACT_TYPES.find(item => item.key === recommendedKey);
    const storedDraft = wx.getStorageSync ? wx.getStorageSync('contactDraft') : null;
    const existing = app && app.globalData
      ? (app.globalData.draftEvent || storedDraft)
      : storedDraft;
    if (existing && app && app.globalData && !app.globalData.draftEvent) {
      app.globalData.draftEvent = existing;
    }
    const selectedKey = existing && existing.contactType
      ? existing.contactType
      : (recommended ? recommended.key : '');
    if (recommended) {
      this.setData({ recommendedKey: recommended.key, recommendedName: recommended.name, selectedKey });
    } else if (selectedKey) {
      this.setData({ selectedKey });
    }
  },

  select(e) {
    const key = e.currentTarget.dataset.key;
    // 新建事件草稿，存入全局，供后续页面使用
    const app = getApp();
    const timestamp = Date.now();
    const existing = app.globalData.draftEvent || {};
    app.globalData.draftEvent = Object.assign({}, existing, {
      id: existing.id || 'event_' + timestamp,
      contactType: key,
      contactTypeName: mock.CONTACT_TYPES.find(t => t.key === key).name,
      createdAt: existing.createdAt || '刚刚',
      createdAtTimestamp: existing.createdAtTimestamp || timestamp
    });
    this.setData({ selectedKey: key });
    if (wx.setStorageSync) wx.setStorageSync('contactDraft', app.globalData.draftEvent);
  },

  continueToGuide() {
    const key = this.data.selectedKey;
    if (!key) {
      wx.showToast({ title: '请选择一种接触类型', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/guide/guide?contactType=' + key });
  },

  onStepChange(e) {
    const target = Number(e.detail.step);
    if (target === 1) wx.navigateBack({ delta: 1 });
  }
});
