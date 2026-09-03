const cloud = require('../../utils/cloud.js');
const nav = require('../../utils/nav.js');

Page({
  data: { reports: [], loading: true, error: '' },
  onShow() { this.load(); },
  load() {
    this.setData({ loading: true, error: '' });
    cloud.call('community', { action: 'listReports' }).then(result => {
      this.setData({ reports: (result && result.reports) || [] });
    }).catch(error => this.setData({ error: error.message || '暂无权限或举报数据' })).then(() => this.setData({ loading: false }));
  },
  back() { nav.back(); },
  review(e) {
    const reportId = e.currentTarget.dataset.id; const decision = e.currentTarget.dataset.decision;
    wx.showModal({ title: decision === 'delete' ? '确认删除被举报内容？' : '驳回这条举报？', content: decision === 'delete' ? '删除后会通知举报人。' : '保留原内容并通知举报人。', confirmColor: decision === 'delete' ? '#ea4038' : '#2f875f', success: result => {
      if (!result.confirm) return;
      cloud.call('community', { action: 'reviewReport', reportId, decision }).then(() => { wx.showToast({ title: decision === 'delete' ? '已删除并通知' : '已驳回并通知', icon: 'none' }); this.load(); }).catch(error => wx.showToast({ title: error.message || '处理失败', icon: 'none' }));
    }});
  }
});
