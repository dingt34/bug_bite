const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  back() { nav.back(); },
  clear() {
    wx.showModal({ title: '清除本机缓存', content: '将删除离线安全卡和未提交草稿，不影响已同步数据。', success: result => {
      if (!result.confirm) return;
      ['precheckDraft', 'safetyDraft', 'reviewDraft', 'postDraft', 'routeDraft'].forEach(store.remove);
      wx.showToast({ title: '已清除' });
    }});
  },
  manageCloud() {
    wx.showActionSheet({ itemList: ['查看我的行程', '查看我的事件'], success: result => {
      wx.navigateTo({ url: result.tapIndex === 0 ? '/pages/my-plans/my-plans' : '/pages/events/events' });
    }});
  },
  viewCommunity() { wx.switchTab({ url: '/pages/community/community' }); },
  explainAi() { wx.showModal({ title: 'AI 临时数据', content: '本次对话中主动添加的附件仅用于当前会话，到期后会自动清理，不会进入个人健康档案。', showCancel: false }); },
  routePrivacy() { wx.showModal({ title: '路线公开规则', content: '发布经历时，完整路线默认不公开。只有你主动开启“公开完整轨迹”后，帖子读者才能查看精确路线。', showCancel: false }); },
  deletePosts() { wx.navigateTo({ url: '/pages/privacy-social-delete/privacy-social-delete' }); },
  deleteEvent() {
    const events = store.get('events', []);
    if (!events.length) { wx.showToast({ title: '暂无可删除事件', icon: 'none' }); return; }
    wx.showActionSheet({ itemList: events.map(item => (item.type || '未命名事件') + ' · ' + (item.createdAt || '')), success: choice => {
      const event = events[choice.tapIndex];
      wx.showModal({ title: '删除单条事件', content: '将删除“' + (event.type || '该事件') + '”及其图片和复查记录，删除后不可恢复。', confirmColor: '#ea4038', success: result => {
        if (!result.confirm) return;
        store.set('events', events.filter(item => item.id !== event.id));
        wx.showToast({ title: '已删除' });
      }});
    }});
  },
  deleteAccount() {
    wx.showModal({ title: '注销并删除账户', content: '此操作不可撤销，将删除个人档案、计划、事件和社群内容。', confirmText: '再次确认', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      wx.showModal({ title: '最后确认', content: '确定永久删除全部个人数据吗？', confirmText: '永久删除', confirmColor: '#ea4038', success: finalResult => {
        if (finalResult.confirm) { wx.clearStorageSync(); wx.reLaunch({ url: '/pages/login/login' }); }
      }});
    }});
  }
});
