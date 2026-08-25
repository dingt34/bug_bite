const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const communityCloud = require('../../utils/community-cloud.js');

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
    publishing: false,
    validationMessage: ''
  },

  onLoad() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.showModal({
        title: '需要微信云登录',
        content: '发布到公共云端社区前，需要先完成微信云登录。',
        confirmText: '去登录',
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
        if (path) this.setData({ previewImage: path });
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
    if (!userInfo || userInfo.mode !== 'wechat_cloud') {
      wx.showToast({ title: '请先完成微信云登录', icon: 'none' });
      return;
    }
    const validation = community.validatePost(this.data);
    if (!validation.valid) {
      this.setData({ validationMessage: validation.message });
      wx.showToast({ title: validation.message, icon: 'none' });
      return;
    }
    this.setData({ publishing: true, validationMessage: '' });
    this.commitPublish(userInfo, validation.text);
  },

  commitPublish(userInfo, text) {
    communityCloud.publish(wx, Object.assign({}, this.data, { text }), userInfo)
      .then(() => communityCloud.getStats(wx).catch(() => null))
      .then(() => {
        wx.showToast({ title: '已发布到云端', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 400);
      })
      .catch(error => {
        const message = error && error.message ? error.message : '云端发布失败，请稍后重试';
        this.setData({ publishing: false, validationMessage: message });
        wx.showToast({ title: message, icon: 'none' });
      });
  }
});
