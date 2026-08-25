Component({
  data: {
    selected: 0,
    color: '#9AA0A6',
    selectedColor: '#2E7D5B',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: '/images/home.png',
        selectedIconPath: '/images/home-active.png'
      },
      {
        pagePath: '/pages/community/community',
        text: '社群',
        iconPath: '/images/community.png',
        selectedIconPath: '/images/community-active.png'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconPath: '/images/mine.png',
        selectedIconPath: '/images/mine-active.png'
      }
    ]
  },

  methods: {
    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index);
      const url = event.currentTarget.dataset.path;
      if (index === this.data.selected) return;
      this.setData({ selected: index });
      wx.switchTab({ url });
    }
  }
});
