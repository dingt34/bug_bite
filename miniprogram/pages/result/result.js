const mock = require('../../utils/mock.js');

const RESULT_CONTENT = {
  emergency: {
    levelName: '紧急求助',
    icon: '🚨',
    color: '#E53935',
    isEmergency: true,
    basis: '已触发危险信号，需优先排除危及生命的紧急情况（呼吸、循环或意识异常）。',
    actions: ['立即拨打 120 或前往最近急诊', '保持镇定，不要自行驾车', '向急救人员说明接触类型与已出现的危险信号'],
    review: '遵医嘱；出院后按医生要求复诊，不可自行降级。',
    checklist: ['危险信号与发生时间', '接触类型与身体部位', '虫体是否移除（如附着）', '已采取的措施']
  },
  consult: {
    levelName: '尽快咨询',
    icon: '🏥',
    color: '#F57C00',
    isEmergency: false,
    basis: '存在需要专业评估的症状或变化趋势，建议尽快获得医疗意见。',
    actions: ['尽快联系医疗机构或专业人员', '密切观察症状变化，必要时升级求助', '携带下方就医摘要前往就诊'],
    review: '建议 24 小时内复查或就诊。',
    checklist: ['症状变化时间线', '已采取措施', '可复制的就医摘要']
  },
  observe: {
    levelName: '观察记录',
    icon: '📋',
    color: '#2E7D5B',
    isEmergency: false,
    basis: '未发现高危信号，可先进行安全观察并记录变化。',
    actions: ['保持局部清洁，避免抓挠', '记录症状变化并拍照留证', '按复查时间更新情况'],
    review: '3 天后自动复查；若出现危险信号立即升级求助。',
    checklist: ['观察重点：红肿范围、疼痛瘙痒变化', '自动复查时间', '升级求助条件']
  }
};

Page({
  data: {
    level: 'observe',
    content: null,
    summary: ''
  },

  onLoad(options) {
    const level = options.level || 'observe';
    const draft = getApp().globalData.draftEvent || {};
    const content = RESULT_CONTENT[level] || RESULT_CONTENT.observe;
    const summary = this.buildSummary(draft, content);
    this.setData({ level: level, content: content, summary: summary });
    this.saveEvent(draft, level, content);
  },

  buildSummary(draft, content) {
    const parts = [];
    parts.push('接触类型：' + (draft.contactTypeName || '未知'));
    if (draft.dangerSignals && draft.dangerSignals.length) {
      parts.push('危险信号：' + draft.dangerSignals.map(k => {
        const s = mock.DANGER_SIGNALS.find(d => d.key === k);
        return s ? s.name : k;
      }).join('、'));
    }
    parts.push('分级：' + content.levelName);
    parts.push('建议：' + content.actions[0]);
    return parts.join('\n');
  },

  saveEvent(draft, level, content) {
    const event = Object.assign({}, draft, {
      id: 'event_' + Date.now(),
      riskLevel: level,
      levelName: content.levelName,
      nextReviewAt: content.review,
      createdAt: '刚刚'
    });
    const events = wx.getStorageSync('events') || [];
    events.unshift(event);
    wx.setStorageSync('events', events);
    getApp().globalData.draftEvent = null;
  },

  call120() {
    wx.makePhoneCall({ phoneNumber: '120', fail: () => {} });
  },

  copySummary() {
    wx.setClipboardData({ data: this.data.summary, success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goEvent() {
    wx.navigateTo({ url: '/pages/my-events/my-events' });
  }
});
