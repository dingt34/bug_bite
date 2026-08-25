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
    routePreview: { summary: '', insects: [] },
    routeLoading: false,
    routeMessage: '',
    routeOptions: [],
    selectedRouteIndex: 0,
    routeMarkers: [],
    routePolylines: [],
    mapLatitude: 30.2741,
    mapLongitude: 120.1551,
    mapScale: 12,
    form: {
      routeStart: '',
      routeEnd: '',
      regionCodes: [],
      month: '',
      activityType: '',
      habitatTags: [],
      overnight: '',
      companionTags: [],
      gearTags: []
    }
  },

  onRegionTap(e) {
    this.toggleArray('regionCodes', e.currentTarget.dataset.v);
  },

  onMonthChange(e) {
    const month = this.data.months[e.detail.value];
    const form = Object.assign({}, this.data.form, { month });
    this.setData({
      monthIndex: Number(e.detail.value),
      'form.month': month,
      routePreview: precheckRules.getRouteInsects(form)
    });
  },

  onRouteStartInput(e) {
    const routeStart = String(e.detail.value || '').trim();
    const form = Object.assign({}, this.data.form, { routeStart });
    this.setData({
      'form.routeStart': routeStart,
      routePreview: precheckRules.getRouteInsects(form),
      routeOptions: [], routePolylines: [], routeMarkers: [], routeMessage: ''
    });
  },

  onRouteEndInput(e) {
    const routeEnd = String(e.detail.value || '').trim();
    const form = Object.assign({}, this.data.form, { routeEnd });
    this.setData({
      'form.routeEnd': routeEnd,
      routePreview: precheckRules.getRouteInsects(form),
      routeOptions: [], routePolylines: [], routeMarkers: [], routeMessage: ''
    });
  },

  planRoute() {
    const form = this.data.form;
    if (!form.routeStart || !form.routeEnd || this.data.routeLoading) return;
    this.setData({ routeLoading: true, routeMessage: '', routeOptions: [], routePolylines: [] });
    wx.cloud.callFunction({
      name: 'routePlan',
      data: { start: form.routeStart, end: form.routeEnd },
      success: result => {
        const data = result && result.result;
        if (!data || !data.routes || !data.routes.length) {
          this.setData({ routeLoading: false, routeMessage: (data && data.message) || '未找到可用路线' });
          return;
        }
        this.applyRoutes(data);
      },
      fail: error => {
        this.setData({ routeLoading: false, routeMessage: (error && error.errMsg) || '路线规划失败，请稍后重试。' });
      }
    });
  },

  applyRoutes(data) {
    const colors = ['#2E7D5B', '#77B997', '#B2D9C3'];
    const routes = data.routes.slice(0, 3);
    const routePolylines = routes.map((route, index) => ({
      points: route.points,
      color: colors[index],
      width: index === 0 ? 8 : 5,
      borderColor: '#FFFFFF',
      borderWidth: 1
    }));
    this.setData({
      routeLoading: false,
      routeMessage: '已生成 ' + routes.length + ' 条绿色路线，点击下方路线可高亮查看。',
      routeOptions: routes,
      selectedRouteIndex: 0,
      routePolylines,
      routeMarkers: [
        { id: 1, latitude: data.start.latitude, longitude: data.start.longitude, title: '起点：' + this.data.form.routeStart, width: 28, height: 36 },
        { id: 2, latitude: data.end.latitude, longitude: data.end.longitude, title: '终点：' + this.data.form.routeEnd, width: 28, height: 36 }
      ],
      mapLatitude: (data.start.latitude + data.end.latitude) / 2,
      mapLongitude: (data.start.longitude + data.end.longitude) / 2,
      mapScale: 11
    });
  },

  selectRoute(e) {
    const selectedRouteIndex = Number(e.currentTarget.dataset.index);
    const routePolylines = this.data.routePolylines.map((line, index) => Object.assign({}, line, {
      color: index === selectedRouteIndex ? '#2E7D5B' : '#9BCDB5',
      width: index === selectedRouteIndex ? 9 : 4
    }));
    this.setData({ selectedRouteIndex, routePolylines });
  },

  onActivityTap(e) {
    this.setData({ 'form.activityType': e.currentTarget.dataset.v });
  },

  onHabitatTap(e) {
    this.toggleArray('habitatTags', e.currentTarget.dataset.v);
  },

  onOvernightTap(e) {
    this.setData({ 'form.overnight': e.currentTarget.dataset.v });
  },

  onCompanionTap(e) {
    this.toggleArray('companionTags', e.currentTarget.dataset.v, '独自出行');
  },

  onGearTap(e) {
    this.toggleArray('gearTags', e.currentTarget.dataset.v, '暂未准备');
  },

  toggleArray(key, v, exclusiveValue) {
    let arr = this.data.form[key].slice();
    if (exclusiveValue && v === exclusiveValue) {
      arr = arr.indexOf(v) > -1 ? [] : [v];
      this.setData({ ['form.' + key]: arr });
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
    const nextForm = Object.assign({}, this.data.form, { [key]: arr });
    const data = { ['form.' + key]: arr };
    if (key === 'habitatTags') data.routePreview = precheckRules.getRouteInsects(nextForm);
    this.setData(data);
  },

  onShareAppMessage() {},

  submit() {
    const form = this.data.form;
    if (!form.regionCodes.length || !form.month || !form.activityType) {
      wx.showToast({ title: '请完成必填项', icon: 'none' });
      return;
    }
    const rule = precheckRules.evaluatePlan(form);
    const timestamp = Date.now();
    const destinationName = form.regionCodes.join('、');
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
    cloudSync.queuePush(wx, app);
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result?planId=' + plan.id });
  }
});
