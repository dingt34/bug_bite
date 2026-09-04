const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const store = require('../../utils/store');
const records = require('../../utils/event-records');
const markdown = require('../../utils/markdown');

function createMessage(role, text, attachmentLabel, recordIds, retryable, attachments) {
  return {
    id: `message_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    role,
    text,
    attachmentLabel: attachmentLabel || '',
    attachments: attachments || [],
    recordIds: recordIds || [],
    retryable: Boolean(retryable),
    markdownHtml: role === 'ai' ? markdown.renderMarkdown(text) : ''
  };
}

function containsHighRiskSignal(text) {
  return ['紧急求助', '呼吸困难', '喘不上气', '胸闷', '说话困难', '意识异常', '晕厥', '面部肿胀', '嘴唇肿胀', '喉头水肿', '快速加重', '迅速扩散']
    .some(keyword => String(text || '').indexOf(keyword) >= 0);
}

function getUserPlans() {
  const storedPlans = store.get('plans', []);
  const plans = store.withoutDemoPlans(storedPlans);
  if (plans.length !== storedPlans.length) store.set('plans', plans);
  return plans;
}

function getEventIcon(event) {
  const type = String(event.type || '');
  if (event.contactType === 'sting' || type.indexOf('蜂') >= 0) return '/assets/figma/all/s13-img2.svg';
  if (event.contactType === 'attachment' || type.indexOf('附着虫体') >= 0) return '/assets/figma/s05-imgIconGeneratedIllustrated2.svg';
  if (event.contactType === 'contact' || type.indexOf('接触后皮疹') >= 0 || type.indexOf('接触或刺激') >= 0) return '/assets/figma/s05-imgIconGeneratedIllustrated3.svg';
  if (event.contactType === 'unknown' || type.indexOf('不确定') >= 0) return '/assets/figma/all/s13-img1.svg';
  return '/assets/figma/all/s13-img3.svg';
}

Page({
  data: {
    messages: [],
    suggestions: ['帮我整理近期行程的行前重点', '这条事件记录该注意哪些变化', '如何区分常见蜱虫与蚂蟥'],
    input: '', sending: false, recordPickerVisible: false, selectableRecords: [],
    selectedRecordIds: [], selectedLabel: '未选择任何记录', scrollIntoView: '', scrollToken: 0
  },

  onShow() {
    nav.syncTab(this, 1);
    this.loadSelectableRecords();
    this.loadSuggestions();
    const pending = store.get('aiPendingSelection', '');
    if (pending) {
      store.remove('aiPendingSelection');
      this.applyPendingSelection(pending);
    }
  },

  danger() { wx.navigateTo({ url: '/pages/danger/danger?source=ai' }); },
  input(e) { this.setData({ input: e.detail.value || '' }); },

  chooseSuggestion(e) {
    this.setData({ input: e.currentTarget.dataset.text || '' });
  },

  loadSuggestions() {
    const plan = getUserPlans()[0];
    const event = store.get('events', [])[0];
    const suggestions = [];
    if (plan) suggestions.push(`帮我整理${plan.title || '近期行程'}的行前重点`);
    if (event) suggestions.push(`这条${event.type || '事件'}记录接下来要注意什么`);
    suggestions.push('哪些变化说明需要尽快就医');
    this.setData({ suggestions: suggestions.slice(0, 3) });
  },

  loadSelectableRecords() {
    const selected = this.data.selectedRecordIds;
    const plans = getUserPlans().map(item => ({
      key: `plan:${item.id}`, type: 'plan', title: item.title || '未命名行程',
      subtitle: `${item.date || '日期待补充'} · ${item.type || '活动待补充'}`,
      detail: [item.status, item.routeSummary || item.distance].filter(Boolean).join(' · '),
      summary: `行程“${item.title || '未命名'}”：${item.date || '日期待补充'}，活动${item.type || '待补充'}，状态${item.status || '待补充'}，路线${item.routeSummary || item.distance || '未关联'}`,
      selected: selected.indexOf(`plan:${item.id}`) >= 0
    }));
    const events = store.get('events', []).map(item => records.normalizeEvent(item)).map(item => {
      const reviewCount = item.timeline.filter(entry => entry.kind === 'review').length;
      const reviewStatus = reviewCount
        ? (item.status === '待复查' ? `已复查 ${reviewCount} 次 · 仍待复查` : `已完成复查 · 共 ${reviewCount} 次`)
        : (item.status === '待复查' ? '尚未复查' : '记录已结束');
      const reviewState = reviewCount ? (item.status === '待复查' ? 'reviewed' : 'completed') : 'pending';
      const reviewHint = item.status === '待复查' ? `下次 ${item.reviewAt}` : '无需继续复查';
      const timelinePreview = item.timeline.slice(-3).map(entry => ({
        id: entry.id,
        title: entry.title,
        time: entry.timeText,
        summary: [entry.riskLabel, entry.symptomsText, entry.trend].filter(Boolean).join(' · ')
      }));
      const timelineSummary = timelinePreview.map(entry => `${entry.title}（${entry.time}）：${entry.summary}`).join('；');
      return {
        key: `event:${item.id}`, type: 'event', title: item.type,
        icon: getEventIcon(item),
        subtitle: `${item.createdAt} · ${item.level}`,
        detail: [item.body, item.place, item.symptomsText, item.trend].filter(value => value && value !== '待补充').join(' · '),
        reviewStatus,
        reviewState,
        reviewHint,
        timeline: timelinePreview,
        summary: `事件“${item.type}”：首次记录于${item.createdAt}，部位${item.body}${item.place ? `，地点${item.place}` : ''}，当前表现${item.symptomsText}，全身表现${item.systemicText}，趋势${item.trend}，最新安全分级${item.level}，复查状态${reviewStatus}，最近时间线：${timelineSummary}`,
        selected: selected.indexOf(`event:${item.id}`) >= 0
      };
    });
    this.setData({ selectableRecords: plans.concat(events) });
  },

  applyPendingSelection(key) {
    const selectedRecordIds = [key];
    const selectableRecords = this.data.selectableRecords.map(item => Object.assign({}, item, { selected: item.key === key }));
    const record = selectableRecords.find(item => item.selected);
    this.setData({ selectedRecordIds, selectableRecords, selectedLabel: record ? `已选择：${record.title}` : '未选择任何记录' });
  },

  openRecordPicker() { this.loadSelectableRecords(); this.setData({ recordPickerVisible: true }); },
  closeRecordPicker() { this.setData({ recordPickerVisible: false }); },

  toggleRecord(e) {
    const key = e.currentTarget.dataset.key;
    const selectedRecordIds = this.data.selectedRecordIds.slice();
    const index = selectedRecordIds.indexOf(key);
    if (index >= 0) selectedRecordIds.splice(index, 1);
    else {
      if (selectedRecordIds.length >= 3) { wx.showToast({ title: '每次最多选择 3 条记录', icon: 'none' }); return; }
      selectedRecordIds.push(key);
    }
    const selectableRecords = this.data.selectableRecords.map(item => Object.assign({}, item, { selected: selectedRecordIds.indexOf(item.key) >= 0 }));
    this.setData({ selectedRecordIds, selectableRecords });
  },

  clearRecords() {
    this.setData({
      selectedRecordIds: [], selectedLabel: '未选择任何记录',
      selectableRecords: this.data.selectableRecords.map(item => Object.assign({}, item, { selected: false }))
    });
  },

  confirmRecords() {
    const selected = this.data.selectableRecords.filter(item => item.selected);
    this.setData({
      selectedRecordIds: selected.map(item => item.key),
      selectedLabel: selected.length ? `已选择 ${selected.length} 条记录` : '未选择任何记录',
      recordPickerVisible: false
    });
  },

  selectedSummaries() {
    const selected = this.data.selectableRecords.filter(item => this.data.selectedRecordIds.indexOf(item.key) >= 0);
    return selected.map(item => item.summary);
  },

  send() {
    if (this.data.sending) return;
    const typedText = (this.data.input || '').trim();
    const selectedRecords = this.data.selectableRecords.filter(item => this.data.selectedRecordIds.indexOf(item.key) >= 0);
    const summaries = selectedRecords.map(item => item.summary);
    if (!typedText && !summaries.length) {
      wx.showToast({ title: '请输入问题或先选择一条记录', icon: 'none' });
      return;
    }
    const text = typedText || '请根据我选择的记录，告诉我当前需要关注的重点和下一步建议。';
    const safetyText = `${text}\n${summaries.join('\n')}`;
    if (containsHighRiskSignal(safetyText)) {
      wx.showModal({
        title: '先进行安全判断',
        content: '你描述的内容可能包含危险信号。AI 对话不能替代紧急分流，请先完成安全判断。',
        confirmText: '立即判断',
        success: result => { if (result.confirm) this.danger(); }
      });
      return;
    }
    const attachmentLabel = selectedRecords.length
      ? `已附带 ${selectedRecords.length} 条记录：${selectedRecords.map(item => item.title).join('、')}`
      : '';
    const attachedIds = selectedRecords.map(item => item.key);
    const attachmentCards = selectedRecords.map(item => ({
      key: item.key,
      type: item.type,
      kind: item.type === 'plan' ? '行程' : '事件',
      title: item.title,
      subtitle: item.subtitle,
      detail: item.detail || '',
      icon: item.icon || '',
      reviewStatus: item.reviewStatus || '',
      reviewState: item.reviewState || '',
      reviewHint: item.reviewHint || '',
      timeline: item.timeline || []
    }));
    const before = this.data.messages.concat(createMessage('user', text, attachmentLabel, attachedIds, false, attachmentCards));
    const requestMessages = before.map((item, index) => ({
      role: item.role === 'ai' ? 'assistant' : 'user',
      content: index === before.length - 1 && summaries.length
        ? `${item.text}\n\n以下是用户本次主动选择发送的文字摘要：\n${summaries.join('\n')}`
        : item.text
    }));
    const userScrollToken = this.data.scrollToken + 1;
    this.setData({
      messages: before,
      input: '',
      sending: true,
      selectedRecordIds: [],
      selectedLabel: '未选择任何记录',
      selectableRecords: this.data.selectableRecords.map(item => Object.assign({}, item, { selected: false })),
      scrollToken: userScrollToken,
      scrollIntoView: `chat-bottom-${userScrollToken}`
    });
    cloud.call('aiAssistant', {
      messages: requestMessages,
      selectedRecordIds: attachedIds
    }, { timeout: 22000 }).then(result => {
      const scrollToken = this.data.scrollToken + 1;
      this.setData({ messages: before.concat(createMessage('ai', result.answer, '', attachedIds)), scrollToken, scrollIntoView: `chat-bottom-${scrollToken}` });
    }).catch(() => {
      const scrollToken = this.data.scrollToken + 1;
      this.setData({ messages: before.concat(createMessage('ai', 'AI 助手暂时未连接。若症状正在加重，请先进入安全判断；其他功能仍可正常使用。', '', attachedIds, true)), scrollToken, scrollIntoView: `chat-bottom-${scrollToken}` });
    }).then(() => this.setData({ sending: false }));
  },

  retryLast() {
    const lastUser = this.data.messages.slice().reverse().find(item => item.role === 'user');
    if (!lastUser) return;
    const selectedRecordIds = lastUser.recordIds || [];
    this.setData({
      input: lastUser.text,
      selectedRecordIds,
      selectedLabel: selectedRecordIds.length ? `已选择 ${selectedRecordIds.length} 条记录` : '未选择任何记录',
      selectableRecords: this.data.selectableRecords.map(item => Object.assign({}, item, { selected: selectedRecordIds.indexOf(item.key) >= 0 }))
    }, () => this.send());
  },

  openAiNotes() { wx.navigateTo({ url: '/pages/ai-notes/ai-notes' }); },

  saveLastAnswer() {
    const answer = this.data.messages.slice().reverse().find(item => item.role === 'ai');
    if (!answer) return;
    if (answer.saved) { wx.showToast({ title: '这条回复已经保存', icon: 'none' }); return; }
    const answerIndex = this.data.messages.findIndex(item => item.id === answer.id);
    const question = this.data.messages.slice(0, answerIndex).reverse().find(item => item.role === 'user');
    const answerRecordIds = answer.recordIds || [];
    const note = {
      id: store.id('ai_note'),
      question: question ? question.text : '未保留原问题',
      text: answer.text,
      selectedRecordIds: answerRecordIds,
      createdAtTimestamp: Date.now()
    };
    const notes = store.get('aiNotes', []);
    notes.unshift(note);
    store.set('aiNotes', notes);
    const eventIds = answerRecordIds.filter(key => key.indexOf('event:') === 0).map(key => key.slice(6));
    const events = store.get('events', []);
    let savedCount = 0;
    eventIds.forEach(eventId => {
      const index = events.findIndex(item => item.id === eventId);
      if (index < 0) return;
      events[index] = Object.assign({}, events[index], { notes: (events[index].notes || []).concat(note), syncStatus: '待同步' });
      cloud.background('userData', { action: 'upsert', type: 'event', clientId: eventId, record: records.toCloudRecord(events[index]) });
      savedCount += 1;
    });
    if (savedCount) store.set('events', events);
    this.setData({ messages: this.data.messages.map(item => item.id === answer.id ? Object.assign({}, item, { saved: true }) : item) });
    wx.showToast({ title: savedCount ? `已保存到 ${savedCount} 条事件` : '已保存为本机笔记', icon: 'success' });
  }
});
