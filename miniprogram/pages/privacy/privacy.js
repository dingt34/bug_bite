const privacy = require('../../utils/privacy.js');
const auth = require('../../utils/auth.js');
const cloudService = require('../../utils/cloud-service.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    summary: { plans: 0, events: 0, posts: 0, collections: 0, comments: 0, images: 0 },
    storageSize: 0,
    cleared: false,
    cloudUser: false,
    cloudConfigured: false,
    deletingCloud: false,
    cloudMessage: ''
  },

  onShow() {
    const info = wx.getStorageInfoSync();
    const user = auth.readLocalUser(wx);
    this.setData({
      summary: privacy.buildDataSummary(privacy.readSnapshot(wx)),
      storageSize: info.currentSize || 0,
      cloudUser: !!user && user.mode === 'wechat_cloud',
      cloudConfigured: cloudService.isConfigured()
    });
  },

  clearAllData() {
    wx.showModal({
      title: '清除全部本机数据',
      content: '将删除体验身份、行程计划、离线卡、事件与图片、社区发布和互动记录。删除后无法恢复。',
      confirmText: '全部清除',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        const snapshot = privacy.readSnapshot(wx);
        privacy.collectImagePaths(snapshot).forEach(path => {
          wx.removeSavedFile({ filePath: path, fail: () => {} });
        });
        const info = wx.getStorageInfoSync();
        privacy.resolveDataKeys(info.keys).forEach(key => wx.removeStorageSync(key));
        const app = getApp();
        app.globalData.userInfo = null;
        app.globalData.latestPlan = null;
        app.globalData.draftEvent = null;
        app.globalData.communityFilter = null;
        this.setData({ cleared: true });
        this.onShow();
        wx.showToast({ title: '本机数据已清除', icon: 'success' });
      }
    });
  },

  deleteCloudData() {
    if (this.data.deletingCloud) return;
    wx.showModal({
      title: '删除微信云端数据',
      content: '将删除当前微信身份的云端资料、备份数据和已上传图片。本机计划、事件和帖子仍会保留，但会退出云身份。',
      confirmText: '删除云端数据',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ deletingCloud: true, cloudMessage: '正在删除云端数据…' });
        cloudSync.deleteCloudAccount(wx).then(() => {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('cloudFileMap');
          const app = getApp();
          app.globalData.userInfo = null;
          app.globalData.cloudSyncStatus = 'idle';
          this.setData({ deletingCloud: false, cloudMessage: '云端数据已删除，当前设备已退出微信云身份。' });
          this.onShow();
          wx.showToast({ title: '云端数据已删除', icon: 'success' });
        }).catch(error => {
          this.setData({
            deletingCloud: false,
            cloudMessage: '删除失败：' + (error && error.message ? error.message : '请检查网络和云环境')
          });
        });
      }
    });
  }
});
