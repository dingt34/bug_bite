const store = require('../../utils/store');
const nav = require('../../utils/nav');
const environments = ['林地', '草地', '近水', '过夜', '夜间活动', '携带宠物', '儿童同行'];
function today() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function validDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
}
function displayDate(value) { return validDate(value) ? value.replace('-', '年').replace('-', '月') + '日' : ''; }
Page({
  data: { destination: '', date: '', dateValue: '', minDate: '', activity: '', environment: [],
    environmentOptions: [], environmentText: '未选择', expanded: false, route: null, submitting: false,
    saveStatus: '填写三项信息即可生成，不需要定位或照片' },
  onLoad(options) {
    // 获取传入的行程ID
    this.planId = options.id || '';
    const isNew = options.new === 'true';
    
    // 初始化数据
    let saved = {};
    
    if (this.planId && !isNew) {
      // 如果有行程ID且不是新建，尝试从行程数据中加载已有的行前准备数据
      const plans = store.get('plans', []);
      const plan = plans.find(p => p.id === this.planId);
      
      if (plan && plan.precheckData) {
        // 如果行程有保存的行前准备数据，使用这些数据
        saved = plan.precheckData;
      } else {
        // 如果没有，从空白开始
        saved = {};
      }
    } else {
      // 新建行程，从空白开始
      saved = {};
      this.planId = '';
      // 清除可能存在的临时草稿数据
      store.remove('precheckDraft');
    }
    
    const environment = Array.isArray(saved.environment) ? saved.environment.filter(v => environments.includes(v)) : [];
    const dateValue = validDate(saved.dateValue) ? saved.dateValue : '';
    this.setData({ destination: saved.destination || '', dateValue, date: displayDate(dateValue), minDate: today(),
      activity: saved.activity || '', environment, environmentText: environment.join(' · ') || '未选择',
      environmentOptions: environments.map(value => ({ value, selected: environment.includes(value) })),
      route: saved.route || null });
  },
  onShow() {
    this.setData({ submitting: false, minDate: today() });
    if (!this.awaitingRoute) return;
    this.awaitingRoute = false;
    const route = store.get('routeDraft', null);
    if (route) { this.change({ route }); store.remove('routeDraft'); }
  },
  onUnload() { if (!this.completed) this.persist(false); },
  back() { nav.back(); },
  change(values) { this.completed = false; this.setData(values, () => this.persist(false)); },
  inputDestination(event) { this.change({ destination: event.detail.value }); },
  chooseDestination() {
    wx.chooseLocation({ success: result => this.change({ destination: result.name || result.address || '' }),
      fail: error => {
        if (!/cancel/.test(error.errMsg || '')) wx.showToast({ title: '可直接在目的地栏手动输入', icon: 'none' });
      } });
  },
  chooseDate(event) { const dateValue = event.detail.value; this.change({ dateValue, date: displayDate(dateValue) }); },
  chooseActivity() {
    const values = ['徒步露营', '公园步行', '骑行', '亲子活动', '其他户外活动'];
    wx.showActionSheet({ itemList: values, success: r => { if (values[r.tapIndex]) this.change({ activity: values[r.tapIndex] }); } });
  },
  editEnvironment() { this.setData({ expanded: !this.data.expanded }); },
  toggleEnvironment(event) {
    const value = event.currentTarget.dataset.value;
    if (!environments.includes(value)) return;
    const environment = this.data.environment.includes(value) ? this.data.environment.filter(v => v !== value) : [...this.data.environment, value];
    this.change({ environment, environmentText: environment.join(' · ') || '未选择',
      environmentOptions: environments.map(value => ({ value, selected: environment.includes(value) })) });
  },
  route() {
    // 只消费本次路线页返回的结果，避免将上一份行程路线带入新计划。
    store.remove('routeDraft'); this.awaitingRoute = true;
    wx.navigateTo({ url: '/pages/route/route', fail: () => { this.awaitingRoute = false; } });
  },
  removeRoute() { this.change({ route: null }); },
  persist(showToast) {
    if (this.completed) return true;
    try {
      // 保存到临时草稿（兼容性）
      store.set('precheckDraft', { planId: this.planId, destination: this.data.destination,
        dateValue: this.data.dateValue, activity: this.data.activity, environment: this.data.environment, route: this.data.route });
      
      // 如果有行程ID，将数据保存到行程对象中
      if (this.planId) {
        const plans = store.get('plans', []);
        const planIndex = plans.findIndex(p => p.id === this.planId);
        const precheckData = {
          destination: this.data.destination,
          dateValue: this.data.dateValue,
          activity: this.data.activity,
          environment: this.data.environment,
          route: this.data.route,
          lastUpdated: new Date().toISOString()
        };
        
        if (planIndex >= 0) {
          // 更新现有行程
          plans[planIndex] = {
            ...plans[planIndex],
            precheckData: precheckData,
            updatedAt: Date.now()
          };
        } else {
          // 创建新行程（如果不存在）
          const newPlan = {
            id: this.planId,
            title: this.data.destination || '新行程',
            destination: this.data.destination,
            date: this.data.date,
            dateValue: this.data.dateValue,
            activity: this.data.activity,
            environment: this.data.environment,
            route: this.data.route,
            status: '草稿',
            precheckData: precheckData,
            updatedAt: Date.now()
          };
          plans.push(newPlan);
        }
        
        store.set('plans', plans);
      }
      
      this.setData({ saveStatus: '草稿已保存到本机 · 可离线继续' });
      if (showToast) wx.showToast({ title: '草稿已保存' });
      return true;
    } catch (_) {
      this.setData({ saveStatus: '草稿保存失败，请释放存储后重试' });
      wx.showToast({ title: '本地保存失败，请重试', icon: 'none' }); return false;
    }
  },
  save() { this.persist(true); },
  generate() {
    if (this.data.submitting) return;
    const destination = this.data.destination.trim();
    if (!destination || !this.data.dateValue || !this.data.activity) {
      wx.showToast({ title: '请完成目的地、日期和活动', icon: 'none' }); return;
    }
    if (!validDate(this.data.dateValue)) {
      wx.showToast({ title: '请选择有效日期', icon: 'none' }); return;
    }
    
    this.setData({ submitting: true });
    try {
      const plans = store.get('plans', []);
      this.planId = this.planId || store.id('trip');
      // 现有 route 页是静态演示。未经实际规划验证的距离不能当作真实路线保存。
      const route = this.data.route && this.data.route.verified === true ? this.data.route : null;
      const precheckData = {
        destination: this.data.destination,
        dateValue: this.data.dateValue,
        activity: this.data.activity,
        environment: this.data.environment,
        route: this.data.route,
        lastUpdated: new Date().toISOString()
      };
      const plan = { 
        id: this.planId, 
        title: destination, 
        destination, 
        date: this.data.date,
        dateValue: this.data.dateValue, 
        activity: this.data.activity, 
        type: this.data.activity,
        environment: this.data.environment, 
        route, 
        distance: route ? route.distance || '' : '',
        status: '草稿', // 不标记为已完成
        syncStatus: 'local', 
        updatedAt: Date.now(),
        precheckData: precheckData // 保存完整的行前准备数据
        // 注意：不设置isCompleted字段，让日期决定分类
      };
      const index = plans.findIndex(p => p.id === plan.id);
      if (index >= 0) plans[index] = { ...plans[index], ...plan }; else plans.unshift(plan);
      store.set('plans', plans); store.set('currentPlan', plan);
      store.remove('precheckDraft'); this.completed = true;
      
      // 保存成功后返回行程页面
      wx.showToast({ 
        title: '计划已保存', 
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    } catch (_) {
      this.setData({ submitting: false }); this.persist(false);
      wx.showToast({ title: '计划未完整保存，请重试', icon: 'none' });
    }
  }
});
