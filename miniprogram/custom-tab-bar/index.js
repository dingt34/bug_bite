// 识别页是全屏取景，按设计稿不显示 tabBar；其他页不受影响
const HIDDEN_ROUTES = ['pages/camera/camera'];

Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: '/assets/nav/home.svg' },
      { pagePath: '/pages/ai/ai', text: 'AI', icon: '/assets/nav/ai.svg' },
      { pagePath: '/pages/camera/camera', text: '识别', icon: '/assets/nav/camera.svg', center: true },
      { pagePath: '/pages/community/community', text: '社群', icon: '/assets/nav/community.svg' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '/assets/nav/profile.svg' }
    ]
  },

  attached() {
    this.syncHidden();
  },

  pageLifetimes: {
    show() {
      this.syncHidden();
    }
  },

  methods: {
    syncHidden() {
      const pages = getCurrentPages();
      const route = pages.length ? pages[pages.length - 1].route : '';
      this.setData({ hidden: HIDDEN_ROUTES.indexOf(route) >= 0 });
    },

    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      if (index === this.data.selected) return;
      wx.switchTab({ url: path });
    }
  }
});
