const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const communityCloud = require('../../utils/community-cloud.js');

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
    commentSubmitting: false
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

  previewImage(e) {
    const urls = this.data.post.imageRefs || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  report() {
    if (this.data.reported) {
      wx.showToast({ title: '已提交云端审核', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '举报不当内容',
      content: '举报会提交至云端审核，同时从你的社群列表隐藏。',
      confirmText: '确认举报',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ actionBusy: 'report' });
        communityCloud.report(wx, this.postId, '用户标记不当内容')
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
