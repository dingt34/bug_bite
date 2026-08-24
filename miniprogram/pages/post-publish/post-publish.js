const mock = require('../../utils/mock.js');

Page({
  data: {
    text: '',
    previewImage: '',
    regions: mock.REGIONS,
    types: mock.CONTACT_TYPES,
    stages: ['已处理', '观察中', '已恢复'],
    region: '',
    contactType: '',
    stage: ''
  },

  onInput(e) {
    this.setData({ text: e.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ previewImage: res.tempFilePaths[0] });
      }
    });
  },

  onRegionTap(e) {
    this.setData({ region: e.currentTarget.dataset.v });
  },

  onTypeTap(e) {
    this.setData({ contactType: e.currentTarget.dataset.name });
  },

  onStageTap(e) {
    this.setData({ stage: e.currentTarget.dataset.v });
  },

  publish() {
    const tags = [this.data.region, this.data.contactType, this.data.stage].filter(Boolean);
    const post = {
      id: 'post_local_' + Date.now(),
      displayName: getApp().globalData.userInfo.displayName,
      time: '刚刚',
      text: this.data.text,
      imageRefs: this.data.previewImage ? [this.data.previewImage] : [],
      tags: tags
    };
    const posts = wx.getStorageSync('posts') || [];
    posts.unshift(post);
    wx.setStorageSync('posts', posts);
    wx.showToast({ title: '已发布', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 600);
  }
});
