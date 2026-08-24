const mock = require('../../utils/mock.js');

Page({
  data: {
    signals: mock.DANGER_SIGNALS,
    selected: [],
    hasDanger: false,
    contactType: ''
  },

  onLoad(options) {
    this.setData({ contactType: options.contactType || '' });
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

  goEmergency() {
    const app = getApp();
    app.globalData.draftEvent.dangerSignals = this.data.selected;
    // 命中危险信号 → 紧急求助，跳过问答
    wx.redirectTo({ url: '/pages/result/result?level=emergency&skipGuide=1' });
  },

  continueGuide() {
    const app = getApp();
    app.globalData.draftEvent.dangerSignals = [];
    wx.navigateTo({ url: '/pages/guide/guide?contactType=' + this.data.contactType });
  }
});
