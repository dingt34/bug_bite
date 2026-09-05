const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const store = require('../../utils/store.js');
const privacy = require('../../utils/privacy.js');
const cloudService = require('../../utils/cloud-service.js');
const cloudSync = require('../../utils/cloud-sync.js');
const communityCloud = require('../../utils/community-cloud.js');
const tabBar = require('../../utils/tab-bar.js');

function readProfile() {
  const identity = auth.readLocalUser(wx);
  if (identity) return identity;
  const profile = store.get('user', null);
  if (!profile || !profile.nickname) return null;
  return {
    id: 'local_profile_user',
    displayName: profile.nickname,
    avatarText: String(profile.nickname).slice(0, 1),
    avatarUrl: profile.avatar || '',
    region: profile.region || '',
    mode: 'profile_local'
  };
}

function decorateEvent(event) {
  const level = mock.RISK_LEVELS[event.riskLevel] || {};
  return Object.assign({}, event, {
    contactTypeName: event.contactTypeName || event.type || event.summary || '接触记录',
    occurredAt: event.occurredAt || event.createdAt || '时间待补充',
    levelName: event.levelName || level.name || '已记录'
  });
}

Page({
  data: {
    displayName: '点击登录',
    avatarText: '登',
    avatarUrl: '',
    avatarLoadFailed: false,
    loginTip: '未登录 · 登录后可同步与管理个人记录',
    loggedIn: false,
    cloudUser: false,
    cloudConfigured: false,
    syncing: false,
    syncMessage: '',
    summary: { plans: 0, events: 0, posts: 0, collections: 0, comments: 0 },
    latestPlan: null,
    latestEvent: null,
    events: [],
    aiNoteCount: 0
  },

  onShow() {
    tabBar.syncSelected(this, 4);
    const userInfo = readProfile();
    const storedAvatarUrl = userInfo && userInfo.avatarUrl ? userInfo.avatarUrl : '';
    const avatarNeedsResolve = storedAvatarUrl.indexOf('cloud://') === 0;
    const avatarResolveToken = (this.avatarResolveToken || 0) + 1;
    this.avatarResolveToken = avatarResolveToken;
    const app = getApp();
    const plans = wx.getStorageSync('plans') || [];
    const latestPlan = wx.getStorageSync('latestPlan') || app.globalData.latestPlan || plans[0] || null;
    const events = (wx.getStorageSync('events') || [])
      .map(decorateEvent)
      .sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
    const summary = privacy.buildDataSummary(
      privacy.readSnapshot(wx),
      communityCloud.readCachedStats(wx)
    );
    const isCloudUser = !!userInfo && userInfo.mode === 'wechat_cloud';
    const region = userInfo && userInfo.region ? userInfo.region : '';

    this.setData({
      displayName: userInfo ? userInfo.displayName : '点击登录',
      avatarText: userInfo ? userInfo.avatarText : '登',
      avatarUrl: avatarNeedsResolve ? '' : storedAvatarUrl,
      avatarLoadFailed: false,
      loginTip: userInfo
        ? (isCloudUser ? '微信云身份 · 支持跨设备同步' : (region ? region + ' · 数据保存在本机' : '本地体验身份 · 数据保存在本机'))
        : '未登录 · 登录后可同步与管理个人记录',
      loggedIn: !!userInfo,
      cloudUser: isCloudUser,
      cloudConfigured: cloudService.isConfigured(),
      summary,
      latestPlan,
      latestEvent: events[0] || null,
      events: events.slice(0, 3),
      aiNoteCount: (wx.getStorageSync('aiNotes') || []).length
    });

    if (storedAvatarUrl) {
      cloudService.resolveFileURL(wx, storedAvatarUrl).then(avatarUrl => {
        if (this.avatarResolveToken !== avatarResolveToken) return;
        this.setData({ avatarUrl, avatarLoadFailed: !avatarUrl });
      });
    }

    if (isCloudUser) {
      communityCloud.getStats(wx).then(stats => {
        this.setData({ summary: Object.assign({}, this.data.summary, stats) });
      }).catch(() => {});
    }
  },

  goLogin() {
    if (!readProfile()) wx.navigateTo({ url: '/pages/login/login' });
  },

  onAvatarError() {
    this.setData({ avatarLoadFailed: true });
  },

  goPlans() {
    wx.navigateTo({ url: '/pages/my-plans/my-plans' });
  },

  goEvents() {
    wx.navigateTo({ url: '/pages/my-events/my-events' });
  },

  goCommunity() {
    getApp().globalData.communityFilter = 'mine';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goComments() {
    getApp().globalData.communityFilter = 'commented';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goCollections() {
    getApp().globalData.communityFilter = 'collected';
    wx.switchTab({ url: '/pages/community/community' });
  },

  goAiNotes() {
    wx.navigateTo({ url: '/pages/ai-notes/ai-notes' });
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
      title: '退出当前身份',
      content: this.data.cloudUser
        ? '只退出当前设备的微信云身份；本机数据和云端备份仍会保留。'
        : '只会移除本地体验身份，计划、事件和社区内容仍会保留。',
      confirmText: '退出身份',
      success: result => {
        if (!result.confirm) return;
        wx.removeStorageSync('userInfo');
        getApp().globalData.userInfo = null;
        this.onShow();
        wx.showToast({ title: '已退出当前身份', icon: 'success' });
      }
    });
  }
});
