const nav = require('../../utils/nav');
const store = require('../../utils/store');
const flow = require('../../utils/safety-flow');
Page({
  data: {
    items: [
      { id: 'breathing', title: '呼吸困难或喉头发紧', desc: '喘不上气、说话困难', icon:'/assets/figma/s04-imgIconDangerBreathing.svg', selected:false },
      { id: 'conscious', title: '意识异常、晕厥或极度虚弱', desc: '站立不稳、反应明显变慢', icon:'/assets/figma/s04-imgIconDangerConsciousness.svg', selected:false },
      { id: 'swelling', title: '面部、舌头或嘴唇迅速肿胀', desc: '尤其伴随声音改变或吞咽困难', icon:'/assets/figma/s04-imgIconDangerSwelling.svg', selected:false },
      { id: 'systemic', title: '全身风团并伴恶心、腹痛或呕吐', desc: '多个身体系统同时出现异常', icon:'/assets/figma/s04-imgIconDangerSwelling.svg', selected:false, mark: '◉' },
      { id: 'spread', title: '症状在短时间内快速扩散', desc: '红肿或全身不适迅速加重', icon:'/assets/figma/s04-imgIconDangerSpread.svg', selected:false }
    ],
    selected: []
  },
  onLoad(query = {}) {
    this.pendingType = query.contactType || '';
    const draft = store.get('safetyDraft', {});
    if (draft.completedAt) { flow.persist(flow.newDraft()); return; }
  },
  back() { nav.back(); },
  toggle(event) {
    const id = event.currentTarget.dataset.id; const selected = [...this.data.selected]; const index = selected.indexOf(id);
    if (index >= 0) selected.splice(index, 1); else selected.push(id); const items=this.data.items.map(item=>({...item,selected:selected.includes(item.id)}));this.setData({ selected,items });
  },
  emergency() {
    const draft = store.get('safetyDraft', {});
    const dangerSignals = this.data.selected.length ? this.data.selected : ['reported'];
    const next = { ...draft, ...flow.newDraft(), contactType: this.pendingType || draft.contactType || '', dangerSignals, screened: true,
      matchedRules: [{ id: 'danger_' + dangerSignals[0], text: '报告了危险信号，应立即求助。' }], ruleVersion: require('../../utils/risk').RULE_VERSION };
    if (wx && typeof wx.setStorageSync === 'function') flow.persist(next);
    if (typeof getApp === 'function') getApp().globalData.draftEvent = next;
    wx.redirectTo({ url: '/pages/result/result?level=emergency' });
  },
  goEmergency() { this.emergency(); },
  continueFlow() {
    const draft = store.get('safetyDraft', {});
    // “没有以上情况”是一个明确的继续选择：即使刚才误点了卡片，也不能被带入紧急页。
    const dangerSignals = [];
    this.setData({ selected: dangerSignals, items: this.data.items.map(item => ({ ...item, selected: false })) });
    if (wx && typeof wx.setStorageSync === 'function') flow.persist({ ...draft, screened: true, dangerSignals, step: 1 });
    wx.navigateTo({ url: '/pages/contact/contact' });
  },
  continueGuide() { this.continueFlow(); }
});
