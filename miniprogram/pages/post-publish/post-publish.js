const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    text: '',
    previewImage: '',
    regions: mock.REGIONS,
    types: mock.CONTACT_TYPES,
    stages: ['已处理', '观察中', '已恢复'],
    region: '',
    contactType: '',
    contactTypeName: '',
    stage: '',
    charCount: 0,
    imagePersisted: false,
    publishing: false,
    validationMessage: ''
  },

  onLoad() {
    if (!auth.readLocalUser(wx)) {
      wx.showModal({
        title: '需要体验身份',
        content: '发布内容前需要先创建本地体验身份。',
        confirmText: '去创建',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/login/login' });
          else wx.navigateBack();
        }
      });
    }
  },

  onInput(e) {
    const text = e.detail.value || '';
    this.setData({ text, charCount: text.length, validationMessage: '' });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (path) this.setData({ previewImage: path, imagePersisted: false });
      }
    });
  },

  onRegionTap(e) {
    this.setData({ region: e.currentTarget.dataset.v });
  },

  onTypeTap(e) {
    this.setData({
      contactType: e.currentTarget.dataset.v,
      contactTypeName: e.currentTarget.dataset.name,
      validationMessage: ''
    });
  },

  onStageTap(e) {
    this.setData({ stage: e.currentTarget.dataset.v, validationMessage: '' });
  },

  publish() {
    if (this.data.publishing) return;
    const userInfo = auth.readLocalUser(wx);
    if (!userInfo) {
      wx.showToast({ title: '请先创建体验身份', icon: 'none' });
      return;
    }
    const validation = community.validatePost(this.data);
    if (!validation.valid) {
      this.setData({ validationMessage: validation.message });
      wx.showToast({ title: validation.message, icon: 'none' });
      return;
    }
    this.setData({ publishing: true, validationMessage: '' });
    this.persistImage(() => this.commitPublish(userInfo, validation.text));
  },

  persistImage(done) {
    if (!this.data.previewImage || this.data.imagePersisted) {
      done();
      return;
    }
    wx.saveFile({
      tempFilePath: this.data.previewImage,
      success: res => {
        this.setData({ previewImage: res.savedFilePath, imagePersisted: true });
        done();
      },
      fail: () => {
        this.setData({ publishing: false, validationMessage: '图片保存失败，请重试或重新选择图片。' });
        wx.showModal({
          title: '图片保存失败',
          content: '图片尚未保存，帖子不会在图片缺失的情况下发布。',
          showCancel: false
        });
      }
    });
  },

  commitPublish(userInfo, text) {
    const post = community.buildPost(Object.assign({}, this.data, {
      text,
      imageRef: this.data.previewImage
    }), userInfo);
    const posts = wx.getStorageSync('posts') || [];
    posts.unshift(post);
    wx.setStorageSync('posts', posts);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    wx.showToast({ title: '已发布', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 400);
  }
});
