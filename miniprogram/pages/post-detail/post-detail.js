const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: { post: {}, comment: '', commentList: [], commentPlaceholder: '友善地分享经验…', commentFocus: false, replyTo: '', followed: false, liked: false, favorited: false },
  onLoad(query) {
    this.postId = query.id;
    this.loadPost();
  },
  loadPost() {
    const posts = store.get('posts', []);
    const post = posts.find(item => item.id === this.postId) || posts[0] || {};
    this.postId = this.postId || post.id;
    const reactions = store.get('postReactions', {})[this.postId] || {};
    const follows = store.get('postFollows', {});
    const savedComments = store.get('postComments', {})[this.postId] || [];
    const starter = { id: 'starter', author: '林间观察员', text: '我也在近水路段遇到过，复查提醒很有用。', time: '刚刚' };
    const commentList = [starter].concat(savedComments.map((item, index) => Object.assign({}, item, { id: 'comment-' + index, author: item.author || '我', time: '刚刚', text: item.replyTo ? '回复 @' + item.replyTo + '：' + item.text : item.text })));
    this.setData({ post: Object.assign({}, post, { initial: (post.author || '访').charAt(0) }), liked: !!reactions.liked, favorited: !!reactions.favorited, followed: !!follows[this.postId], commentList });
  },
  back() { nav.back(); },
  danger() {
    wx.navigateTo({ url: '/pages/contact/contact?source=post&contactType=' + encodeURIComponent(this.data.post.type || '') });
  },
  viewRoute() { wx.navigateTo({ url: '/pages/route/route?from=post&postId=' + encodeURIComponent(this.postId || '') }); },
  input(e) { this.setData({ comment: e.detail.value }); },
  blurComment() { this.setData({ commentFocus: false }); },
  focusComment() { this.setData({ commentFocus: true }); },
  reply(e) {
    const replyTo = e.currentTarget.dataset.name;
    this.setData({ replyTo, commentPlaceholder: '回复 ' + replyTo + '…', commentFocus: true });
  },
  toggleFollow() {
    const follows = store.get('postFollows', {}); const followed = !follows[this.postId];
    follows[this.postId] = followed; store.set('postFollows', follows);
    this.setData({ followed }); wx.showToast({ title: followed ? '已关注作者' : '已取消关注', icon: 'none' });
  },
  updateReaction(key, countKey) {
    const reactions = store.get('postReactions', {}); const current = reactions[this.postId] || {};
    const enabled = !current[key]; current[key] = enabled; reactions[this.postId] = current; store.set('postReactions', reactions);
    const posts = store.get('posts', []).map(item => item.id === this.postId ? Object.assign({}, item, { [countKey]: Math.max(0, (item[countKey] || 0) + (enabled ? 1 : -1)) }) : item);
    store.set('posts', posts); this.loadPost();
    wx.showToast({ title: enabled ? (key === 'liked' ? '已点赞' : '已收藏') : (key === 'liked' ? '已取消点赞' : '已取消收藏'), icon: 'none' });
  },
  toggleLike() { this.updateReaction('liked', 'likes'); },
  toggleFavorite() { this.updateReaction('favorited', 'favorites'); },
  share() {
    wx.showActionSheet({ itemList: ['分享给微信好友', '复制帖子链接'], success: result => {
      if (result.tapIndex === 0) { wx.showShareMenu({ withShareTicket: true }); wx.showToast({ title: '请使用右上角分享', icon: 'none' }); }
      else wx.setClipboardData({ data: '虫咬识途经历：' + (this.data.post.title || '') });
    }});
  },
  send() {
    const text = this.data.comment.trim();
    if (!text) return;
    const comments = store.get('postComments', {});
    comments[this.postId] = (comments[this.postId] || []).concat({ author: store.get('user', { nickname: '林间观察员' }).nickname, text, replyTo: this.data.replyTo, createdAt: Date.now() });
    store.set('postComments', comments);
    const posts = store.get('posts', []).map(item => item.id === this.postId ? Object.assign({}, item, { comments: (item.comments || 0) + 1 }) : item);
    store.set('posts', posts);
    this.setData({ comment: '', replyTo: '', commentPlaceholder: '友善地分享经验…', commentFocus: false });
    this.loadPost();
    wx.showToast({ title: '评论已发布' });
  },
  report() {
    wx.showActionSheet({
      itemList: ['误导性医疗结论', '不当内容', '侵犯隐私'],
      success: () => {
        const reports = store.get('postReports', {});
        reports[this.postId] = true;
        store.set('postReports', reports);
        wx.showToast({ title: '已提交举报' });
      }
    });
  },
  onShareAppMessage() { return { title: this.data.post.title || '虫咬识途经历分享', path: '/pages/post-detail/post-detail?id=' + this.postId }; }
});
