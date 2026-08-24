// app.js
const auth = require('./utils/auth.js');
const cloudService = require('./utils/cloud-service.js');

App({
  globalData: {
    // 本地体验用户；未创建体验身份时为 null。
    userInfo: null,
    // 当前待编辑的事件草稿（跨页面传递）
    draftEvent: null,
    // 最近一条由用户创建的计划
    latestPlan: null,
    // 跨 tab 页的一次性社区筛选意图
    communityFilter: null,
    cloudAvailable: false,
    cloudSyncStatus: 'idle'
  },

  onLaunch() {
    const cloudStatus = cloudService.init(wx);
    this.globalData.cloudAvailable = cloudStatus.available;
    this.globalData.userInfo = auth.readLocalUser(wx);
    const plan = wx.getStorageSync('latestPlan');
    if (plan) {
      this.globalData.latestPlan = plan;
    }
  }
});
