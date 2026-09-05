Component({
  properties: {
    title: { type: String, value: '虫咬识途' },
    showBack: { type: Boolean, value: true },
    backLabel: { type: String, value: '返回' }
  },

  data: {
    statusBarHeight: 20
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
    goBack() {
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
    }
  }
});
