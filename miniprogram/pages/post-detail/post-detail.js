const mock = require('../../utils/mock.js');

Page({
  data: {
    post: null
  },

  onLoad(options) {
    const all = (wx.getStorageSync('posts') || []).concat(mock.POSTS);
    let post = all.find(p => p.id === options.id);
    if (!post) {
      post = mock.POSTS[0];
    }
    this.setData({ post: post });
  },

  report() {
    wx.showModal({
      title: '举报该帖子',
      content: '将提交举报，平台会进行审核。',
      confirmText: '举报',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已收到举报', icon: 'success' });
        }
      }
    });
  }
});
