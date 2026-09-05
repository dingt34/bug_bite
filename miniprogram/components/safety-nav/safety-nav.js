Component({
  properties: {
    current: { type: Number, value: 1 },
    allowBack: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 20,
    returnLabel: '首页',
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
      this.syncReturnTarget();
    }
  },

  pageLifetimes: {
    show() {
      this.syncReturnTarget();
    }
  },

  methods: {
    syncReturnTarget() {
      const app = typeof getApp === 'function' ? getApp() : null;
      const postId = app && app.globalData && app.globalData.safetyReturnPostId;
      this.setData({ returnLabel: postId ? '原帖子' : '首页' });
    },

    goHome() {
      const app = typeof getApp === 'function' ? getApp() : null;
      const postId = app && app.globalData && app.globalData.safetyReturnPostId;
      if (app && app.globalData) {
        app.globalData.draftEvent = null;
        app.globalData.safetyReturnPostId = '';
      }
      if (postId) {
        const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
        let postPageIndex = -1;
        for (let index = pages.length - 1; index >= 0; index -= 1) {
          if (pages[index] && pages[index].route === 'pages/post-detail/post-detail') {
            postPageIndex = index;
            break;
          }
        }
        const delta = postPageIndex > -1 ? pages.length - 1 - postPageIndex : 0;
        if (delta > 0) {
          wx.navigateBack({ delta });
          return;
        }
        wx.redirectTo({ url: '/pages/post-detail/post-detail?id=' + encodeURIComponent(postId) });
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
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
