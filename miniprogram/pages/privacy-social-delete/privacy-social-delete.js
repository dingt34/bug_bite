const store = require('../../utils/store');
const nav = require('../../utils/nav');

function timeText(value) {
  if (!value) return '刚刚发布';
  if (typeof value === 'string') return value;
  const date = new Date(value);
  return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}

Page({
  data: { posts: [], comments: [], nickname: '林间观察员', initial: '林' },
  onShow() { this.load(); },
  load() {
    const user = store.get('user', { nickname: '林间观察员' });
    const nickname = user.nickname || '林间观察员';
    const posts = store.get('posts', []).filter(item => item.author === nickname).map(item => ({
      id: item.id, title: item.title || '未命名经历', time: timeText(item.createdAt), route: item.route ? '已公开完整路线' : '未公开完整路线'
    }));
    const postMap = {}; store.get('posts', []).forEach(item => { postMap[item.id] = item; });
    const comments = [];
    const allComments = store.get('postComments', {});
    Object.keys(allComments).forEach(postId => (allComments[postId] || []).forEach((item, index) => {
      if ((item.author || '我') === nickname || !item.author) comments.push({ postId, index, text: item.text, time: timeText(item.createdAt), postTitle: (postMap[postId] || {}).title || '已删除的经历' });
    }));
    this.setData({ posts, comments, nickname, initial: nickname.charAt(0) });
  },
  back() { nav.back(); },
  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.posts.find(post => post.id === id);
    wx.showModal({ title: '删除这条经历？', content: '将删除该经历、关联图片和你主动公开的路线；其他用户的内容不会受影响。', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      store.set('posts', store.get('posts', []).filter(post => post.id !== id));
      const comments = store.get('postComments', {}); delete comments[id]; store.set('postComments', comments);
      wx.showToast({ title: '已删除' }); this.load();
    }});
  },
  deleteComment(e) {
    const postId = e.currentTarget.dataset.postid; const index = e.currentTarget.dataset.index;
    wx.showModal({ title: '删除这条评论？', content: '删除后无法恢复，其他用户的帖子和评论不会受到影响。', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      const all = store.get('postComments', {}); const list = all[postId] || []; list.splice(index, 1); all[postId] = list; store.set('postComments', all);
      wx.showToast({ title: '已删除' }); this.load();
    }});
  }
});
