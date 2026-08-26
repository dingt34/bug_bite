const mock = require('../../utils/mock.js');
const eventUtils = require('../../utils/event.js');
const RESULT_CONTENT = require('../../utils/result-content.js');
const cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    level: 'observe',
    content: null,
    summary: '',
    eventId: '',
    eventSnapshot: null,
    allowStepBack: false
  },

  onLoad(options) {
    const level = options.level || 'observe';
    const draft = getApp().globalData.draftEvent || {};
    const content = RESULT_CONTENT.getResultContent(level, draft.contactType);
    const summary = this.buildSummary(draft, content);
    const event = this.saveEvent(draft, level, content, summary);
    this.setData({
      level: level,
      content: content,
      summary: summary,
      eventId: event ? event.id : '',
      eventSnapshot: event,
      allowStepBack: level !== 'emergency' && !!event
    });
  },

  buildSummary(draft, content) {
    const parts = [];
    const answers = draft.answers || {};
    parts.push('接触类型：' + (draft.contactTypeName || '未知'));
    if (answers.occurredAt) {
      parts.push('发生时间：' + answers.occurredAt);
    }
    if (answers.bodyParts && answers.bodyParts.length) {
      parts.push('身体部位：' + answers.bodyParts.join('、'));
    }
    if (answers.localSymptoms && answers.localSymptoms.length) {
      parts.push('局部表现：' + answers.localSymptoms.join('、'));
    }
    if (answers.systemicSymptoms && answers.systemicSymptoms.length) {
      parts.push('全身不适：' + answers.systemicSymptoms.join('、'));
    }
    if (answers.trend) {
      parts.push('变化趋势：' + answers.trend);
    }
    if (answers.dailyImpact) {
      parts.push('日常活动影响：' + answers.dailyImpact);
    }
    if (answers.count) {
      parts.push('数量：' + answers.count);
    }
    if (answers.distribution) {
      parts.push('分布：' + answers.distribution);
    }
    if (answers.attachedTime) {
      parts.push('附着时间：' + answers.attachedTime);
    }
    if (answers.removed) {
      parts.push('移除状态：' + answers.removed);
    }
    if (answers.contactMode) {
      parts.push('接触方式：' + answers.contactMode);
    }
    if (answers.environment && answers.environment.length) {
      parts.push('所处环境：' + answers.environment.join('、'));
    }
    if (draft.dangerSignals && draft.dangerSignals.length) {
      parts.push('危险信号：' + draft.dangerSignals.map(k => {
        const s = mock.DANGER_SIGNALS.find(d => d.key === k);
        return s ? s.name : k;
      }).join('、'));
    }
    if (draft.actionsTaken && draft.actionsTaken.length) {
      parts.push('已采取措施：' + draft.actionsTaken.join('、'));
    }
    parts.push('分级：' + content.levelName);
    if (draft.matchedRules && draft.matchedRules.length) {
      parts.push('触发依据：' + draft.matchedRules.map(rule => rule.text).join('；'));
    }
    parts.push('建议：' + content.actions[0]);
    return parts.join('\n');
  },

  saveEvent(draft, level, content, summary) {
    // 直接打开或刷新结果页时没有有效草稿，不创建空白或重复事件。
    if (!draft || !draft.id || !draft.contactType) {
      return null;
    }

    const event = eventUtils.buildEvent(draft, {
      level: level,
      levelName: content.levelName,
      nextReviewAt: content.review,
      summary: summary
    });
    const events = wx.getStorageSync('events') || [];
    wx.setStorageSync('events', eventUtils.upsertEvent(events, event));
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    getApp().globalData.draftEvent = null;
    return event;
  },

  call120() {
    wx.makePhoneCall({ phoneNumber: '120', fail: () => {} });
  },

  copySummary() {
    wx.setClipboardData({ data: this.data.summary, success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  onStepChange(e) {
    const target = Number(e.detail.step);
    const snapshot = this.data.eventSnapshot;
    if (!snapshot || target < 1 || target >= 4) return;
    getApp().globalData.draftEvent = Object.assign({}, snapshot, {
      answers: Object.assign({}, snapshot.answers || {}),
      imageRefs: (snapshot.imageRefs || []).slice(),
      imageRecords: (snapshot.imageRecords || []).map(item => Object.assign({}, item)),
      actionsTaken: (snapshot.actionsTaken || []).slice(),
      matchedRules: (snapshot.matchedRules || []).map(item => Object.assign({}, item))
    });
    wx.navigateBack({ delta: 4 - target });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goEvent() {
    wx.navigateTo({ url: '/pages/my-events/my-events' });
  }
});
