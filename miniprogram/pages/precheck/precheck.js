const store = require('../../utils/store');
const nav = require('../../utils/nav');

function standardDate(value) {
  const direct = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (direct) return direct[0];
  const match = String(value || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : '';
}

function displayDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : value;
}

Page({
  data: {
    destination: '浙江省 · 丽水市',
    date: '',
    dateValue: '',
    minDate: '',
    activity: '徒步露营',
    environment: ['林地', '近水', '过夜'],
    environmentText: '林地 · 近水 · 过夜',
    route: null
  },
  onLoad() {
    const now = new Date();
    const minDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const saved = store.get('precheckDraft', null);
    if (saved) {
      const dateValue = standardDate(saved.dateValue || saved.date);
      const environment = Array.isArray(saved.environment) ? saved.environment : this.data.environment;
      this.setData({ ...saved, minDate, dateValue, date: displayDate(dateValue), environment, environmentText: environment.join(' · ') });
      return;
    }
    this.setData({ minDate, dateValue: minDate, date: displayDate(minDate) });
  },
  onShow() {
    const route = store.get('routeDraft', null);
    if (route) this.setData({ route }, () => this.persist(false));
  },
  onUnload() { this.persist(false); },
  back() { nav.back(); },
  chooseDestination() {
    wx.chooseLocation({ success: result => this.setData({ destination: result.name || result.address }, () => this.persist(false)) });
  },
  chooseDate(event) {
    const dateValue = event.detail.value;
    this.setData({ dateValue, date: displayDate(dateValue) }, () => this.persist(false));
  },
  chooseActivity() {
    const values = ['徒步露营', '公园步行', '骑行', '亲子活动'];
    wx.showActionSheet({ itemList: values, success: result => this.setData({ activity: values[result.tapIndex] }, () => this.persist(false)) });
  },
  editEnvironment() {
    const values = ['林地', '草地', '近水', '过夜', '携带宠物'];
    wx.showActionSheet({ itemList: values, success: result => {
      const selected = values[result.tapIndex];
      const environment = [...this.data.environment];
      const index = environment.indexOf(selected);
      if (index >= 0) environment.splice(index, 1); else environment.push(selected);
      this.setData({ environment, environmentText: environment.length ? environment.join(' · ') : '未选择' }, () => this.persist(false));
    } });
  },
  route() { wx.navigateTo({ url: '/pages/route/route' }); },
  persist(showToast) {
    store.set('precheckDraft', {
      destination: this.data.destination,
      date: this.data.date,
      dateValue: this.data.dateValue,
      activity: this.data.activity,
      environment: this.data.environment,
      environmentText: this.data.environmentText,
      route: this.data.route
    });
    if (showToast) wx.showToast({ title: '草稿已保存' });
  },
  save() { this.persist(true); },
  generate() {
    if (!this.data.destination || !this.data.dateValue || !this.data.activity) {
      wx.showToast({ title: '请完成三项必填信息', icon: 'none' });
      return;
    }
    const plans = store.get('plans', []);
    const plan = {
      id: store.id('trip'), title: this.data.destination.replace('浙江省 · ', ''),
      date: this.data.date.replace(/^\d{4}年/, ''), startAt: this.data.dateValue,
      type: this.data.activity, status: '新计划', distance: this.data.route && this.data.route.distance || ''
    };
    plans.unshift(plan);
    store.set('plans', plans);
    store.set('currentPlan', { ...this.data, id: plan.id });
    store.remove('precheckDraft');
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result' });
  }
});
