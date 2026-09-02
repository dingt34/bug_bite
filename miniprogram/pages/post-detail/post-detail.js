const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const communityCloud = require('../../utils/community-cloud.js');
const cloud = require('../../utils/cloud.js');

function normalizeThread(data) {
  const sourcePost = data && data.post;
  if (!sourcePost) throw new Error('内容不存在');
  const post = Object.assign({}, sourcePost, {
    id: sourcePost._id || sourcePost.id,
    displayName: sourcePost.author || sourcePost.displayName || '户外同行者',
    avatarText: String(sourcePost.author || sourcePost.displayName || '户').slice(0, 1),
    imageRefs: sourcePost.imageFileIds || sourcePost.imageRefs || [],
    tags: sourcePost.tags || [sourcePost.region, sourcePost.type, sourcePost.stage].filter(Boolean),
    routePlan: sourcePost.routePlan || (sourcePost.route ? {
      startName: sourcePost.region || '已共享路线',
      waypointNames: [],
      endName: '查看路线',
      routeName: sourcePost.route,
      distanceText: '',
      durationText: ''
    } : null),
    commentCount: Number(sourcePost.comments) || 0,
    canDelete: false
  });
  const comments = (data.comments || []).map(item => Object.assign({}, item, {
    id: item._id || item.id,
    displayName: item.author || item.displayName || '户外同行者',
    avatarText: String(item.author || item.displayName || '户').slice(0, 1),
    replies: []
  }));
  return { post, comments, reported: false };
}

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
    commentVoteBusy: '',
    commentSort: 'latest',
    replyingTo: null,
    commentInputFocus: false,
    commentSubmitting: false,
    reportReasons: ['医疗误导', '不当或冒犯内容', '广告或垃圾信息', '侵犯隐私', '其他']
  },

  onLoad(options) {
    this.postId = options.id;
  },

  onShow() {
    this.loadThread();
  },

  back() {
    wx.navigateBack();
  },

  loadThread() {
    const token = (this.loadToken || 0) + 1;
    this.loadToken = token;
    this.setData({ loading: true, loadError: '' });
    return communityCloud.getThread(wx, this.postId).then(result => {
      if (result && result.post) return result;
      return cloud.call('community', { action: 'get', postId: this.postId }).then(normalizeThread);
    }).then(result => {
      if (this.loadToken !== token) return;
      const comments = this.sortComments(result.comments, this.data.commentSort);
      this.setData({
        post: result.post,
        reported: result.reported,
        comments,
        commentCount: Number(result.post.commentCount) ||
          (result.comments || []).filter(comment => !comment.deleted).length,
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

  focusComments() {
    wx.createSelectorQuery().select('.comment-composer').boundingClientRect(rect => {
      if (rect) wx.pageScrollTo({ scrollTop: Math.max(0, rect.top - 120), duration: 250 });
    }).exec();
  },

  toggleReaction(key) {
    if (this.data.actionBusy) return;
    this.setData({ actionBusy: key });
    return communityCloud.toggleReaction(wx, this.postId, key)
      .then(result => {
        const reaction = result.reaction || {};
        const post = this.data.post || {};
        const countKey = key === 'liked' ? 'likeCount' : 'collectCount';
        const previousValue = !!post[key];
        const nextValue = !!reaction[key];
        const nextCount = typeof result[countKey] === 'number'
          ? result[countKey]
          : Math.max(0, (post[countKey] || 0) + (nextValue ? 1 : -1) - (previousValue ? 1 : 0));
        this.setData({ post: Object.assign({}, post, reaction, { [countKey]: nextCount }) });
        if (key === 'collected') communityCloud.getStats(wx).catch(() => null);
      })
      .catch(error => wx.showToast({ title: error.message || '操作失败', icon: 'none' }))
      .then(() => this.setData({ actionBusy: '' }));
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value || '' });
  },

  sortComments(comments, mode) {
    const flat = [];
    (comments || []).forEach(comment => {
      const root = Object.assign({}, comment);
      const replies = root.replies || [];
      delete root.replies;
      flat.push(root);
      replies.forEach(reply => flat.push(Object.assign({}, reply)));
    });
    const roots = [];
    const repliesByRoot = {};
    flat.forEach(comment => {
      if (comment.rootCommentId) {
        if (!repliesByRoot[comment.rootCommentId]) repliesByRoot[comment.rootCommentId] = [];
        repliesByRoot[comment.rootCommentId].push(comment);
      } else {
        roots.push(comment);
      }
    });
    const rootIds = {};
    roots.forEach(comment => { rootIds[comment.id] = true; });
    Object.keys(repliesByRoot).forEach(rootId => {
      if (!rootIds[rootId]) {
        repliesByRoot[rootId].forEach(reply => roots.push(Object.assign({}, reply, {
          rootCommentId: '',
          parentCommentId: ''
        })));
        delete repliesByRoot[rootId];
      }
    });
    roots.forEach(comment => {
      comment.replies = (repliesByRoot[comment.id] || []).sort((a, b) =>
        (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0) ||
        String(a.id).localeCompare(String(b.id))
      );
      comment.repliesExpanded = !!(this.expandedReplies && this.expandedReplies[comment.id]);
    });
    if (mode === 'liked') {
      roots.sort((a, b) => ((b.likeCount || 0) - (b.dislikeCount || 0)) -
        ((a.likeCount || 0) - (a.dislikeCount || 0)) ||
        (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0) ||
        String(b.id).localeCompare(String(a.id)));
      return roots;
    }
    roots.sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0) ||
      String(b.id).localeCompare(String(a.id)));
    return roots;
  },

  setCommentSort(e) {
    const mode = e.currentTarget.dataset.mode === 'liked' ? 'liked' : 'latest';
    this.setData({
      commentSort: mode,
      comments: this.sortComments(this.data.comments, mode)
    });
  },

  toggleCommentVote(e) {
    const commentId = e.currentTarget.dataset.id;
    const vote = e.currentTarget.dataset.vote === 'down' ? 'down' : 'up';
    if (!commentId || this.data.commentVoteBusy) return;
    this.setData({ commentVoteBusy: commentId });
    communityCloud.toggleCommentVote(wx, commentId, vote).then(result => {
      const updateVote = comment => comment.id === commentId
        ? Object.assign({}, comment, {
          liked: !!result.liked,
          disliked: !!result.disliked,
          likeCount: result.likeCount || 0,
          dislikeCount: result.dislikeCount || 0
        })
        : comment;
      const comments = this.data.comments.map(root => Object.assign({}, updateVote(root), {
        replies: (root.replies || []).map(updateVote)
      }));
      this.setData({ comments: this.sortComments(comments, this.data.commentSort) });
    }).catch(error => wx.showToast({ title: error.message || '操作失败', icon: 'none' }))
      .then(() => this.setData({ commentVoteBusy: '' }));
  },

  startReply(e) {
    const commentId = e.currentTarget.dataset.id;
    const displayName = e.currentTarget.dataset.name || '该用户';
    const rootCommentId = e.currentTarget.dataset.root || commentId;
    if (!commentId) return;
    this.setData({
      replyingTo: { id: commentId, displayName, rootCommentId },
      commentInputFocus: true
    });
  },

  cancelReply() {
    this.setData({ replyingTo: null, commentInputFocus: false });
  },

  toggleReplies(e) {
    const rootCommentId = e.currentTarget.dataset.id;
    if (!rootCommentId) return;
    this.expandedReplies = Object.assign({}, this.expandedReplies || {}, {
      [rootCommentId]: !(this.expandedReplies && this.expandedReplies[rootCommentId])
    });
    const comments = this.data.comments.map(comment => comment.id === rootCommentId
      ? Object.assign({}, comment, { repliesExpanded: this.expandedReplies[rootCommentId] })
      : comment);
    this.setData({ comments });
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
    const parentCommentId = this.data.replyingTo && this.data.replyingTo.id || '';
    const replyRootId = this.data.replyingTo && this.data.replyingTo.rootCommentId || '';
    communityCloud.comment(wx, this.postId, validation.text, user, parentCommentId)
      .then(() => communityCloud.getStats(wx).catch(() => null))
      .then(() => {
        if (replyRootId) {
          this.expandedReplies = Object.assign({}, this.expandedReplies || {}, { [replyRootId]: true });
        }
        this.setData({ commentText: '', replyingTo: null, commentInputFocus: false });
        return this.loadThread();
      })
      .then(() => wx.showToast({ title: '评论已发布', icon: 'success' }))
      .catch(error => wx.showToast({ title: error.message || '评论发布失败', icon: 'none' }))
      .then(() => this.setData({ commentSubmitting: false }));
  },

  findComment(commentId) {
    for (const root of this.data.comments || []) {
      if (root.id === commentId) return root;
      const reply = (root.replies || []).find(item => item.id === commentId);
      if (reply) return reply;
    }
    return null;
  },

  openCommentMenu(e) {
    const commentId = e.currentTarget.dataset.id;
    const comment = this.findComment(commentId);
    if (!comment || comment.deleted || this.data.actionBusy) return;
    const ownComment = !!comment.canDelete;
    wx.showActionSheet({
      itemList: [ownComment ? '删除评论' : '举报评论'],
      success: () => {
        if (ownComment) this.deleteComment({ currentTarget: { dataset: { id: commentId } } });
        else this.chooseCommentReport(commentId);
      }
    });
  },

  chooseCommentReport(commentId) {
    wx.showActionSheet({
      itemList: this.data.reportReasons,
      success: result => this.confirmCommentReport(commentId, this.data.reportReasons[result.tapIndex])
    });
  },

  confirmCommentReport(commentId, reason) {
    wx.showModal({
      title: '举报这条评论',
      content: '举报原因：' + reason + '。提交后将进入云端审核。',
      confirmText: '确认举报',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.setData({ actionBusy: 'report-comment-' + commentId });
        communityCloud.reportComment(wx, commentId, reason)
          .then(() => wx.showToast({ title: '评论已提交审核', icon: 'success' }))
          .catch(error => wx.showToast({ title: error.message || '举报失败', icon: 'none' }))
          .then(() => this.setData({ actionBusy: '' }));
      }
    });
  },

  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    if (this.data.actionBusy) return;
    const comment = this.findComment(commentId);
    if (!comment || !comment.canDelete) {
      wx.showToast({ title: '只能删除自己的评论', icon: 'none' });
      return;
    }
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
    const recommended = this.data.post && this.data.post.contactType || '';
    const app = getApp();
    if (app && app.globalData) app.globalData.safetyReturnPostId = this.postId;
    const params = ['fromPost=' + encodeURIComponent(this.postId)];
    if (recommended) params.push('recommended=' + encodeURIComponent(recommended));
    const query = '?' + params.join('&');
    wx.navigateTo({ url: '/pages/contact/contact' + query });
  },

  onUnload() {
    this.loadToken = (this.loadToken || 0) + 1;
  }
});
