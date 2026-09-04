const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

function timeText(value) {
  if (!value) return '刚刚发布';
  if (typeof value === 'string') return value;
  const date = new Date(value);
  return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}

// 新数据优先使用不可变的用户 ID；为旧的仅含昵称记录保留兼容逻辑。
function isOwnedByUser(item, user, nickname) {
  if (!item) return false;
  if (user && user.id && item.authorId) return item.authorId === user.id;
  return item.author === nickname || (!item.author && !item.authorId);
}

Page({
  data: { posts: [], comments: [], nickname: '林间观察员', initial: '林', deletingId: '' },
  onShow() { this.load(); },
  load() {
    const user = store.get('user', { nickname: '林间观察员' });
    const nickname = user.nickname || '林间观察员';
    const posts = store.get('posts', []).filter(item => isOwnedByUser(item, user, nickname)).map(item => ({
      id: item.id, title: item.title || '未命名经历', time: timeText(item.createdAt), route: item.route ? '已公开完整路线' : '未公开完整路线'
    }));
    const postMap = {}; store.get('posts', []).forEach(item => { postMap[item.id] = item; });
    const comments = [];
    const allComments = store.get('postComments', {});
    Object.keys(allComments).forEach(postId => (allComments[postId] || []).forEach((item, index) => {
      if (isOwnedByUser(item, user, nickname)) comments.push({ id: item.id || '', postId, index, text: item.text, time: timeText(item.createdAt), postTitle: (postMap[postId] || {}).title || '已删除的经历' });
    }));
    this.setData({ posts, comments, nickname, initial: nickname.charAt(0) });
  },
  back() { nav.back(); },
  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || this.data.deletingId) return;
    const item = this.data.posts.find(post => post.id === id);
    wx.showModal({ title: '删除这条经历？', content: '将删除该经历、关联图片和你主动公开的路线；其他用户的内容不会受影响。', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      this.setData({ deletingId: 'post:' + id });
      cloud.call('community', { action: 'delete', postId: id }).then(() => {
        store.set('posts', store.get('posts', []).filter(post => post.id !== id));
        const comments = store.get('postComments', {}); delete comments[id]; store.set('postComments', comments);
        wx.showToast({ title: '已删除' }); this.load();
      }).catch(error => wx.showToast({ title: error.message || '云端删除失败，请稍后重试', icon: 'none' }))
        .then(() => this.setData({ deletingId: '' }));
    }});
  },
  deleteComment(e) {
    const postId = e.currentTarget.dataset.postid; const index = e.currentTarget.dataset.index;
    if (!postId || this.data.deletingId) return;
    const comment = this.data.comments.find(item => item.postId === postId && Number(item.index) === Number(index));
    wx.showModal({ title: '删除这条评论？', content: '删除后无法恢复，其他用户的帖子和评论不会受到影响。', confirmColor: '#ea4038', success: result => {
      if (!result.confirm) return;
      const deletingId = 'comment:' + postId + ':' + index;
      this.setData({ deletingId });
      const removeLocalComment = () => {
        const all = store.get('postComments', {}); const list = all[postId] || []; list.splice(index, 1); all[postId] = list; store.set('postComments', all);
        wx.showToast({ title: '已删除' }); this.load(); this.setData({ deletingId: '' });
      };
      if (!comment || !comment.id) { removeLocalComment(); return; }
      cloud.call('community', { action: 'deleteComment', commentId: comment.id })
        .then(removeLocalComment)
        .catch(error => { wx.showToast({ title: error.message || '云端删除失败，请稍后重试', icon: 'none' }); this.setData({ deletingId: '' }); });
    }});
  }
});
