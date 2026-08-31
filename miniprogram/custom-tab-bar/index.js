Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: '/assets/nav/home.svg' },
      { pagePath: '/pages/ai/ai', text: 'AI', icon: '/assets/nav/ai.svg' },
      { pagePath: '/pages/camera/camera', text: '识别', icon: '/assets/nav/camera.svg', center: true },
      { pagePath: '/pages/community/community', text: '社群', icon: '/assets/nav/community.svg' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '/assets/nav/profile.svg' }
    ]
  },
  methods: {
    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      if (index === this.data.selected) return;
      wx.switchTab({ url: path });
    }
  }
});
