// pages/my-plans/my-plans.js
const store = require('../../utils/store.js');
const { formatDate, formatDateForDisplay } = require('../../utils/format.js');

Page({
  data: {
    tab: '草稿', // 默认显示草稿页
    tabs: ['草稿', '历史'],
    upcomingDraft: null, // 即将出发的草稿
    otherDrafts: [], // 其他草稿计划
    historyPlans: [], // 历史行程
    draftPlans: [] // 所有草稿计划（包含upcomingDraft和otherDrafts）
  },

  // 页面显示时加载数据
  onShow() {
    this.loadPlans();
  },

  // 加载行程数据
  loadPlans() {
    const plans = store.get('plans', []);
    
    // 获取今天的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // 根据日期分类
    const draftPlans = [];
    const historyPlans = [];
    
    plans.forEach(plan => {
      // 获取行程的日期值
      const dateValue = plan.dateValue || plan.date;
      
      if (dateValue) {
        // 如果有日期，比较日期
        if (dateValue < todayStr) {
          // 过去日期 → 历史页
          historyPlans.push(plan);
        } else {
          // 未来日期 → 草稿页
          draftPlans.push(plan);
        }
      } else {
        // 没有日期 → 草稿页
        draftPlans.push(plan);
      }
    });
    
    // 对草稿行程进一步分类
    let upcomingDraft = null;
    const otherDrafts = [];
    
    // 如果有草稿行程，找到最早的那个作为"即将出发的草稿"
    if (draftPlans.length > 0) {
      // 首先尝试找到有日期的行程
      const datedDrafts = draftPlans.filter(p => p.dateValue);
      if (datedDrafts.length > 0) {
        // 按日期排序，找到最早的
        datedDrafts.sort((a, b) => a.dateValue.localeCompare(b.dateValue));
        upcomingDraft = datedDrafts[0];
        
        // 其他草稿
        otherDrafts.push(...draftPlans.filter(p => p.id !== upcomingDraft.id));
      } else {
        // 如果没有日期，第一个作为upcomingDraft
        upcomingDraft = draftPlans[0];
        otherDrafts.push(...draftPlans.slice(1));
      }
    }
    
    this.setData({
      historyPlans,
      draftPlans,
      upcomingDraft,
      otherDrafts
    });
  },

  // 设置当前选项卡
  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
  },

  // 打开行程详情
  open(e) {
    const id = e.currentTarget.dataset.id;
    const { tab } = this.data;
    
    if (tab === '历史') {
      // 历史页 → 跳转到只读的行前清单结果页面
      wx.navigateTo({
        url: `/pages/precheck-result/precheck-result?id=${id}&readonly=true`
      });
    } else {
      // 草稿页 → 跳转到可编辑的行前清单页面
      wx.navigateTo({
        url: `/pages/precheck/precheck?id=${id}`
      });
    }
  },

  // 创建新行程
  create() {
    // 清除可能存在的临时草稿数据，确保新建行程从空白开始
    store.remove('precheckDraft');
    
    wx.navigateTo({
      url: '/pages/precheck/precheck?new=true'
    });
  },

  // 删除行程
  deletePlan(e) {
    const id = e.currentTarget.dataset.id;
    
    // 阻止事件冒泡，防止触发open函数
    e.stopPropagation();
    
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这个行程吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          // 获取所有行程
          const plans = store.get('plans', []);
          
          // 过滤掉要删除的行程
          const newPlans = plans.filter(plan => plan.id !== id);
          
          // 保存更新后的行程列表
          store.set('plans', newPlans);
          
          // 重新加载数据
          this.loadPlans();
          
          wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 返回上一页
  back() {
    wx.navigateBack();
  }
});