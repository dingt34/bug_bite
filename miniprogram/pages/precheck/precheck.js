const mock = require('../../utils/mock.js');

Page({
  data: {
    regions: mock.REGIONS,
    months: mock.MONTHS,
    activities: mock.ACTIVITIES,
    habitats: mock.HABITATS,
    companions: mock.COMPANIONS,
    gears: mock.GEARS,
    overnights: ['是', '否'],
    regionIndex: -1,
    monthIndex: -1,
    form: {
      regionCode: '',
      month: '',
      activityType: '',
      habitatTags: [],
      overnight: '',
      companionTags: [],
      gearTags: []
    }
  },

  onRegionChange(e) {
    this.setData({ regionIndex: Number(e.detail.value) });
    this.setData({ 'form.regionCode': this.data.regions[e.detail.value] });
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
    this.toggleArray('companionTags', e.currentTarget.dataset.v);
  },

  onGearTap(e) {
    this.toggleArray('gearTags', e.currentTarget.dataset.v);
  },

  toggleArray(key, v) {
    const arr = this.data.form[key];
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
    if (!form.regionCode || !form.month || !form.activityType) {
      wx.showToast({ title: '请完成必填项', icon: 'none' });
      return;
    }
    // 匹配规则（简化：夏秋季 + 徒步露营命中详细规则，其余命中默认）
    let rule = mock.PRE_RULES[1];
    const isWarm = mock.PRE_RULES[0].match.months.indexOf(form.month) > -1;
    const isOutdoor = mock.PRE_RULES[0].match.activities.indexOf(form.activityType) > -1;
    if (isWarm && isOutdoor) {
      rule = mock.PRE_RULES[0];
    }
    const plan = Object.assign({}, form, {
      id: 'plan_' + Date.now(),
      ruleId: rule.id,
      riskTags: rule.riskTags
    });
    // 缓存为最近计划
    const app = getApp();
    app.globalData.latestPlan = {
      id: plan.id,
      destinationName: form.regionCode,
      month: form.month,
      activityType: form.activityType,
      riskTags: rule.riskTags
    };
    wx.setStorageSync('latestPlan', app.globalData.latestPlan);
    wx.setStorageSync('plan_' + plan.id, plan);
    wx.navigateTo({ url: '/pages/precheck-result/precheck-result?planId=' + plan.id });
  }
});
