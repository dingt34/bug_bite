const aiService = require('../../utils/ai-service.js');
const aiContext = require('../../utils/ai-context.js');
const markdown = require('../../utils/markdown.js');
const privacy = require('../../utils/privacy.js');

function welcomeMessage() {
  return {
    id: 'welcome',
    role: 'assistant',
    content: '你好，我可以根据你的描述、图片和已有记录整理安全建议。请先说明发生了什么；如有呼吸困难、意识异常或口唇舌喉肿胀，请立即呼叫120。',
    markdownHtml: markdown.renderMarkdown('你好，我可以根据你的描述、图片和已有记录整理安全建议。请先说明发生了什么；如有呼吸困难、意识异常或口唇舌喉肿胀，请立即呼叫120。')
  };
}

function planOption(plan, index) {
  const destinations = (plan.destinations || []).map(item => item.name || item).filter(Boolean);
  const title = destinations.join('、') || plan.destinationName || plan.regionCode || '未填写地点';
  const subtitle = [plan.month, plan.activityType].filter(Boolean).join(' · ') || '行程计划';
  return { index, key: 'plan-' + index, title, subtitle, selected: false };
}

function eventOption(event, index) {
  const title = event.contactTypeName || event.contactType || '接触事件';
  const subtitle = [event.occurredAt, event.summary].filter(Boolean).join(' · ') || '暂无补充描述';
  return { index, key: 'event-' + index, title, subtitle, selected: false };
}

Page({
  data: {
    messages: [welcomeMessage()],
    inputText: '',
    images: [],
    sending: false,
    scrollIntoView: 'message-welcome',
    aiAvailable: false,
    imageAvailable: false,
    modeText: '',
    statusMessage: '',
    recordSelectorVisible: false,
    selectablePlans: [],
    selectableEvents: [],
    selectedRecordCount: 0,
    quickQuestions: ['现在应该做什么？', '需要观察哪些变化？', '什么时候需要就医？']
  },

  onLoad() {
    this.conversationId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    const status = aiService.getStatus(wx);
    this.setData({
      aiAvailable: status.available,
      imageAvailable: status.imageAvailable,
      modeText: '扣子 Agent',
      statusMessage: status.reason || '支持文字多轮对话；图片输入正在接入验证'
    });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value || '' });
  },

  chooseImage(e) {
    if (this.data.sending) return;
    const kind = e.currentTarget.dataset.kind;
    const label = kind === 'insect' ? '虫体图片' : '伤口图片';
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: result => {
        const path = result.tempFilePaths && result.tempFilePaths[0];
        if (!path) return;
        const images = this.data.images.filter(item => item.kind !== kind);
        images.push({ kind, label, path });
        this.setData({ images });
      }
    });
  },

  removeImage(e) {
    const kind = e.currentTarget.dataset.kind;
    this.setData({ images: this.data.images.filter(item => item.kind !== kind) });
  },

  sendQuick(e) {
    if (this.data.sending) return;
    const text = e.currentTarget.dataset.text;
    this.setData({ inputText: text });
    this.sendMessage({ requestText: text });
  },

  sendRecords() {
    if (this.data.sending) return;
    const snapshot = privacy.readSnapshot(wx);
    const selectablePlans = (snapshot.plans || []).map(planOption);
    const selectableEvents = (snapshot.events || []).map(eventOption);
    if (!selectablePlans.length && !selectableEvents.length) {
      wx.showToast({ title: '还没有可发送的计划或事件', icon: 'none' });
      return;
    }
    this.setData({
      recordSelectorVisible: true,
      selectablePlans,
      selectableEvents,
      selectedRecordCount: 0
    });
  },

  toggleRecord(e) {
    const type = e.currentTarget.dataset.type;
    const index = Number(e.currentTarget.dataset.index);
    const field = type === 'plan' ? 'selectablePlans' : 'selectableEvents';
    const records = this.data[field].map(item => Object.assign({}, item));
    const target = records.find(item => item.index === index);
    if (!target) return;
    if (!target.selected && this.data.selectedRecordCount >= 8) {
      wx.showToast({ title: '一次最多选择8条记录', icon: 'none' });
      return;
    }
    target.selected = !target.selected;
    const selectablePlans = field === 'selectablePlans' ? records : this.data.selectablePlans;
    const selectableEvents = field === 'selectableEvents' ? records : this.data.selectableEvents;
    const selectedRecordCount = selectablePlans.filter(item => item.selected).length +
      selectableEvents.filter(item => item.selected).length;
    this.setData({ [field]: records, selectedRecordCount });
  },

  closeRecordSelector() {
    this.setData({ recordSelectorVisible: false });
  },

  confirmSendRecords() {
    if (!this.data.selectedRecordCount || this.data.sending) return;
    const snapshot = privacy.readSnapshot(wx);
    const plans = this.data.selectablePlans.filter(item => item.selected)
      .map(item => (snapshot.plans || [])[item.index]).filter(Boolean);
    const events = this.data.selectableEvents.filter(item => item.selected)
      .map(item => (snapshot.events || [])[item.index]).filter(Boolean);
    const context = aiContext.buildRecordsContext(
      { plans, events },
      { plans: plans.length, events: events.length, maxLength: 6000 }
    );
    const recordCards = aiContext.buildRecordCards({ plans, events });
    if (context.empty) {
      this.closeRecordSelector();
      wx.showToast({ title: '所选记录已不存在，请重新选择', icon: 'none' });
      return;
    }
    this.setData({ recordSelectorVisible: false });
    this.sendMessage({
      requestText: '请结合以下由我选择的个人记录，指出当前最值得关注的风险、准备建议和需要复查的事项。\n\n' + context.text,
      displayText: '请结合这些记录给出建议',
      recordCards
    });
  },

  sendMessage(options) {
    if (this.data.sending) return;
    const settings = options || {};
    const images = this.data.images.slice();
    const requestText = String(settings.requestText || this.data.inputText || '').trim() ||
      (images.length ? '请结合我上传的图片提供安全建议，并明确说明不确定性。' : '');
    if (!requestText) {
      wx.showToast({ title: '请先输入问题或添加图片', icon: 'none' });
      return;
    }
    if (!this.data.aiAvailable) {
      wx.showToast({ title: '当前基础库不支持云函数', icon: 'none' });
      return;
    }
    if (images.length && !this.data.imageAvailable) {
      wx.showModal({
        title: '图片聊天尚未配置',
        content: '当前已部署的扣子 API 只确认支持文字输入。请先用文字描述虫体或伤口特征，图片能力会在接口验证后开放。',
        showCancel: false
      });
      return;
    }

    const token = (this.requestToken || 0) + 1;
    this.requestToken = token;
    const history = this.data.messages.filter(item => item.content && !item.loading)
      .map(item => ({ role: item.role, content: item.requestContent || item.content }));
    const userId = 'user-' + Date.now();
    const assistantId = 'assistant-' + Date.now();
    const messages = this.data.messages.concat([
      {
        id: userId,
        role: 'user',
        content: settings.displayText || requestText,
        requestContent: requestText,
        recordCards: (settings.recordCards || []).map(item => Object.assign({}, item)),
        images: images.map(item => ({ kind: item.kind, label: item.label, path: item.path }))
      },
      { id: assistantId, role: 'assistant', content: '', loading: true }
    ]);
    this.setData({
      messages,
      inputText: '',
      images: [],
      sending: true,
      scrollIntoView: 'message-' + assistantId
    });

    let uploadedFileIds = [];
    aiService.uploadTemporaryImages(wx, images, fileIds => { uploadedFileIds = fileIds; })
      .then(fileIds => {
        uploadedFileIds = fileIds;
        return aiService.streamReply(wx, {
          message: requestText,
          history,
          fileIds,
          conversationId: this.conversationId,
          onText: text => {
            if (this.requestToken !== token) return;
            this.updateAssistantMessage(assistantId, text, true);
          }
        });
      })
      .then(text => {
        if (this.requestToken !== token) return;
        this.updateAssistantMessage(assistantId, text, false);
        this.setData({ sending: false });
      })
      .catch(error => {
        if (this.requestToken !== token) return;
        const reason = error && error.message ? error.message : '请检查云开发AI服务';
        this.updateAssistantMessage(
          assistantId,
          'AI建议暂时不可用：' + reason + '。\n\n如果出现呼吸困难、意识异常、口唇舌喉肿胀或症状快速加重，请立即呼叫120或就近急诊。',
          false,
          true
        );
        this.setData({ sending: false });
      })
      .then(() => aiService.deleteTemporaryImages(wx, uploadedFileIds));
  },

  updateAssistantMessage(id, content, loading, error) {
    const messages = this.data.messages.map(item => item.id === id
      ? Object.assign({}, item, {
        content,
        markdownHtml: markdown.renderMarkdown(content),
        loading: !!loading,
        error: !!error
      })
      : item
    );
    this.setData({ messages, scrollIntoView: 'message-' + id });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/danger/danger' });
  },

  onUnload() {
    this.requestToken = (this.requestToken || 0) + 1;
  }
});
