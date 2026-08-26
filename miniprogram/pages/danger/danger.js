const mock = require('../../utils/mock.js');
const risk = require('../../utils/risk.js');

Page({
  data: {
    signals: mock.DANGER_SIGNALS,
    selected: [],
    hasDanger: false,
    contactType: ''
  },

  onLoad(options) {
    const contactType = options.contactType || '';
    this.setData({ contactType: contactType, signals: mock.DANGER_SIGNALS });
  },

  toggle(e) {
    const key = e.currentTarget.dataset.key;
    const selected = this.data.selected;
    const idx = selected.indexOf(key);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(key);
    }
    this.setData({ selected: selected, hasDanger: selected.length > 0 });
  },

  call120() {
    wx.makePhoneCall({ phoneNumber: '120', fail: () => {} });
  },

  ensureDraft() {
    const app = getApp();
    if (app.globalData.draftEvent && app.globalData.draftEvent.contactType) {
      return app.globalData.draftEvent;
    }
    const type = mock.CONTACT_TYPES.find(item => item.key === this.data.contactType) || mock.CONTACT_TYPES.find(item => item.key === 'unknown');
    const timestamp = Date.now();
    app.globalData.draftEvent = {
      id: 'event_' + timestamp,
      contactType: type.key,
      contactTypeName: type.name,
      createdAt: '刚刚',
      createdAtTimestamp: timestamp
    };
    return app.globalData.draftEvent;
  },

  goEmergency() {
    const draft = this.ensureDraft();
    draft.dangerSignals = this.data.selected.slice();
    draft.matchedRules = this.data.selected.map(key => {
      const signal = mock.DANGER_SIGNALS.find(item => item.key === key);
      return { id: 'danger_' + key, text: signal ? signal.name : key };
    });
    draft.ruleVersion = risk.RULE_VERSION;
    // 命中危险信号 → 紧急求助，跳过问答
    wx.redirectTo({ url: '/pages/result/result?level=emergency&skipGuide=1' });
  },

  continueGuide() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  }
});
