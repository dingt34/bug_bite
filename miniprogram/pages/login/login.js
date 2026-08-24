const auth = require('../../utils/auth.js');
const cloudService = require('../../utils/cloud-service.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    loading: false,
    loadingText: '',
    nickname: '',
    avatarUrl: '',
    cloudReady: false,
    cloudReason: '',
    understood: false,
    errorMessage: ''
  },

  onLoad() {
    const status = cloudService.init(wx);
    this.setData({
      cloudReady: status.available,
      cloudReason: status.available ? '微信云开发已连接' : status.reason
    });
  },

  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl || '', errorMessage: '' });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value || '', errorMessage: '' });
  },

  toggleUnderstood() {
    this.setData({ understood: !this.data.understood, errorMessage: '' });
  },

  doLogin() {
    if (this.data.loading) return;
    const nickname = this.data.nickname.trim();
    if (!this.data.cloudReady) {
      this.setData({ errorMessage: this.data.cloudReason + '，请先按部署说明配置。' });
      return;
    }
    if (!this.data.avatarUrl) {
      this.setData({ errorMessage: '请先选择微信头像。' });
      return;
    }
    if (!nickname) {
      this.setData({ errorMessage: '请填写微信昵称。' });
      return;
    }

    const attempt = (this.loginAttempt || 0) + 1;
    this.loginAttempt = attempt;
    this.setData({ loading: true, loadingText: '正在上传头像并登录…', errorMessage: '' });
    this.uploadAvatar(this.data.avatarUrl)
      .then(avatarUrl => cloudService.login(wx, { displayName: nickname, avatarUrl }))
      .then(result => {
        if (this.loginAttempt !== attempt) return null;
        const userInfo = auth.saveLocalUser(wx, {
          id: 'cloud_' + result.userId,
          cloudUserId: result.userId,
          displayName: result.displayName || nickname,
          avatarText: (result.displayName || nickname).slice(0, 1),
          avatarUrl: result.avatarUrl || '',
          mode: 'wechat_cloud',
          createdAtTimestamp: result.createdAtTimestamp || Date.now()
        });
        getApp().globalData.userInfo = userInfo;
        this.setData({ loadingText: '正在恢复云端数据…' });
        return cloudSync.pullAndMerge(wx).then(() => cloudSync.pushNow(wx)).catch(() => null);
      })
      .then(() => {
        if (this.loginAttempt !== attempt) return;
        this.setData({ loading: false, loadingText: '' });
        wx.showToast({ title: '微信登录成功', icon: 'success' });
        this.finishLogin();
      })
      .catch(error => {
        if (this.loginAttempt !== attempt) return;
        this.setData({
          loading: false,
          loadingText: '',
          errorMessage: '微信云登录失败：' + (error && error.message ? error.message : '请检查网络和云环境配置')
        });
      });
  },

  uploadAvatar(path) {
    if (path.indexOf('cloud://') === 0) return Promise.resolve(path);
    const extensionMatch = path.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
    const extension = extensionMatch ? extensionMatch[1] : 'jpg';
    const cloudPath = 'avatars/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + extension;
    return cloudService.uploadFile(wx, cloudPath, path).then(result => result.fileID);
  },

  doLocalLogin() {
    if (this.data.loading) return;
    if (!this.data.understood) {
      this.setData({ errorMessage: '请先确认你已了解本地体验说明。' });
      return;
    }
    const userInfo = auth.saveLocalUser(wx, auth.createDemoUser());
    getApp().globalData.userInfo = userInfo;
    wx.showToast({ title: '体验身份已创建', icon: 'success' });
    this.finishLogin();
  },

  finishLogin() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  skipLogin() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onUnload() {
    this.loginAttempt = (this.loginAttempt || 0) + 1;
  }
});
