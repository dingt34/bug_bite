const mock = require('../../utils/mock.js');
const planUtils = require('../../utils/plan.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    plan: null,
    rule: null,
    isOffline: false,
    offlineSaved: false
  },

  onLoad(options) {
    if (options.source === 'offline') {
      const card = wx.getStorageSync('offlineCard');
      if (planUtils.isValidOfflineCard(card)) {
        this.setData({
          plan: card.plan,
          rule: card.rule,
          isOffline: true,
          offlineSaved: true
        });
        return;
      }
      this.handleMissingPlan('离线安全卡不存在或已失效');
      return;
    }

    const planId = options.planId;
    const plans = wx.getStorageSync('plans') || [];
    const latest = wx.getStorageSync('latestPlan');
    const effectiveId = planId || (latest && latest.id);
    const plan = plans.find(item => item.id === effectiveId) || wx.getStorageSync('plan_' + effectiveId);
    if (plan) {
      const rule = plan.ruleSnapshot || mock.PRE_RULES.find(r => r.id === plan.ruleId) || mock.PRE_RULES[1];
      const offlineCard = wx.getStorageSync('offlineCard');
      this.setData({
        plan: plan,
        rule: rule,
        offlineSaved: planUtils.isValidOfflineCard(offlineCard) && offlineCard.plan.id === plan.id
      });
    } else {
      this.handleMissingPlan('未找到对应的行程计划');
    }
  },

  handleMissingPlan(message) {
    wx.showModal({
      title: '无法打开计划',
      content: message,
      showCancel: false,
      success: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  },

  saveOffline() {
    const card = planUtils.buildOfflineCard(this.data.plan, this.data.rule);
    wx.setStorageSync('offlineCard', card);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    this.setData({ offlineSaved: true });
    wx.showToast({ title: this.data.isOffline ? '安全卡已更新' : '已缓存安全卡', icon: 'success' });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
