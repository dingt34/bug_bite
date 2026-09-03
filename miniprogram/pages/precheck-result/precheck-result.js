const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

Page({
  data: {
    done: [true, false, true],
    doneCount: 2,
    checklist: [
      { title: '防护穿戴', detail: '长袖长裤、包脚鞋', figmaIcon: '/assets/figma/all/s10-img11.svg' },
      { title: '驱避用品', detail: '按说明携带并补涂', figmaIcon: '/assets/figma/all/s10-img1.svg' },
      { title: '应急物品', detail: '清洁用品、冷敷袋', figmaIcon: '/assets/figma/all/s10-imgIconAppIconYlqx1.svg' }
    ],
    plan: {},
    readonly: false // 默认不是只读模式
  },

  onLoad(options) {
    // 检查是否是只读模式
    const readonly = options.readonly === 'true';
    
    let plan = {};
    if (options.id) {
      // 根据ID查找对应的行程
      const plans = store.get('plans', []);
      plan = plans.find(p => p.id === options.id) || {};
    } else {
      // 没有ID，使用当前计划
      plan = store.get('currentPlan', {});
    }
    
    // 如果行程有precheckData，使用这些数据
    if (plan.precheckData) {
      // 这里可以根据precheckData更新checklist
      // 例如：plan.precheckData.essentials等
    }
    
    this.setData({ 
      plan: plan,
      readonly: readonly
    });
  },

  back() {
    nav.back();
  },

  toggle(e) {
    // 如果是只读模式，禁止编辑
    if (this.data.readonly) {
      wx.showToast({
        title: '历史记录不可编辑',
        icon: 'none'
      });
      return;
    }
    
    const d = [...this.data.done];
    const i = Number(e.currentTarget.dataset.index);
    d[i] = !d[i];
    this.setData({ 
      done: d, 
      doneCount: d.filter(Boolean).length 
    });
  },

  save() {
    // 如果是只读模式，禁止保存
    if (this.data.readonly) {
      wx.showToast({
        title: '历史记录不可编辑',
        icon: 'none'
      });
      return;
    }
    
    const plan = this.data.plan || {};
    const clientId = plan.id || store.id('plan');
    cloud.background('userData', {
      action: 'upsert',
      type: 'plan',
      clientId,
      record: {
        ...plan,
        checklist: this.data.checklist.map((item, index) => ({
          ...item,
          done: this.data.done[index]
        }))
      }
    });
    wx.showToast({ title: '行程已保存' });
    setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 500);
  },

  plans() {
    wx.navigateTo({ url: '/pages/my-plans/my-plans' });
  },
  
  // 编辑行程（如果是草稿）
  editPlan() {
    if (this.data.readonly) {
      wx.showToast({
        title: '历史记录不可编辑',
        icon: 'none'
      });
      return;
    }
    
    const planId = this.data.plan.id;
    if (planId) {
      wx.navigateTo({ 
        url: '/pages/precheck/precheck?id=' + planId 
      });
    }
  }
});