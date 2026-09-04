const store = require('./utils/store');
const { ENV_ID } = require('./config/cloud');

App({
  globalData: {
    user: null,
    currentTab: 0,
    cloudReady: false
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: ENV_ID, traceUser: true });
      this.globalData.cloudReady = true;
    }
    this.globalData.user = store.get('user', null);
    store.seed();
  }
});
