const nav = require('../../utils/nav.js');

const DEMO_REPORTS = [
  { _id: 'demo-post-1', targetType: 'post', status: 'pending', target: { title: '去而发生女孩子预热色戒你们的性命你好急' }, reason: '111', createdAt: '2026-09-03 02:07' },
  { _id: 'demo-comment-1', targetType: 'comment', status: 'pending', target: { text: '我去额为沟通和姐夫' }, reason: '侵犯隐私', createdAt: '2026-09-03 01:54' }
];

Page({
  data: { reports: DEMO_REPORTS, loading: false, error: '' },
  onShow() { this.load(); },
  load() { this.setData({ reports: DEMO_REPORTS, loading: false, error: '' }); },
  back() { nav.back(); },
  review(e) {
    const reportId = e.currentTarget.dataset.id; const decision = e.currentTarget.dataset.decision;
    wx.showModal({ title: decision === 'delete' ? '确认删除被举报内容？' : '驳回这条举报？', content: decision === 'delete' ? '删除后会通知举报人。' : '保留原内容并通知举报人。', confirmColor: decision === 'delete' ? '#ea4038' : '#2f875f', success: result => {
      if (!result.confirm) return;
      wx.showToast({ title: '演示数据暂不处理', icon: 'none' });
    }});
  }
});
