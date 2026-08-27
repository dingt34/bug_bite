const auth = require('../../utils/auth.js');
const social = require('../../utils/community-social.js');

Page({
  data: {
    friendId: '',
    friend: null,
    messages: [],
    inputText: '',
    loading: true,
    loadError: '',
    sending: false,
    scrollIntoView: ''
  },

  onLoad(options) {
    const friendId = decodeURIComponent(options.id || '');
    const name = decodeURIComponent(options.name || '好友');
    this.setData({ friendId });
    if (wx.setNavigationBarTitle) wx.setNavigationBarTitle({ title: name });
  },

  onShow() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      this.setData({ loading: false, loadError: '请先完成微信云登录' });
      return;
    }
    this.loadMessages();
  },

  onPullDownRefresh() {
    this.loadMessages(true);
  },

  loadMessages(pullDown) {
    this.setData({ loading: true, loadError: '' });
    return social.getMessages(wx, this.data.friendId).then(result => {
      const messages = result.messages || [];
      this.setData({
        friend: result.friend,
        messages,
        loading: false,
        loadError: '',
        scrollIntoView: messages.length ? 'msg-' + messages[messages.length - 1].id : ''
      });
    }).catch(error => {
      this.setData({ loading: false, loadError: error.message || '私信加载失败' });
    }).then(() => {
      if (pullDown && wx.stopPullDownRefresh) wx.stopPullDownRefresh();
    });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value || '' });
  },

  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.sending) return;
    this.setData({ sending: true });
    social.sendMessage(wx, this.data.friendId, text).then(() => {
      this.setData({ inputText: '' });
      return this.loadMessages();
    }).catch(error => {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    }).then(() => this.setData({ sending: false }));
  },

  viewPost(e) {
    wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + e.currentTarget.dataset.id });
  },

  retryLoad() {
    this.loadMessages();
  }
});
