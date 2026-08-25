const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const privacy = require('../../utils/privacy.js');
const cloudService = require('../../utils/cloud-service.js');
const cloudSync = require('../../utils/cloud-sync.js');
const communityCloud = require('../../utils/community-cloud.js');
const tabBar = require('../../utils/tab-bar.js');

Page({
  data: {
    displayName: '点击登录',
    avatarText: '登',
    avatarUrl: '',
    avatarLoadFailed: false,
    loginTip: '未登录 · 点击登录',
    loggedIn: false,
    cloudUser: false,
    cloudConfigured: false,
    syncing: false,
    syncMessage: '',
    summary: { plans: 0, events: 0, posts: 0, collections: 0, comments: 0 },
    latestPlan: null,
    latestEvent: null,
    events: []
  },

  onShow() {
    tabBar.syncSelected(this, 2);
    const userInfo = auth.readLocalUser(wx);
    const avatarResolveToken = (this.avatarResolveToken || 0) + 1;
    this.avatarResolveToken = avatarResolveToken;
    const latestPlan = wx.getStorageSync('latestPlan') || getApp().globalData.latestPlan;
    let events = wx.getStorageSync('events') || [];
    // 补充风险等级中文名，供列表徽标显示
    events = events.map(function (ev) {
      const level = mock.RISK_LEVELS[ev.riskLevel] || {};
      return Object.assign({}, ev, { levelName: level.name || '' });
    });

    const summary = privacy.buildDataSummary(privacy.readSnapshot(wx), communityCloud.readCachedStats(wx));
    this.setData({
      displayName: userInfo ? userInfo.displayName : '点击登录',
      avatarText: userInfo ? userInfo.avatarText : '登',
      avatarUrl: userInfo ? userInfo.avatarUrl : '',
      avatarLoadFailed: false,
      loginTip: userInfo
        ? (userInfo.mode === 'wechat_cloud' ? '微信云身份 · 支持跨设备同步' : '本地体验身份 · 数据仅存本机')
        : '未登录 · 点击选择微信云登录或本地体验',
      loggedIn: !!userInfo,
      cloudUser: !!userInfo && userInfo.mode === 'wechat_cloud',
      cloudConfigured: cloudService.isConfigured(),
      summary,
      latestPlan: latestPlan,
      latestEvent: events.length ? events[0] : null,
      events: events.slice(0, 3)
    });
    if (userInfo && userInfo.avatarUrl) {
      cloudService.resolveFileURL(wx, userInfo.avatarUrl).then(avatarUrl => {
        if (this.avatarResolveToken !== avatarResolveToken) return;
        this.setData({ avatarUrl, avatarLoadFailed: false });
      });
    }
    if (userInfo && userInfo.mode === 'wechat_cloud') {
      communityCloud.getStats(wx).then(stats => {
        this.setData({ summary: Object.assign({}, this.data.summary, stats) });
      }).catch(() => {});
    }
  },

  goLogin() {
    if (!auth.readLocalUser(wx)) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  goPlans() {
    wx.navigateTo({ url: '/pages/my-plans/my-plans' });
  },

  onAvatarError() {
    this.setData({ avatarLoadFailed: true });
  },

  goEvents() {
    wx.navigateTo({ url: '/pages/my-events/my-events' });
  },

  goCommunity() {
    getApp().globalData.communityFilter = 'mine';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goCollections() {
    getApp().globalData.communityFilter = 'collected';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goComments() {
    getApp().globalData.communityFilter = 'commented';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  syncCloud() {
    if (this.data.syncing) return;
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ syncing: true, syncMessage: '正在合并云端数据…' });
    cloudSync.pullAndMerge(wx)
      .then(() => {
        this.setData({ syncMessage: '正在上传本机更新与图片…' });
        return cloudSync.pushNow(wx);
      })
      .then(() => {
        this.setData({ syncing: false, syncMessage: '最近同步：刚刚' });
        this.onShow();
        wx.showToast({ title: '云同步完成', icon: 'success' });
      })
      .catch(error => {
        this.setData({
          syncing: false,
          syncMessage: '同步失败：' + (error && error.message ? error.message : '请检查网络')
        });
      });
  },

  logout() {
    wx.showModal({
      title: '退出体验身份',
      content: this.data.cloudUser
        ? '只退出当前设备的微信云身份；本机数据和云端备份仍会保留。'
        : '只会移除本地体验昵称，计划、事件和社区内容仍会保留。',
      confirmText: '退出身份',
      success: result => {
        if (!result.confirm) return;
        wx.removeStorageSync('userInfo');
        getApp().globalData.userInfo = null;
        this.onShow();
        wx.showToast({ title: '已退出体验身份', icon: 'success' });
      }
    });
  },

  goEventDetail(e) {
    wx.navigateTo({ url: '/pages/event-detail/event-detail?id=' + e.currentTarget.dataset.id });
  }
});
