const planUtils = require('../../utils/plan.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    plans: [],
    offlineCard: null
  },

  onShow() {
    let plans = wx.getStorageSync('plans') || [];
    // 首次升级时，把旧版最近计划对应的完整记录迁移到计划列表。
    if (!plans.length) {
      const latest = wx.getStorageSync('latestPlan');
      const legacyPlan = latest && latest.id ? wx.getStorageSync('plan_' + latest.id) : null;
      if (legacyPlan) {
        plans = planUtils.upsertPlan([], legacyPlan);
        wx.setStorageSync('plans', plans);
      }
    }
    const offlineCard = wx.getStorageSync('offlineCard');
    this.setData({
      plans: planUtils.sortPlans(plans),
      offlineCard: planUtils.isValidOfflineCard(offlineCard) ? offlineCard : null
    });
  },

  viewPlan(e) {
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result?planId=' + e.currentTarget.dataset.id });
  },

  viewOfflineCard() {
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result?source=offline' });
  },

  createPlan() {
    wx.navigateTo({ url: '/pages/precheck/precheck' });
  },

  deletePlan(e) {
    const planId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除行程计划',
      content: '删除后无法恢复，但不会自动删除已经缓存的离线安全卡。',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: (res) => {
        if (!res.confirm) return;
        const plans = planUtils.removePlan(wx.getStorageSync('plans') || [], planId);
        wx.setStorageSync('plans', plans);
        const tombstones = wx.getStorageSync('cloudTombstones') || {};
        tombstones.plans = Object.assign({}, tombstones.plans || {}, { [planId]: Date.now() });
        wx.setStorageSync('cloudTombstones', tombstones);
        wx.removeStorageSync('plan_' + planId);
        const latest = plans.length ? planUtils.toLatestPlan(plans[0]) : null;
        getApp().globalData.latestPlan = latest;
        if (latest) {
          wx.setStorageSync('latestPlan', latest);
        } else {
          wx.removeStorageSync('latestPlan');
        }
        this.setData({ plans: plans });
        cloudSync.queuePush(wx, getApp());
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    });
  },

  clearOfflineCard() {
    wx.showModal({
      title: '清除离线安全卡',
      content: '清除后，离线状态下将无法查看这份安全卡。',
      confirmText: '清除',
      confirmColor: '#E53935',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync('offlineCard');
        const tombstones = wx.getStorageSync('cloudTombstones') || {};
        tombstones.offlineCard = Date.now();
        wx.setStorageSync('cloudTombstones', tombstones);
        cloudSync.queuePush(wx, getApp());
        this.setData({ offlineCard: null });
        wx.showToast({ title: '已清除', icon: 'success' });
      }
    });
  }
});
