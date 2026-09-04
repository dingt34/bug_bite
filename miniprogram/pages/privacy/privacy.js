const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

const LOCAL_CACHE_KEYS = ['offlineCard', 'precheckDraft', 'safetyDraft', 'reviewDraft', 'postDraft', 'routeDraft'];

function uniqueCloudFiles(event) {
  const files = [];
  const append = value => (Array.isArray(value) ? value : []).forEach(file => {
    if (typeof file === 'string' && file.indexOf('cloud://') === 0 && files.indexOf(file) === -1) files.push(file);
  });
  append(event && event.imageFileIds);
  append(event && event.imageRefs);
  (event && event.reviews || []).forEach(review => {
    append(review.imageFileIds);
    append(review.imageRefs);
  });
  return files;
}

function removeCloudFiles(fileList) {
  if (!fileList.length || !wx.cloud || !wx.cloud.deleteFile) return Promise.resolve();
  return wx.cloud.deleteFile({ fileList }).catch(() => null);
}

function getCacheInfo() {
  const hasOfflineCard = !!store.get('offlineCard', null);
  const draftCount = LOCAL_CACHE_KEYS.slice(1).filter(key => !!store.get(key, null)).length;
  if (!hasOfflineCard && !draftCount) {
    return { hasData: false, summary: '暂未保存本机缓存', detail: '离线安全卡与未提交草稿' };
  }
  const parts = [];
  if (hasOfflineCard) parts.push('1 张离线安全卡');
  if (draftCount) parts.push(draftCount + ' 份未提交草稿');
  return { hasData: true, summary: parts.join('、'), detail: '仅保存在当前设备，可随时清除' };
}

Page({
  data: {
    cacheInfo: { hasData: false, summary: '正在检查本机缓存…', detail: '离线安全卡与未提交草稿' },
    eventDeleting: false,
    accountDeleting: false
  },
  onShow() { this.refreshCacheInfo(); },
  refreshCacheInfo() { this.setData({ cacheInfo: getCacheInfo() }); },
  back() { nav.back(); },
  clear() {
    const cacheInfo = getCacheInfo();
    if (!cacheInfo.hasData) { wx.showToast({ title: '没有可清除的本机缓存', icon: 'none' }); return; }
    wx.showModal({ title: '清除本机缓存', content: '将清除' + cacheInfo.summary + '，不影响已经同步到云端的数据。', confirmText: '清除', success: result => {
      if (!result.confirm) return;
      LOCAL_CACHE_KEYS.forEach(store.remove);
      this.refreshCacheInfo();
      wx.showToast({ title: '本机缓存已清除' });
    }});
  },
  deletePosts() { wx.navigateTo({ url: '/pages/privacy-social-delete/privacy-social-delete' }); },
  deleteEvent() {
    if (this.data.eventDeleting) return;
    const events = store.get('events', []);
    if (!events.length) { wx.showToast({ title: '暂无可删除事件', icon: 'none' }); return; }
    wx.showActionSheet({ itemList: events.map(item => (item.type || '未命名事件') + ' · ' + (item.createdAt || '')), success: choice => {
      const event = events[choice.tapIndex];
      wx.showModal({ title: '删除单条事件', content: '将删除“' + (event.type || '该事件') + '”及其图片和复查记录，删除后不可恢复。', confirmColor: '#ea4038', success: result => {
        if (!result.confirm) return;
        this.setData({ eventDeleting: true });
        cloud.call('deleteData', { action: 'event', clientId: event.id })
          .then(() => removeCloudFiles(uniqueCloudFiles(event)))
          .then(() => {
            store.set('events', events.filter(item => item.id !== event.id));
            wx.showToast({ title: '已删除' });
          })
          .catch(error => wx.showToast({ title: error.message || '云端删除失败，本机数据未变更', icon: 'none' }))
          .then(() => this.setData({ eventDeleting: false }));
      }});
    }});
  },
  deleteAccount() {
    if (this.data.accountDeleting) return;
    wx.showModal({ title: '永久删除账户？', content: '将永久删除账户、个人档案、行程、事件、复查记录、社群帖子、评论、互动及关联图片。', confirmText: '继续', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      wx.showModal({ title: '最后确认', content: '确认后将立即提交删除。云端数据删除成功后，会自动清除本机数据并退出当前账户。', confirmText: '永久删除', confirmColor: '#ea4038', success: finalResult => {
        if (!finalResult.confirm) return;
        this.setData({ accountDeleting: true });
        cloud.call('deleteData', { action: 'account' })
          .then(() => {
            wx.clearStorageSync();
            const app = getApp();
            if (app && app.globalData) app.globalData.user = null;
            wx.reLaunch({ url: '/pages/login/login' });
          })
          .catch(error => {
            wx.showToast({ title: error.message || '账户删除失败，本机数据未变更', icon: 'none' });
            this.setData({ accountDeleting: false });
          });
      }});
    }});
  }
});
