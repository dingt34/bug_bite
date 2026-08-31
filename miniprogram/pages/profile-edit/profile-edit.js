const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

Page({
  data: {
    avatar: '', nickname: '林间观察员', age: '18–30 岁', region: '浙江省 · 杭州市', health: '', showRegionList: false,
    regionOptions: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市']
  },
  back() { nav.back('/pages/login/login'); },
  chooseAvatar(event) { this.setData({ avatar: event.detail.avatarUrl }); },
  changeName(event) { this.setData({ nickname: event.detail.value }); },
  chooseAge() {
    wx.showActionSheet({ itemList: ['18 岁以下', '18–30 岁', '31–45 岁', '46–60 岁', '60 岁以上'], success: ({ tapIndex }) => this.setData({ age: ['18 岁以下', '18–30 岁', '31–45 岁', '46–60 岁', '60 岁以上'][tapIndex] }) });
  },
  chooseRegion() {
    this.setData({ showRegionList: !this.data.showRegionList });
  },
  selectRegion(event) {
    this.setData({ region: `浙江省 · ${event.currentTarget.dataset.region}`, showRegionList: false });
  },
  changeHealth(event) { this.setData({ health: event.detail.value }); },
  save() {
    const user = { avatar: this.data.avatar, nickname: this.data.nickname || '林间观察员', age: this.data.age, region: this.data.region, health: this.data.health };
    store.set('user', user); store.set('profileComplete', true); getApp().globalData.user = user;
    cloud.background('login', { profile: { nickname: user.nickname, ageRange: user.age, region: user.region, health: user.health } });
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
