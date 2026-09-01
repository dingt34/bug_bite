const store = require('../../utils/store');
const nav = require('../../utils/nav');

Page({
  data: { selected: '', items: [
    { id: 'bite', icon: '/assets/figma/s05-imgIconGeneratedIllustrated.svg', title: '叮咬', desc: '皮肤出现包、红点或瘙痒' },
    { id: 'sting', icon: '/assets/figma/s05-imgIconGeneratedIllustrated1.svg', title: '蜇伤', desc: '突然刺痛，可能见蜂或刺' },
    { id: 'attached', icon: '/assets/figma/s05-imgIconGeneratedIllustrated2.svg', title: '发现附着虫体', desc: '虫体仍附着或刚被移除' },
    { id: 'contact', icon: '/assets/figma/s05-imgIconGeneratedIllustrated3.svg', title: '接触或刺激', desc: '碰触后刺痒、灼热或起疹' },
    { id: 'unknown', icon: '/assets/figma/s05-imgIconGeneratedIllustrated4.svg', title: '不确定 / 没有看到虫体', desc: '可以继续通过环境、表现和变化完成判断' }
  ] },
  onLoad() {
    const draft = store.get('safetyDraft', {});
    if (draft.contactType) this.setData({ selected: draft.contactType });
  },
  back() { nav.back(); },
  persist(showToast) {
    const draft = store.get('safetyDraft', {});
    store.set('safetyDraft', { ...draft, step: 2, contactType: this.data.selected });
    if (showToast) wx.showToast({ title: '草稿已保存' });
  },
  save() { this.persist(true); },
  select(event) { this.setData({ selected: event.currentTarget.dataset.id }, () => this.persist(false)); },
  next() {
    if (!this.data.selected) {
      wx.showToast({ title: '请选择一种接触类型', icon: 'none' });
      return;
    }
    this.persist(false);
    wx.navigateTo({ url: `/pages/guide/guide?type=${this.data.selected}` });
  }
});
