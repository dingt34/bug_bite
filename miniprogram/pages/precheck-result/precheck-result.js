const mock = require('../../utils/mock.js');

Page({
  data: {
    plan: null,
    rule: null
  },

  onLoad(options) {
    const planId = options.planId;
    const plan = wx.getStorageSync('plan_' + planId);
    if (plan) {
      const rule = mock.PRE_RULES.find(r => r.id === plan.ruleId) || mock.PRE_RULES[1];
      this.setData({ plan: plan, rule: rule });
    } else {
      // 兜底：展示演示计划
      const rule = mock.PRE_RULES[0];
      this.setData({
        plan: { regionCode: '丽水', month: '8月', activityType: '徒步露营', riskTags: rule.riskTags },
        rule: rule
      });
    }
  },

  saveOffline() {
    wx.setStorageSync('offlineCard', this.data.rule);
    wx.showToast({ title: '已缓存安全卡', icon: 'success' });
  }
});
