Page({
  data: {
    plans: []
  },

  onShow() {
    const latest = wx.getStorageSync('latestPlan');
    const plans = [];
    if (latest) {
      plans.push(Object.assign({}, latest, { status: '进行中' }));
    } else {
      plans.push({
        id: 'plan_demo_001',
        destinationName: '丽水 · 白云山',
        month: '8月',
        activityType: '徒步露营',
        riskTags: ['草丛', '林地', '夜间活动'],
        status: '示例'
      });
    }
    this.setData({ plans: plans });
  },

  viewPlan() {
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result' });
  }
});
