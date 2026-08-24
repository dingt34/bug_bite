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
    form: {
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
    this.setData({ monthIndex: Number(e.detail.value) });
    this.setData({ 'form.month': this.data.months[e.detail.value] });
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
    this.setData({ ['form.' + key]: arr });
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
