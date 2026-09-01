const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: { post: {}, comment: '' },
  onLoad(query) {
    this.postId = query.id;
    this.loadPost();
  },
  loadPost() {
    const posts = store.get('posts', []);
    const post = posts.find(item => item.id === this.postId) || posts[0] || {};
    this.setData({ post: Object.assign({}, post, { initial: (post.author || '访').charAt(0) }) });
  },
  back() { nav.back(); },
  danger() {
    wx.navigateTo({ url: '/pages/contact/contact?source=post&contactType=' + encodeURIComponent(this.data.post.type || '') });
  },
  input(e) { this.setData({ comment: e.detail.value }); },
  send() {
    const text = this.data.comment.trim();
    if (!text) return;
    const comments = store.get('postComments', {});
    comments[this.postId] = (comments[this.postId] || []).concat({ text, createdAt: Date.now() });
    store.set('postComments', comments);
    const posts = store.get('posts', []).map(item => item.id === this.postId ? Object.assign({}, item, { comments: (item.comments || 0) + 1 }) : item);
    store.set('posts', posts);
    this.setData({ comment: '' });
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
  }
});
