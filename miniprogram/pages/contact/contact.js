const store = require('../../utils/store');
const nav = require('../../utils/nav');
const flow = require('../../utils/safety-flow');

Page({
  data: { selected: '', submitting: false, items: [
    { id: 'bite', icon: '/assets/figma/s05-imgIconGeneratedIllustrated.svg', title: '叮咬', desc: '皮肤出现包、红点或瘙痒' },
    { id: 'sting', icon: '/assets/figma/s05-imgIconGeneratedIllustrated1.svg', title: '蜇伤', desc: '突然刺痛，可能见蜂或刺' },
    { id: 'attached', icon: '/assets/figma/s05-imgIconGeneratedIllustrated2.svg', title: '发现附着虫体', desc: '虫体仍附着或刚被移除' },
    { id: 'contact', icon: '/assets/figma/s05-imgIconGeneratedIllustrated3.svg', title: '接触或刺激', desc: '碰触后刺痒、灼热或起疹' },
    { id: 'unknown', icon: '/assets/figma/s05-imgIconGeneratedIllustrated4.svg', title: '不确定 / 没有看到虫体', desc: '可以继续通过环境、表现和变化完成判断' }
  ] },
  onLoad(query = {}) {
    let draft = store.get('safetyDraft', {});
    const pages = getCurrentPages();
    const previous = pages.length > 1 ? pages[pages.length - 2] : null;
    // 仅在本页承接上一步事实，不修改组员的危险信号页面。
    if (previous && previous.route === 'pages/danger/danger') {
      if (!draft.sessionId || draft.completedAt) draft = flow.newDraft();
      const dangerSignals = previous.data.selected || [];
      draft = { ...draft, dangerSignals, screened: true };
      if (!flow.persist(draft)) return;
      if (dangerSignals.length) {
        wx.redirectTo({ url: '/pages/result/result' }); return;
      }
    }
    if (!draft.screened || (draft.dangerSignals || []).length) {
      wx.redirectTo({ url: '/pages/danger/danger' });
      return;
    }
    if (draft.contactType) this.setData({ selected: flow.normalizeType(draft.contactType) });
    else if (query.type || query.contactType) this.setData({ selected: flow.normalizeType(query.type || query.contactType) });
  },
  onShow() { this.setData({ submitting: false }); },
  back() { nav.back(); },
  persist(showToast) {
    const draft = store.get('safetyDraft', {});
    const changed = draft.contactType && draft.contactType !== this.data.selected;
    const next = { ...draft, step: Math.max(2, draft.step || 1), contactType: this.data.selected };
    // 保留同一事件的共同症状；切换分支时只清除不适用的分支回答和旧结果。
    if (changed) { next.facts = {}; next.level = ''; next.completedAt = null; next.step = 2; }
    const saved = flow.persist(next);
    if (saved && showToast) wx.showToast({ title: '草稿已保存' });
    return saved;
  },
  save() { this.persist(true); },
  select(event) {
    const selected = event.currentTarget.dataset.id;
    if (flow.typeNames[selected]) this.setData({ selected }, () => this.persist(false));
  },
  next() {
    if (this.data.submitting) return;
    if (!this.data.selected) {
      wx.showToast({ title: '请选择一种接触类型', icon: 'none' });
      return;
    }
    if (!this.persist(false)) return;
    this.setData({ submitting: true });
    wx.navigateTo({ url: `/pages/guide/guide?type=${this.data.selected}`, fail: () => this.setData({ submitting: false }) });
  }
});
