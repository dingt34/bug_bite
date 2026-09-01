const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

Page({
  data: { region: '浙江丽水', type: '叮咬', stage: '观察完成', text: '', images: [], route: true },
  onLoad() {
    const draft = store.get('postDraft', null);
    if (draft) this.setData(draft);
  },
  back() { nav.back(); },
  input(e) { this.setData({ text: e.detail.value }); },
  selectRegion() { this.choose('region', ['浙江杭州', '浙江宁波', '浙江温州', '浙江丽水', '浙江台州']); },
  selectType() { this.choose('type', ['叮咬', '蜇伤', '发现附着虫体', '接触后皮疹/不适', '不确定']); },
  selectStage() { this.choose('stage', ['刚发生', '处理中', '观察中', '观察完成']); },
  choose(key, itemList) { wx.showActionSheet({ itemList, success: result => this.setData({ [key]: itemList[result.tapIndex] }) }); },
  image() { wx.chooseMedia({ count: 3, mediaType: ['image'], success: result => this.setData({ images: result.tempFiles.map(item => item.tempFilePath) }) }); },
  toggle(e) { this.setData({ route: e.detail.value }); },
  noop() {},
  planRoute() { wx.navigateTo({ url: '/pages/route/route?from=publish' }); },
  save() { store.set('postDraft', this.data); wx.showToast({ title: '草稿已保存' }); },
  publish() {
    if (this.data.text.trim().length < 20) { wx.showToast({ title: '请至少填写 20 个字', icon: 'none' }); return; }
    const record = { id: store.id('post'), author: store.get('user', { nickname: '林间观察员' }).nickname, region: this.data.region, type: this.data.type, stage: this.data.stage, title: this.data.text.slice(0, 18), text: this.data.text, route: this.data.route ? '丽水徒步路线 · 12.6 km' : '', likes: 0, comments: 0, favorites: 0 };
    const posts = store.get('posts', []); posts.unshift(record); store.set('posts', posts); store.remove('postDraft');
    cloud.background('community', Object.assign({ action: 'publish', imageFileIds: [] }, record));
    wx.showToast({ title: '发布成功' }); setTimeout(() => wx.navigateBack(), 500);
  }
});
