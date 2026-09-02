// pages/events/events.js
const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: {
    events: [],
    pendingEvents: [],
    historyEvents: [],
    filteredEvents: [],
    totalCount: 0,
    pendingCount: 0,
    tabs: ['待复查', '全部记录'],
    tab: '待复查',
    searchKeyword: '',
    filterLevel: 'all',
    showFilter: false,
    syncAllStatus: true
  },

  onShow() {
    this.loadData();
  },

  // ===== 数据加载 =====
  loadData() {
    let events = store.get('events', []);

    events = events.map(item => ({
      ...item,
      symptomsText: (item.symptoms || []).join('、'),
      synced: item.synced !== undefined ? item.synced : true,
      level: item.level || '待评估',
      status: item.status || (item.level === '高风险' ? '待复查' : '已处理')
    }));

    events.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || '1970-01-01');
      const dateB = new Date(b.createdAt || b.date || '1970-01-01');
      return dateB - dateA;
    });

    const pending = events.filter(e => e.status === '待复查');
    const history = events.filter(e => e.status !== '待复查');

    this.setData({
      events: events,
      pendingEvents: pending,
      historyEvents: history,
      totalCount: events.length,
      pendingCount: pending.length
    });

    this.filterEvents();
  },

  // ===== 过滤事件 =====
  filterEvents() {
    const { events, tab, searchKeyword, filterLevel } = this.data;
    let filtered = [...events];

    if (tab === '待复查') {
      filtered = filtered.filter(e => e.status === '待复查');
    }

    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter(e => {
        const type = (e.type || '').toLowerCase();
        const body = (e.body || '').toLowerCase();
        const place = (e.place || '').toLowerCase();
        const time = (e.createdAt || '').toLowerCase();
        return type.includes(keyword) || 
               body.includes(keyword) || 
               place.includes(keyword) || 
               time.includes(keyword);
      });
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(e => e.level === filterLevel);
    }

    const pending = filtered.filter(e => e.status === '待复查');
    const history = filtered.filter(e => e.status !== '待复查');

    this.setData({
      filteredEvents: filtered,
      pendingEvents: pending,
      historyEvents: history,
      pendingCount: pending.length
    });
  },

  // ===== Tab 切换 =====
  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    this.filterEvents();
  },

  // ===== 搜索 =====
  onSearchInput(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.filterEvents();
  },

  // ===== 筛选 =====
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  setFilter(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({ filterLevel: level });
    this.filterEvents();
  },

  resetFilter() {
    this.setData({ filterLevel: 'all' });
    this.filterEvents();
  },

  closeFilter() {
    this.setData({ showFilter: false });
  },

  stopPropagation() {},

  // ===== 页面跳转 =====
  back() {
    nav.back();
  },

  // 打开事件详情（仅跳转 event-detail，不导向社群或AI）
  open(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${id}`
    });
  },

  // 跳转到复查
  goToReview(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${id}&action=review`
    });
  },

  // 新建安全判断
  create() {
    wx.navigateTo({
      url: '/pages/danger/danger'
    });
  },

  // 回首页
  goHome() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  // ===== 同步功能 =====
  manualSync() {
    wx.showLoading({ title: '同步中...' });
    
    setTimeout(() => {
      wx.hideLoading();
      const events = this.data.events.map(e => ({
        ...e,
        synced: true
      }));
      store.set('events', events);
      
      this.setData({
        events: events,
        syncAllStatus: true
      });
      
      this.filterEvents();
      
      wx.showToast({
        title: '同步完成',
        icon: 'success'
      });
    }, 1000);
  },

  // ===== 下拉刷新 =====
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // ===== 分享配置 =====
  onShareAppMessage() {
    return {
      title: '我的接触事件记录',
      path: '/pages/events/events'
    };
  }
});