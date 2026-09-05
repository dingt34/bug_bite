const store = require('../../utils/store');
const nav = require('../../utils/nav');
const precheck = require('../../utils/precheck');

const REGIONS = ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'];
const ACTIVITIES = ['徒步登山', '露营', '骑行', '野餐/草地活动', '垂钓/水边活动', '农事/采摘', '其他户外活动'];
const HABITATS = ['高草/灌木', '林地/落叶层', '水边/湿地', '农田/果园', '城市公园', '室内住宿'];
const OVERNIGHT = ['当日往返', '户外过夜', '室内住宿'];
const COMPANIONS = ['同行成人', '独自出行', '儿童', '老年人', '宠物'];
const GEARS = ['长袖长裤', '包脚鞋袜', '驱虫剂', '尖头镊子', '手套', '帐篷/蚊帐', '基础急救包', '暂未准备'];

function today() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function displayDate(value) { return validDate(value) ? value.replace('-', '年').replace('-', '月') + '日' : ''; }
function monthOf(value) { return validDate(value) ? `${Number(value.slice(5, 7))}月` : ''; }
function matchedRegions(destination) { return REGIONS.filter(region => String(destination || '').indexOf(region) >= 0); }
function options(values, selected) { return values.map(value => ({ value, selected: Array.isArray(selected) ? selected.indexOf(value) >= 0 : selected === value })); }
function countOptional(source) {
  return [
    Boolean((source.habitats || []).length),
    Boolean(source.overnight && source.overnight !== '当日往返'),
    Boolean((source.companions || []).length),
    Boolean((source.gears || []).length)
  ].filter(Boolean).length;
}

Page({
  data: { destination: '', date: '', dateValue: '', minDate: '', activity: '', activityIndex: 0, activityOptions: ACTIVITIES, habitats: [], overnight: '当日往返', companions: [], gears: [], route: null, expanded: false, optionalDone: 0, submitting: false, coverageMessage: '', saveStatus: '填写目的地、日期和活动即可生成清单', habitatOptions: [], overnightOptions: [], companionOptions: [], gearOptions: [] },

  onLoad(query) {
    query = query || {};
    const saved = store.get('precheckDraft', {}) || {};
    const plan = query.planId ? store.get('plans', []).find(item => item.id === query.planId) || {} : saved;
    this.planId = plan.id || saved.planId || '';
    this.applyPlan(plan);
  },

  onShow() {
    this.setData({ submitting: false, minDate: today() });
    if (!this.awaitingRoute) return;
    this.awaitingRoute = false;
    const route = store.get('routeDraft', null);
    if (route) {
      const endName = String(route.end || '').trim();
      const routeRegions = (route.regions || []).filter(value => REGIONS.indexOf(value) >= 0);
      const destination = endName && !matchedRegions(endName).length && routeRegions.length
        ? `${routeRegions[0]} · ${endName}`
        : endName;
      const routeHabitats = (route.environmentTags || []).filter(value => HABITATS.indexOf(value) >= 0);
      const habitats = this.data.habitats.concat(routeHabitats).filter((value, index, list) => list.indexOf(value) === index);
      const values = {
        route,
        habitats,
        habitatOptions: options(HABITATS, habitats),
        expanded: this.data.expanded || routeHabitats.length > 0
      };
      if (destination) {
        values.destination = destination;
        values.coverageMessage = matchedRegions(destination).length ? '' : 'P0 当前仅覆盖浙江省内目的地，请填写具体城市或地点。';
      }
      this.change(values);
      store.remove('routeDraft');
    }
  },

  onUnload() { if (!this.completed) this.persist(false); },
  back() { nav.back(); },

  applyPlan(plan) {
    const destination = plan.destinationName || plan.destination || '';
    const dateValue = validDate(plan.startDate || plan.dateValue) ? (plan.startDate || plan.dateValue) : '';
    const habitats = (plan.habitatTags || plan.environment || plan.habitats || []).filter(value => HABITATS.indexOf(value) >= 0);
    const companions = (plan.companionTags || plan.companions || []).filter(value => COMPANIONS.indexOf(value) >= 0);
    const gears = (plan.gearTags || plan.gears || []).filter(value => GEARS.indexOf(value) >= 0);
    const overnight = OVERNIGHT.indexOf(plan.overnight) >= 0 ? plan.overnight : '当日往返';
    const activity = ACTIVITIES.indexOf(plan.activityType || plan.activity) >= 0 ? (plan.activityType || plan.activity) : '';
    const optionalDone = countOptional({ habitats, overnight, companions, gears });
    this.setData({ destination, dateValue, date: displayDate(dateValue), minDate: today(), activity, activityIndex: Math.max(0, ACTIVITIES.indexOf(activity)), habitats, overnight, companions, gears, route: plan.route || null, expanded: optionalDone > 0, optionalDone, coverageMessage: destination && !matchedRegions(destination).length ? 'P0 当前仅覆盖浙江省内目的地，请填写具体城市或地点。' : '', habitatOptions: options(HABITATS, habitats), overnightOptions: options(OVERNIGHT, overnight), companionOptions: options(COMPANIONS, companions), gearOptions: options(GEARS, gears) });
  },

  change(values) {
    this.completed = false;
    const next = Object.assign({}, this.data, values);
    this.setData(Object.assign({}, values, { optionalDone: countOptional(next) }), () => this.persist(false));
  },
  inputDestination(event) { const destination = event.detail.value; this.change({ destination, coverageMessage: destination && !matchedRegions(destination).length ? 'P0 当前仅覆盖浙江省内目的地，请填写具体城市或地点。' : '' }); },
  chooseDestination() { wx.chooseLocation({ success: result => this.inputDestination({ detail: { value: [result.name, result.address].filter(Boolean).join(' · ') } }), fail: error => { if (!/cancel/.test(error.errMsg || '')) wx.showToast({ title: '可直接手动输入浙江省内地点', icon: 'none' }); } }); },
  chooseDate(event) { const dateValue = event.detail.value; this.change({ dateValue, date: displayDate(dateValue) }); },
  chooseActivity(event) {
    const index = Number(event && event.detail ? event.detail.value : event && event.tapIndex);
    if (!Number.isInteger(index) || !ACTIVITIES[index]) return;
    this.change({ activity: ACTIVITIES[index], activityIndex: index });
  },
  editEnvironment() { this.setData({ expanded: !this.data.expanded }); },
  toggleList(key, values, event) { const value = event.currentTarget.dataset.value; const current = this.data[key].slice(); const index = current.indexOf(value); if (index >= 0) current.splice(index, 1); else current.push(value); this.change({ [key]: current, [`${key.slice(0, -1)}Options`]: options(values, current) }); },
  toggleHabitat(event) { this.toggleList('habitats', HABITATS, event); },
  toggleCompanion(event) { this.toggleList('companions', COMPANIONS, event); },
  toggleGear(event) { const value = event.currentTarget.dataset.value; const gears = value === '暂未准备' ? ['暂未准备'] : this.data.gears.filter(item => item !== '暂未准备'); const index = gears.indexOf(value); if (index >= 0) gears.splice(index, 1); else gears.push(value); this.change({ gears, gearOptions: options(GEARS, gears) }); },
  chooseOvernight(event) { const overnight = event.currentTarget.dataset.value; this.change({ overnight, overnightOptions: options(OVERNIGHT, overnight) }); },
  route() { store.remove('routeDraft'); this.awaitingRoute = true; wx.navigateTo({ url: '/pages/route-plan/route-plan?from=precheck', fail: () => { this.awaitingRoute = false; } }); },
  removeRoute() { this.change({ route: null }); },

  persist(showToast) {
    if (this.completed) return true;
    try { store.set('precheckDraft', { planId: this.planId, destination: this.data.destination, dateValue: this.data.dateValue, activity: this.data.activity, habitats: this.data.habitats, overnight: this.data.overnight, companions: this.data.companions, gears: this.data.gears, route: this.data.route }); this.setData({ saveStatus: '草稿已保存到本机 · 可离线继续' }); if (showToast) wx.showToast({ title: '草稿已保存' }); return true; } catch (_) { this.setData({ saveStatus: '草稿保存失败，请释放存储后重试' }); return false; }
  },
  save() { this.persist(true); },

  generate() {
    if (this.data.submitting) return;
    const destination = this.data.destination.trim(); const regions = matchedRegions(destination);
    if (!destination || !this.data.dateValue || !this.data.activity) { wx.showToast({ title: '请完成目的地、日期和活动', icon: 'none' }); return; }
    if (!validDate(this.data.dateValue) || this.data.dateValue < today()) { wx.showToast({ title: '请选择今天或之后的有效日期', icon: 'none' }); return; }
    if (!regions.length) { this.setData({ coverageMessage: 'P0 当前仅覆盖浙江省内目的地，请改为具体浙江城市后继续。' }); wx.showToast({ title: '目前仅支持浙江省内目的地', icon: 'none' }); return; }
    this.setData({ submitting: true });
    const ruleSnapshot = precheck.evaluatePlan({ regionCodes: regions, month: monthOf(this.data.dateValue), activityType: this.data.activity, habitatTags: this.data.habitats, overnight: this.data.overnight, companionTags: this.data.companions, gearTags: this.data.gears });
    const route = this.data.route && this.data.route.verified === true ? this.data.route : null;
    const planId = this.planId || store.id('trip');
    this.planId = planId;
    const plan = { id: planId, title: destination, destinationName: destination, destination, regionCodes: regions, regionCode: regions.join('、'), date: this.data.date, dateValue: this.data.dateValue, startDate: this.data.dateValue, month: monthOf(this.data.dateValue), activityType: this.data.activity, activity: this.data.activity, type: this.data.activity, habitatTags: this.data.habitats, environment: this.data.habitats, overnight: this.data.overnight, companionTags: this.data.companions, gearTags: this.data.gears, route, distance: route ? route.distance || '' : '', riskTags: ruleSnapshot.riskTags, ruleSnapshot, status: '新计划', syncStatus: '待同步', updatedAtTimestamp: Date.now() };
    const plans = store.get('plans', []); const index = plans.findIndex(item => item.id === plan.id); if (index >= 0) plans[index] = Object.assign({}, plans[index], plan); else plans.unshift(plan);
    try {
      store.set('plans', plans);
      store.set('currentPlan', plan);
      store.remove('precheckDraft');
      this.completed = true;
    } catch (_) {
      this.setData({ submitting: false, saveStatus: '计划保存失败，请释放存储空间后重试' });
      wx.showToast({ title: '计划保存失败，请重试', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/precheck-result/precheck-result?planId=${plan.id}`, fail: () => { this.setData({ submitting: false }); wx.showToast({ title: '计划已保存，请从我的行程查看', icon: 'none' }); } });
  }
});
