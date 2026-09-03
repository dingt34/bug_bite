const store = require('../../utils/store');
const nav = require('../../utils/nav');

function getCompletion(user) {
  const fields = [
    { key: 'avatar', weight: 20 },
    { key: 'nickname', weight: 20 },
    { key: 'age', weight: 20 },
    { key: 'region', weight: 20 },
    { key: 'health', weight: 20 }
  ];
  if (!user) return 0;
  const score = fields.reduce((sum, f) => {
    const v = user[f.key];
    return sum + (v != null && String(v).trim() !== '' ? f.weight : 0);
  }, 0);
  return score;
}

Page({
  data: { user: {}, event: {}, plan: {}, completion: 0 },
  onShow() {
    nav.syncTab(this, 4);
    const user = store.get('user', { nickname: '林间观察员', region: '浙江省 · 杭州市' });
    this.setData({
      user,
      completion: getCompletion(user),
      event: store.get('events', [])[0] || {},
      plan: store.get('plans', [])[0] || {}
    });
  },
  edit() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  events() { wx.navigateTo({ url: '/pages/events/events' }); },
  plans() { wx.navigateTo({ url: '/pages/my-plans/my-plans' }); },
  privacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); }
});
