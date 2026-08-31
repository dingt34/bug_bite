const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

Page({
  data: {
    avatar: '', nickname: '林间观察员', age: '18–30 岁', region: '浙江省 · 杭州市', health: '', healthSummary: '', healthDetail: '', healthConfirmed: false, nicknameFocus: false, showRegionList: false, regionStep: 'province', showHealthList: false,
    regionOptions: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
    healthOptions: ['无特殊情况', '过敏史', '长期用药', '慢性疾病', '免疫相关疾病', '其他特殊情况'],
    selectedHealthOptions: []
  },
  back() { nav.back('/pages/login/login'); },
  chooseAvatar(event) { this.setData({ avatar: event.detail.avatarUrl }); },
  changeName(event) { this.setData({ nickname: event.detail.value }); },
  focusNickname() { this.setData({ nicknameFocus: true }); },
  blurNickname() { this.setData({ nicknameFocus: false }); },
  chooseAge() {
    wx.showActionSheet({ itemList: ['18 岁以下', '18–30 岁', '31–45 岁', '46–60 岁', '60 岁以上'], success: ({ tapIndex }) => this.setData({ age: ['18 岁以下', '18–30 岁', '31–45 岁', '46–60 岁', '60 岁以上'][tapIndex] }) });
  },
  chooseRegion() {
    this.setData({ showRegionList: !this.data.showRegionList, regionStep: 'province' });
  },
  selectProvince() {
    this.setData({ regionStep: 'city' });
  },
  backToProvince() {
    this.setData({ regionStep: 'province' });
  },
  selectRegion(event) {
    this.setData({ region: `浙江省 · ${event.currentTarget.dataset.region}`, showRegionList: false });
  },
  openHealthOptions() { this.setData({ showHealthList: !this.data.showHealthList }); },
  closeHealthOptions() { this.setData({ showHealthList: false }); },
  noop() {},
  skipHealth() {
    this.setData({
      showHealthList: false,
      healthSummary: '',
      healthDetail: '',
      healthConfirmed: false,
      selectedHealthOptions: [],
      health: ''
    });
    wx.showToast({ title: '健康信息可稍后在“我的—个人档案”中补充', icon: 'none', duration: 2200 });
  },
  toggleHealthOption(event) {
    const index = Number(event.currentTarget.dataset.index);
    const selected = this.data.selectedHealthOptions.slice();
    selected[index] = !selected[index];
    const labels = this.data.healthOptions.filter((_, optionIndex) => selected[optionIndex]);
    this.setData({ selectedHealthOptions: selected, health: labels.join('、'), healthSummary: labels.join('、') });
  },
  confirmHealthOptions() {
    if (!this.data.healthSummary) return;
    this.setData({ showHealthList: false, healthConfirmed: true });
  },
  changeHealthDetail(event) {
    const detail = event.detail.value;
    const health = this.data.healthSummary + (detail ? `：${detail}` : '');
    this.setData({ healthDetail: detail, health });
  },
  save() {
    const user = { avatar: this.data.avatar, nickname: this.data.nickname || '林间观察员', age: this.data.age, region: this.data.region, health: this.data.health };
    store.set('user', user); store.set('profileComplete', true); getApp().globalData.user = user;
    cloud.background('login', { profile: { nickname: user.nickname, ageRange: user.age, region: user.region, health: user.health } });
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
