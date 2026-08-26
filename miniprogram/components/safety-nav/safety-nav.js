Component({
  properties: {
    current: { type: Number, value: 1 },
    allowBack: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 20,
    steps: [
      { step: 1, name: '危险筛查' },
      { step: 2, name: '接触类型' },
      { step: 3, name: '症状记录' },
      { step: 4, name: '行动建议' }
    ]
  },

  lifetimes: {
    attached() {
      let info = {};
      try {
        info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      } catch (e) {}
      this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    }
  },

  methods: {
    goHome() {
      const app = typeof getApp === 'function' ? getApp() : null;
      if (app && app.globalData) app.globalData.draftEvent = null;
      wx.switchTab({ url: '/pages/index/index' });
    },

    onStepTap(e) {
      const target = Number(e.currentTarget.dataset.step);
      if (target >= this.data.current) {
        if (target > this.data.current) {
          wx.showToast({ title: '请完成当前步骤后继续', icon: 'none' });
        }
        return;
      }
      if (!this.data.allowBack) {
        wx.showToast({ title: '紧急结果不可返回修改', icon: 'none' });
        return;
      }
      this.triggerEvent('stepchange', { step: target });
    }
  }
});
