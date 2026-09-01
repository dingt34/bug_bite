const mock = require('../../utils/mock.js');
const precheckRules = require('../../utils/precheck.js');
const planUtils = require('../../utils/plan.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    regions: mock.REGIONS,
    months: mock.MONTHS,
    activities: mock.ACTIVITIES,
    habitats: mock.HABITATS,
    companions: mock.COMPANIONS,
    gears: mock.GEARS,
    overnights: ['当日往返', '户外过夜', '室内住宿'],
    monthIndex: -1,
    minDate: '',
    optionalExpanded: false,
    submitted: false,
    selectedRoute: null,
    selectedRoutePath: '',
    routeSuggestedRegions: [],
    requiredCount: 3,
    answeredCount: 0,
    completionPercent: 0,
    form: {
      regionCodes: [],
      travelDate: '',
      month: '',
      activityType: '',
      habitatTags: [],
      overnight: '',
      companionTags: [],
      gearTags: []
    }
  },

  onLoad() {
    const today = new Date();
    const minDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    const saved = wx.getStorageSync ? wx.getStorageSync('precheckDraft') : null;
    if (!saved || !saved.form) {
      this.setData({ minDate });
      return;
    }
    const form = Object.assign({}, this.data.form, saved.form, {
      regionCodes: (saved.form.regionCodes || []).slice(),
      habitatTags: (saved.form.habitatTags || []).slice(),
      companionTags: (saved.form.companionTags || []).slice(),
      gearTags: (saved.form.gearTags || []).slice()
    });
    const optionalExpanded = !!(
      form.habitatTags.length || form.overnight || form.companionTags.length || form.gearTags.length
    );
    this.setData({ minDate, form, optionalExpanded }, () => this.updateCompletion());
  },

  onUnload() {
    if (!this.data.submitted) this.persistDraft(false);
  },

  onRegionTap(e) {
    this.toggleArray('regionCodes', e.currentTarget.dataset.v, '', () => this.updateCompletion());
  },

  onShow() {
    const selectedRoute = wx.getStorageSync('selectedRoutePlan') || this.data.selectedRoute || null;
    const suggested = selectedRoute && Array.isArray(selectedRoute.regions)
      ? selectedRoute.regions.filter(region => this.data.regions.indexOf(region) > -1)
      : [];
    const routeNames = selectedRoute
      ? [selectedRoute.startName].concat(selectedRoute.waypointNames || [], [selectedRoute.endName]).filter(Boolean)
      : [];
    const changes = { selectedRoute, selectedRoutePath: routeNames.join(' → '), routeSuggestedRegions: suggested };
    if (!this.data.form.regionCodes.length && suggested.length) changes['form.regionCodes'] = suggested.slice();
    this.setData(changes, () => this.updateCompletion());
  },

  applyRouteRegions() {
    this.setData({ 'form.regionCodes': this.data.routeSuggestedRegions.slice() }, () => this.updateCompletion());
  },

  goRoutePlan() {
    wx.navigateTo({ url: '/pages/route-plan/route-plan' });
  },

  onMonthChange(e) {
    this.setData({
      monthIndex: Number(e.detail.value),
      'form.month': this.data.months[e.detail.value]
    }, () => this.updateCompletion());
  },

  onDateChange(e) {
    const travelDate = e.detail.value;
    const monthNumber = Number((travelDate || '').slice(5, 7));
    const month = monthNumber ? monthNumber + '月' : '';
    this.setData({
      monthIndex: monthNumber ? monthNumber - 1 : -1,
      'form.travelDate': travelDate,
      'form.month': month
    }, () => this.updateCompletion());
  },

  onActivityTap(e) {
    this.setData({ 'form.activityType': e.currentTarget.dataset.v }, () => this.updateCompletion());
  },

  onHabitatTap(e) {
    this.toggleArray('habitatTags', e.currentTarget.dataset.v, '', () => this.persistDraft(false));
  },

  onOvernightTap(e) {
    this.setData({ 'form.overnight': e.currentTarget.dataset.v }, () => this.persistDraft(false));
  },

  onCompanionTap(e) {
    this.toggleArray('companionTags', e.currentTarget.dataset.v, '独自出行', () => this.persistDraft(false));
  },

  onGearTap(e) {
    this.toggleArray('gearTags', e.currentTarget.dataset.v, '暂未准备', () => this.persistDraft(false));
  },

  toggleOptional() {
    this.setData({ optionalExpanded: !this.data.optionalExpanded });
  },

  saveDraft() {
    this.persistDraft(true);
  },

  persistDraft(showToast) {
    if (!wx.setStorageSync) return;
    wx.setStorageSync('precheckDraft', {
      form: this.data.form,
      selectedRoute: this.data.selectedRoute,
      updatedAtTimestamp: Date.now()
    });
    if (showToast && wx.showToast) wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  toggleArray(key, v, exclusiveValue, callback) {
    let arr = this.data.form[key].slice();
    if (exclusiveValue && v === exclusiveValue) {
      arr = arr.indexOf(v) > -1 ? [] : [v];
      this.setData({ ['form.' + key]: arr }, callback);
      return;
    }
    if (exclusiveValue) {
      arr = arr.filter(item => item !== exclusiveValue);
    }
    const idx = arr.indexOf(v);
    if (idx > -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(v);
    }
    this.setData({ ['form.' + key]: arr }, callback);
  },

  updateCompletion() {
    const form = this.data.form;
    const answeredCount = [form.regionCodes.length > 0, !!form.month, !!form.activityType]
      .filter(Boolean).length;
    this.setData({
      answeredCount,
      completionPercent: Math.round(answeredCount / this.data.requiredCount * 100)
    });
    this.persistDraft(false);
  },

  onShareAppMessage() {},

  submit() {
    const form = this.data.form;
    if (!form.regionCodes.length || (!form.travelDate && !form.month) || !form.activityType) {
      wx.showToast({ title: '请完成必填项', icon: 'none' });
      return;
    }
    const rule = precheckRules.evaluatePlan(form);
    const timestamp = Date.now();
    const destinationName = form.regionCodes.join('、');
    const selectedRoute = this.data.selectedRoute;
    const routeSummary = selectedRoute ? {
      id: selectedRoute.id,
      startName: selectedRoute.startName,
      waypointName: selectedRoute.waypointName || '',
      waypointNames: selectedRoute.waypointNames || [],
      endName: selectedRoute.endName,
      regions: selectedRoute.regions || [],
      mode: selectedRoute.mode,
      modeName: selectedRoute.modeName,
      routeName: selectedRoute.routeName,
      distanceText: selectedRoute.distanceText,
      durationText: selectedRoute.durationText
    } : null;
    const plan = Object.assign({}, form, {
      id: 'plan_' + timestamp,
      schemaVersion: planUtils.PLAN_SCHEMA_VERSION,
      regionCode: destinationName,
      destinationName: destinationName,
      ruleId: rule.id,
      ruleVersion: rule.ruleVersion,
      riskTags: rule.riskTags,
      matchedRules: rule.matchedRules,
      ruleSnapshot: rule,
      routePlan: routeSummary,
      status: '进行中',
      createdAtTimestamp: timestamp,
      updatedAtTimestamp: timestamp
    });
    // 保存完整计划列表，并同步最近计划摘要。
    const app = getApp();
    const plans = planUtils.upsertPlan(wx.getStorageSync('plans') || [], plan);
    app.globalData.latestPlan = planUtils.toLatestPlan(plan);
    wx.setStorageSync('plans', plans);
    wx.setStorageSync('latestPlan', app.globalData.latestPlan);
    // 保留单计划键，兼容已生成的旧页面链接。
    wx.setStorageSync('plan_' + plan.id, plan);
    this.data.submitted = true;
    if (wx.removeStorageSync) wx.removeStorageSync('precheckDraft');
    cloudSync.queuePush(wx, app);
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result?planId=' + plan.id });
  }
});
