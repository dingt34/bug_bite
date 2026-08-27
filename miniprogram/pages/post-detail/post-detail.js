const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const communityCloud = require('../../utils/community-cloud.js');
const social = require('../../utils/community-social.js');

Page({
  data: {
    post: null,
    reported: false,
    comments: [],
    commentText: '',
    commentCount: 0,
    canDelete: false,
    loading: true,
    loadError: '',
    actionBusy: '',
    commentSubmitting: false,
    reportReasons: ['医疗误导', '不当或冒犯内容', '广告或垃圾信息', '侵犯隐私', '其他'],
    authorCard: null,
    friendBusy: false
  },

  onLoad(options) {
    this.postId = options.id;
  },

  onShow() {
    this.loadThread();
  },

  loadThread() {
    const token = (this.loadToken || 0) + 1;
    this.loadToken = token;
    this.setData({ loading: true, loadError: '' });
    return communityCloud.getThread(wx, this.postId).then(result => {
      if (this.loadToken !== token) return;
      this.setData({
        post: result.post,
        reported: result.reported,
        comments: result.comments,
        commentCount: result.comments.length,
        canDelete: !!result.post.canDelete,
        loading: false,
        loadError: ''
      });
      social.getAuthorCard(wx, this.postId)
        .then(card => this.setData({ authorCard: card }))
        .catch(() => {});
    }).catch(error => {
      if (this.loadToken !== token) return;
      const message = error && error.message ? error.message : '帖子加载失败';
      this.setData({ loading: false, loadError: message });
      if (message.indexOf('不存在') > -1 && !this.missingHandled) {
        this.missingHandled = true;
        wx.showModal({
          title: '帖子不存在',
          content: '该帖子可能已被作者删除。',
          showCancel: false,
          success: () => wx.navigateBack()
        });
      }
    });
  },

  toggleLike() {
    this.toggleReaction('liked');
  },

  toggleCollect() {
    this.toggleReaction('collected');
  },

  toggleReaction(key) {
    if (this.data.actionBusy) return;
    this.setData({ actionBusy: key });
    communityCloud.toggleReaction(wx, this.postId, key)
      .then(() => key === 'collected' ? communityCloud.getStats(wx).catch(() => null) : null)
      .then(() => this.loadThread())
      .catch(error => wx.showToast({ title: error.message || '操作失败', icon: 'none' }))
      .then(() => this.setData({ actionBusy: '' }));
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value || '' });
  },

  submitComment() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.showModal({
        title: '需要微信云登录',
        content: '评论会公开保存到云端社区，请先完成微信云登录。',
        confirmText: '去登录',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    const validation = community.validateComment(this.data.commentText);
    if (!validation.valid) {
      wx.showToast({ title: validation.message, icon: 'none' });
      return;
    }
    if (this.data.commentSubmitting) return;
    this.setData({ commentSubmitting: true });
    communityCloud.comment(wx, this.postId, validation.text, user)
      .then(() => communityCloud.getStats(wx).catch(() => null))
      .then(() => {
        this.setData({ commentText: '' });
        return this.loadThread();
      })
      .then(() => wx.showToast({ title: '评论已发布', icon: 'success' }))
      .catch(error => wx.showToast({ title: error.message || '评论发布失败', icon: 'none' }))
      .then(() => this.setData({ commentSubmitting: false }));
  },

  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    if (this.data.actionBusy) return;
    wx.showModal({
      title: '删除我的评论',
      content: '删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ actionBusy: 'comment-' + commentId });
        communityCloud.deleteComment(wx, commentId)
          .then(() => communityCloud.getStats(wx).catch(() => null))
          .then(() => this.loadThread())
          .then(() => wx.showToast({ title: '评论已删除', icon: 'success' }))
          .catch(error => wx.showToast({ title: error.message || '删除失败', icon: 'none' }))
          .then(() => this.setData({ actionBusy: '' }));
      }
    });
  },

  deletePost() {
    if (!this.data.canDelete || this.data.actionBusy) return;
    wx.showModal({
      title: '删除我的分享',
      content: '删除后将不再在云端社群显示，且无法恢复。',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ actionBusy: 'delete' });
        communityCloud.deletePost(wx, this.postId)
          .then(() => communityCloud.getStats(wx).catch(() => null))
          .then(() => {
            wx.showToast({ title: '分享已删除', icon: 'success' });
            wx.navigateBack();
          })
          .catch(error => {
            this.setData({ actionBusy: '' });
            wx.showToast({ title: error.message || '删除失败', icon: 'none' });
          });
      }
    });
  },

  goEdit() {
    if (!this.data.canDelete || this.data.actionBusy) return;
    wx.navigateTo({ url: '/pages/post-publish/post-publish?id=' + this.postId });
  },

  handleFriendAction() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.showModal({
        title: '需要微信云登录',
        content: '添加好友和发送私信前，请先完成微信云登录。',
        confirmText: '去登录',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    const card = this.data.authorCard;
    if (!card || this.data.friendBusy) return;
    if (card.status === 'accepted') {
      wx.navigateTo({
        url: '/pages/friend-chat/friend-chat?id=' + encodeURIComponent(card.user.id) +
          '&name=' + encodeURIComponent(card.user.displayName)
      });
      return;
    }
    if (card.status === 'outgoing') {
      wx.showToast({ title: '好友申请已发送', icon: 'none' });
      return;
    }
    this.setData({ friendBusy: true });
    const request = card.status === 'incoming'
      ? social.respondFriendRequest(wx, card.requestId, true)
      : social.sendFriendRequest(wx, this.postId);
    request.then(result => {
      const status = result.status || 'outgoing';
      this.setData({ authorCard: Object.assign({}, card, { status }) });
      wx.showToast({ title: status === 'accepted' ? '已成为好友' : '好友申请已发送', icon: 'success' });
    }).catch(error => wx.showToast({ title: error.message || '操作失败', icon: 'none' }))
      .then(() => this.setData({ friendBusy: false }));
  },

  forwardToFriend() {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.showToast({ title: '请先完成微信云登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/friends/friends?mode=forward&postId=' + this.postId });
  },

  onShareAppMessage() {
    const post = this.data.post || {};
    return {
      title: (post.displayName || '社群用户') + '分享了一条虫咬防护经历',
      path: '/pages/post-detail/post-detail?id=' + this.postId,
      imageUrl: (post.imageRefs || [])[0] || ''
    };
  },

  previewImage(e) {
    const urls = this.data.post.imageRefs || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  report() {
    if (this.data.reported) {
      wx.showToast({ title: '已提交云端审核', icon: 'none' });
      return;
    }
    if (wx.showActionSheet) {
      wx.showActionSheet({
        itemList: this.data.reportReasons,
        success: result => this.confirmReport(this.data.reportReasons[result.tapIndex])
      });
      return;
    }
    this.confirmReport('其他');
  },

  confirmReport(reason) {
    wx.showModal({
      title: '举报不当内容',
      content: '举报原因：' + reason + '。提交后内容将从你的社群列表隐藏，并进入云端审核。',
      confirmText: '确认举报',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ actionBusy: 'report' });
        communityCloud.report(wx, this.postId, reason)
          .then(() => {
            this.setData({ reported: true });
            wx.showToast({ title: '已提交云端审核', icon: 'success' });
          })
          .catch(error => wx.showToast({ title: error.message || '举报失败', icon: 'none' }))
          .then(() => this.setData({ actionBusy: '' }));
      }
    });
  },

  retryLoad() {
    this.missingHandled = false;
    this.loadThread();
  },

  goSafety() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },

  onUnload() {
    this.loadToken = (this.loadToken || 0) + 1;
  }
});
