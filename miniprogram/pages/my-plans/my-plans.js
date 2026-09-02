// pages/my-plans/my-plans.js
const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: {
    // 所有计划
    plans: [],
    // 过滤后的计划
    filteredPlans: [],
    // 即将出发的计划（最近的一个）
    upcomingPlan: null,
    // Tab 选项
    tabs: ['近期', '历史', '草稿'],
    // 当前选中的 Tab
    tab: '近期',
    // 离线安全卡
    safetyCardCount: 0,
    safetyCardUpdate: '',
    // 删除弹窗
    showDeleteModal: false,
    deleteTarget: null
  },

  onShow() {
    this.loadData();
  },

  // ===== 数据加载 =====
  loadData() {
    // 从 store 读取计划列表
    const plans = store.get('plans', []);
    
    // 按时间排序（最近的在前面）
    const sortedPlans = this.sortPlans(plans);
    
    // 处理每个计划的额外字段
    const processedPlans = sortedPlans.map(plan => ({
      ...plan,
      // 计算清单完成度
      completeRate: this.calculateCompleteRate(plan),
      // 计算剩余天数
      daysLeft: this.calculateDaysLeft(plan),
      // 确保有标签
      tags: plan.tags || this.getDefaultTags(plan)
    }));

    this.setData({ 
      plans: processedPlans 
    });
    
    // 根据当前 Tab 过滤
    this.filterPlans();
    
    // 加载离线安全卡信息
    this.loadSafetyCardInfo();
  },

  // 按时间排序（日期最近的在前）
  sortPlans(plans) {
    return plans.sort((a, b) => {
      const dateA = new Date(a.startDate || a.date || '1970-01-01');
      const dateB = new Date(b.startDate || b.date || '1970-01-01');
      return dateB - dateA;
    });
  },

  // 计算清单完成度
  calculateCompleteRate(plan) {
    if (!plan.checklist || plan.checklist.length === 0) return 0;
    const done = plan.checklist.filter(item => item.done).length;
    return Math.round((done / plan.checklist.length) * 100);
  },

  // 计算剩余天数
  calculateDaysLeft(plan) {
    if (!plan.startDate) return '即将出发';
    const now = new Date();
    const start = new Date(plan.startDate);
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '已出发';
    if (diff === 0) return '今天出发';
    if (diff === 1) return '明天出发';
    return `还有 ${diff} 天`;
  },

  // 获取默认标签
  getDefaultTags(plan) {
    const tags = [];
    if (plan.environment) tags.push(plan.environment);
    if (plan.difficulty) tags.push(plan.difficulty);
    if (tags.length === 0) tags.push('户外出行');
    return tags;
  },

  // 加载离线安全卡信息
  loadSafetyCardInfo() {
    const cards = store.get('safetyCards', []);
    this.setData({
      safetyCardCount: cards.length,
      safetyCardUpdate: cards.length > 0 ? '今天 09:20' : '暂无'
    });
  },

  // ===== Tab 切换 =====
  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    this.filterPlans();
  },

  // ===== 过滤计划 =====
  filterPlans() {
    const { plans, tab } = this.data;
    let filtered = [];
    let upcoming = null;

    const now = new Date();

    if (tab === '近期') {
      // 近期：未出发且日期在30天内的
      filtered = plans.filter(p => {
        if (p.status === '已完成' || p.status === '草稿') return false;
        const start = new Date(p.startDate || p.date || '2099-01-01');
        const diff = (start - now) / (1000 * 60 * 60 * 24);
        return diff > -1 && diff < 31;
      });
    } else if (tab === '历史') {
      // 历史：已出发或已完成
      filtered = plans.filter(p => {
        const start = new Date(p.startDate || p.date || '1970-01-01');
        return p.status === '已完成' || start < now;
      });
    } else if (tab === '草稿') {
      // 草稿
      filtered = plans.filter(p => p.status === '草稿');
    }

    // 取最近的一个作为"即将出发"
    if (filtered.length > 0 && tab === '近期') {
      upcoming = filtered[0];
      // 从列表中移除，避免重复显示
      filtered = filtered.slice(1);
    }

    this.setData({
      filteredPlans: filtered,
      upcomingPlan: upcoming
    });
  },

  // ===== 页面跳转 =====
  // 返回
  back() {
    nav.back();
  },

  // 打开计划详情
  openPlan(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      // 如果没有 id，尝试从 upcomingPlan 获取
      const { upcomingPlan } = this.data;
      if (upcomingPlan && upcomingPlan.id) {
        wx.navigateTo({
          url: `/pages/precheck-result/precheck-result?id=${upcomingPlan.id}`
        });
      }
      return;
    }
    wx.navigateTo({
      url: `/pages/precheck-result/precheck-result?id=${id}`
    });
  },

  // 新建行前计划
  create() {
    wx.navigateTo({
      url: '/pages/precheck/precheck'
    });
  },

  // 打开离线安全卡
  openSafetyCard() {
    const cards = store.get('safetyCards', []);
    if (cards.length === 0) {
      wx.showToast({
        title: '暂无离线安全卡',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/safety-card/safety-card'
    });
  },

  // ===== 删除功能 =====
  // 确认删除（弹出二次确认）
  confirmDelete(e) {
    const id = e.currentTarget.dataset.id;
    const plan = this.data.plans.find(p => p.id === id);
    if (!plan) return;

    this.setData({
      showDeleteModal: true,
      deleteTarget: plan
    });
  },

  // 关闭删除弹窗
  closeDeleteModal() {
    this.setData({
      showDeleteModal: false,
      deleteTarget: null
    });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 执行删除
  doDelete() {
    const { deleteTarget, plans } = this.data;
    if (!deleteTarget) return;

    // 从列表中移除
    const newPlans = plans.filter(p => p.id !== deleteTarget.id);
    
    // 保存到 store
    store.set('plans', newPlans);
    
    // 关闭弹窗
    this.setData({
      showDeleteModal: false,
      deleteTarget: null
    });

    // 重新加载数据
    this.loadData();

    wx.showToast({
      title: '已删除',
      icon: 'success'
    });
  },

  // ===== 下拉刷新 =====
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});