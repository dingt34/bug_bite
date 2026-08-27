const auth = require('../../utils/auth.js');
const social = require('../../utils/community-social.js');

Page({
  data: {
    friends: [],
    requests: [],
    unreadCount: 0,
    mode: 'chat',
    postId: '',
    loading: true,
    loadError: '',
    loginRequired: false,
    actionId: ''
  },

  onLoad(options) {
    this.setData({
      mode: options && options.mode === 'forward' ? 'forward' : 'chat',
      postId: options && options.postId || ''
    });
    if (this.data.mode === 'forward' && wx.setNavigationBarTitle) {
      wx.setNavigationBarTitle({ title: '转发给好友' });
    }
  },

  onShow() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      this.setData({ loading: false, loadError: '请先完成微信云登录后使用好友与私信功能', loginRequired: true });
      return;
    }
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true, loadError: '', loginRequired: false });
    return social.getFriends(wx).then(result => {
      this.setData({
        friends: result.friends || [],
        requests: result.requests || [],
        unreadCount: result.unreadCount || 0,
        loading: false,
        loadError: ''
      });
    }).catch(error => {
      this.setData({
        loading: false,
        loadError: error && error.message ? error.message : '好友列表加载失败'
      });
    });
  },

  selectFriend(e) {
    const friendId = e.currentTarget.dataset.id;
    const friendName = e.currentTarget.dataset.name || '好友';
    if (this.data.mode === 'forward') {
      if (this.data.actionId || !this.data.postId) return;
      this.setData({ actionId: friendId });
      social.forwardPost(wx, friendId, this.data.postId).then(() => {
        wx.showToast({ title: '已转发给好友', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 350);
      }).catch(error => {
        wx.showToast({ title: error.message || '转发失败', icon: 'none' });
        this.setData({ actionId: '' });
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/friend-chat/friend-chat?id=' + encodeURIComponent(friendId) +
        '&name=' + encodeURIComponent(friendName)
    });
  },

  acceptRequest(e) {
    this.respondRequest(e.currentTarget.dataset.id, true);
  },

  rejectRequest(e) {
    this.respondRequest(e.currentTarget.dataset.id, false);
  },

  respondRequest(requestId, accept) {
    if (this.data.actionId) return;
    this.setData({ actionId: requestId });
    social.respondFriendRequest(wx, requestId, accept)
      .then(() => {
        wx.showToast({ title: accept ? '已成为好友' : '已忽略申请', icon: 'success' });
        return this.loadData();
      })
      .catch(error => wx.showToast({ title: error.message || '操作失败', icon: 'none' }))
      .then(() => this.setData({ actionId: '' }));
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  retryLoad() {
    this.loadData();
  }
});
