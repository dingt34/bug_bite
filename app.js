// app.js
App({
  globalData: {
    // 登录用户（初稿用本地模拟，不接微信登录）
    userInfo: {
      nickName: '体验用户',
      displayName: '山野观察员'
    },
    // 当前待编辑的事件草稿（跨页面传递）
    draftEvent: null,
    // 最近一条计划
    latestPlan: {
      id: 'plan_demo_001',
      destinationName: '丽水 · 白云山',
      month: '8月',
      activityType: '徒步露营',
      riskTags: ['草丛', '林地', '夜间活动']
    }
  },

  onLaunch() {
    // 初稿：从本地缓存恢复最近计划，无需云开发
    const plan = wx.getStorageSync('latestPlan');
    if (plan) {
      this.globalData.latestPlan = plan;
    }
  }
});
