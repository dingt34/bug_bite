const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const records = require('../../utils/event-records');

function decorate(event, now = Date.now()) {
  let icon = '/assets/figma/all/s13-img3.svg';
  if (event.contactType === 'sting' || event.type.indexOf('蜂') >= 0) {
    icon = '/assets/figma/all/s13-img2.svg';
  } else if (event.contactType === 'attachment' || event.type.indexOf('附着虫体') >= 0) {
    icon = '/assets/figma/s05-imgIconGeneratedIllustrated2.svg';
  } else if (event.contactType === 'contact' || event.type.indexOf('接触后皮疹') >= 0 || event.type.indexOf('接触或刺激') >= 0) {
    icon = '/assets/figma/s05-imgIconGeneratedIllustrated3.svg';
  } else if (event.contactType === 'unknown' || event.type.indexOf('不确定') >= 0) {
    icon = '/assets/figma/all/s13-img1.svg';
  }
  const dueIn = Number(event.nextReviewAtTimestamp) - now;
  let reviewStateText = '待复查';
  let reviewStateClass = 'review-waiting';
  if (dueIn <= 0) { reviewStateText = '已到复查时间'; reviewStateClass = 'review-overdue'; }
  else if (dueIn <= 30 * 60000) { reviewStateText = '即将复查'; reviewStateClass = 'review-soon'; }
  return Object.assign({}, event, {
    icon,
    eventMeta: [event.createdAt, event.body, event.place].filter(value => value && value !== '待补充').join(' · '),
    reviewStateText,
    reviewStateClass,
    levelClass: event.riskLevel === 'consult' ? 'level-consult' : event.riskLevel === 'emergency' ? 'level-emergency' : 'level-observe',
    statusText: event.status === '待复查' ? reviewStateText : event.status,
    statusClass: event.status === '待复查' ? reviewStateClass : (event.riskLevel === 'emergency' ? 'level-emergency' : 'level-observe'),
    detailText: [event.symptomsText, event.trend].filter(Boolean).join(' · '),
    footerText: event.status === '待复查' ? '计划于 ' + event.reviewAt + ' 复查' : event.status === '待求助' ? '请尽快获得专业帮助' : '本次事件已结束'
  });
}

function describeSyncError(error) {
  const code = String(error && (error.code || error.errCode) || '');
  const message = String(error && (error.message || error.errMsg) || '');
  const raw = `${code} ${message}`;
  if (raw.indexOf('-601034') >= 0 || /permission|没有权限|无权限/i.test(raw)) return '云环境未绑定，或当前账号没有该环境权限';
  if (/FUNCTION_NOT_FOUND|-501000|function not found/i.test(raw)) return 'userData 云函数尚未部署到当前环境';
  if (/DB_ERROR|collection|database/i.test(raw)) return '请检查 events 数据库集合及云函数日志';
  if (/CLOUD_TIMEOUT|timeout|超时/i.test(raw)) return '云端响应超时，请检查网络后重试';
  if (/CLOUD_UNAVAILABLE/i.test(raw)) return '当前项目尚未连接云开发环境';
  return message || code || '未知云端错误，请查看云函数日志';
}

Page({
  data: {
    events: [], allEvents: [], pendingEvents: [], visibleEvents: [], tab: 'pending', query: '',
    listTitle: '需要复查', emptyTitle: '当前没有待复查事件', emptyDetail: '历史结果仍会保留，可切换到“全部记录”查看',
    riskFilter: 'all', filterLabel: '筛选', syncing: false, syncState: 'idle',
    syncText: '所有记录已同步', syncDetail: '本机记录始终保留'
  },

  onShow() { this.loadEvents(); },

  loadEvents() {
    const now = Date.now();
    const events = store.withoutDemoEvents(store.get('events', [])).map(item => records.normalizeEvent(item, now));
    store.set('events', events);
    this.setData({ events });
    this.applyFilters();
  },

  applyFilters() {
    const now = Date.now();
    const filtered = this.data.events.filter(item => {
      const riskMatches = this.data.riskFilter === 'all' || item.riskLevel === this.data.riskFilter;
      return riskMatches && records.matches(item, this.data.query);
    }).map(item => decorate(item, now)).sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    const pendingEvents = filtered.filter(item => item.status === '待复查').sort((a, b) => a.nextReviewAtTimestamp - b.nextReviewAtTimestamp);
    const isPendingTab = this.data.tab === 'pending';
    const visibleEvents = isPendingTab ? pendingEvents : filtered;
    const pendingSync = this.data.events.some(item => item.syncStatus !== '已同步');
    const stateLocked = this.data.syncState === 'error' || this.data.syncState === 'syncing';
    const syncState = stateLocked ? this.data.syncState : (pendingSync ? 'idle' : 'success');
    const syncText = stateLocked
      ? this.data.syncText
      : (pendingSync ? '有记录等待同步' : '所有记录已同步');
    this.setData({
      allEvents: filtered,
      pendingEvents,
      visibleEvents,
      listTitle: isPendingTab ? '需要复查' : '全部记录',
      emptyTitle: isPendingTab ? '当前没有待复查事件' : '暂无符合条件的事件记录',
      emptyDetail: isPendingTab ? '历史结果仍会保留，可切换到“全部记录”查看' : '可调整搜索关键词或风险筛选条件',
      syncState,
      syncText
    });
  },

  back() { nav.back(); },
  setTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }, () => this.applyFilters()); },
  onSearch(e) { this.setData({ query: e.detail.value || '' }); this.applyFilters(); },

  chooseFilter() {
    const options = [
      { label: '全部风险等级', value: 'all' }, { label: '紧急求助', value: 'emergency' },
      { label: '尽快咨询', value: 'consult' }, { label: '观察记录', value: 'observe' }
    ];
    wx.showActionSheet({
      itemList: options.map(item => item.label),
      success: result => {
        const selected = options[result.tapIndex];
        this.setData({ riskFilter: selected.value, filterLabel: selected.value === 'all' ? '筛选' : selected.label });
        this.applyFilters();
      }
    });
  },

  open(e) { wx.navigateTo({ url: `/pages/event-detail/event-detail?id=${e.currentTarget.dataset.id}` }); },
  create() { wx.navigateTo({ url: '/pages/danger/danger?source=events' }); },

  syncAll() {
    if (this.data.syncing) return;
    if (!cloud.available()) {
      this.setData({ syncState: 'error', syncText: '同步失败', syncDetail: '请稍后再次重试' });
      wx.showToast({ title: '同步失败，请稍后重试', icon: 'none' });
      return;
    }
    const targets = this.data.events.filter(event => event.syncStatus !== '已同步');
    if (!targets.length) {
      this.setData({ syncState: 'success', syncText: '所有记录已同步', syncDetail: '无需重复上传，本机与云端状态一致' });
      wx.showToast({ title: '已是最新状态', icon: 'success' });
      return;
    }
    this.setData({ syncing: true, syncState: 'syncing', syncText: `正在同步 ${targets.length} 条记录…`, syncDetail: '正在逐条上传，请暂时不要关闭页面' });
    const tasks = targets.map(event => Promise.resolve().then(() => cloud.call('userData', {
      action: 'upsert', type: 'event', clientId: event.id, record: records.toCloudRecord(event)
    })).then(() => ({ ok: true, id: event.id })).catch(error => ({ ok: false, id: event.id, error })));
    Promise.all(tasks).then(results => {
      const succeeded = results.filter(item => item.ok);
      const failed = results.filter(item => !item.ok);
      const successIds = succeeded.map(item => item.id);
      const failedMap = {};
      failed.forEach(item => { failedMap[item.id] = describeSyncError(item.error); });
      const events = this.data.events.map(item => {
        if (successIds.indexOf(item.id) >= 0) return Object.assign({}, item, { syncStatus: '已同步', syncError: '' });
        if (failedMap[item.id]) return Object.assign({}, item, { syncStatus: '待同步', syncError: failedMap[item.id] });
        return item;
      });
      store.set('events', events);
      if (failed.length) {
        this.setData({
          events,
          syncState: 'error',
          syncText: succeeded.length ? `已同步 ${succeeded.length} 条，失败 ${failed.length} 条` : '同步失败',
          syncDetail: '请稍后再次重试'
        });
        wx.showToast({ title: '部分记录同步失败', icon: 'none' });
      } else {
        this.setData({ events, syncState: 'success', syncText: `已成功同步 ${succeeded.length} 条记录`, syncDetail: '本机与云端记录状态一致' });
        wx.showToast({ title: '同步完成', icon: 'success' });
      }
      this.applyFilters();
    }).then(() => this.setData({ syncing: false }));
  }
});
