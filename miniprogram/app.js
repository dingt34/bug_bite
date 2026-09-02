const store = require('./utils/store');

App({
  globalData: {
    user: null,
    currentTab: 0,
    cloudReady: false
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
      this.globalData.cloudReady = true;
    }
    this.globalData.user = store.get('user', null);
    store.seed();
  }
});
