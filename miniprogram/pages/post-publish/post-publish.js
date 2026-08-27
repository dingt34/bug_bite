const mock = require('../../utils/mock.js');
const auth = require('../../utils/auth.js');
const community = require('../../utils/community.js');
const communityCloud = require('../../utils/community-cloud.js');

const DRAFT_KEY = 'communityPostDraftV1';

Page({
  data: {
    text: '',
    previewImage: '',
    regions: mock.REGIONS,
    types: mock.CONTACT_TYPES,
    stages: ['已处理', '观察中', '已恢复'],
    region: '',
    contactType: '',
    contactTypeName: '',
    stage: '',
    charCount: 0,
    publishing: false,
    validationMessage: '',
    editing: false,
    editPostId: '',
    loadingPost: false,
    draftRestored: false,
    hasPreviousEvents: false,
    selectedEventLabel: ''
  },

  onLoad(options) {
    const user = auth.readLocalUser(wx);
    if (!user || user.mode !== 'wechat_cloud') {
      wx.showModal({
        title: '需要微信云登录',
        content: '发布到公共云端社区前，需要先完成微信云登录。',
        confirmText: '去登录',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/login/login' });
          else wx.navigateBack();
        }
      });
    }
    const editPostId = options && options.id || '';
    if (editPostId) {
      this.loadPostForEdit(editPostId);
    } else {
      this.restoreDraft();
      this.loadPreviousEvents();
    }
  },

  loadPreviousEvents() {
    const storedEvents = wx.getStorageSync('events');
    const events = Array.isArray(storedEvents) ? storedEvents : [];
    this.previousEvents = events.filter(event => event && event.id && event.contactType)
      .sort((a, b) => (b.updatedAtTimestamp || b.createdAtTimestamp || 0) -
        (a.updatedAtTimestamp || a.createdAtTimestamp || 0))
      .slice(0, 6);
    this.setData({ hasPreviousEvents: this.previousEvents.length > 0 });
  },

  previousEventLabel(event) {
    const typeName = event.contactTypeName || '接触事件';
    const time = event.occurredAt || event.createdAt || '时间未记录';
    return (typeName + ' · ' + time).slice(0, 30);
  },

  choosePreviousEvent() {
    if (this.data.editing) return;
    const events = this.previousEvents || [];
    if (!events.length) {
      wx.showModal({
        title: '还没有事件记录',
        content: '完成一次安全判断后，事件会保存在这里供快速填写。',
        confirmText: '去安全判断',
        success: result => {
          if (result.confirm) wx.navigateTo({ url: '/pages/contact/contact' });
        }
      });
      return;
    }
    wx.showActionSheet({
      itemList: events.map(event => this.previousEventLabel(event)),
      success: result => this.confirmPreviousEvent(events[result.tapIndex])
    });
  },

  confirmPreviousEvent(event) {
    if (!event) return;
    const hasCurrentContent = this.data.text.trim() || this.data.region ||
      this.data.contactType || this.data.stage;
    if (!hasCurrentContent) {
      this.applyPreviousEvent(event);
      return;
    }
    wx.showModal({
      title: '使用这条事件记录？',
      content: '将替换当前文字和标签，已经选择的分享图片会保留。',
      confirmText: '替换填写',
      success: result => {
        if (result.confirm) this.applyPreviousEvent(event);
      }
    });
  },

  buildEventShareText(event) {
    const typeName = event.contactTypeName || '虫咬接触';
    const parts = ['我想分享一次' + typeName + '的经历。'];
    if (event.occurredAt) parts.push('发生时间：' + event.occurredAt + '。');
    if (event.summary) parts.push(String(event.summary));
    if (event.latestReviewSummary && event.latestReviewSummary !== event.summary) {
      parts.push('最新复查：' + event.latestReviewSummary);
    }
    return parts.join('\n').slice(0, 500);
  },

  resolveEventStage(event) {
    const status = String(event.status || '').toLowerCase();
    if (status === 'recovered' || status === 'resolved') return '已恢复';
    const reviews = Array.isArray(event.reviews) ? event.reviews : [];
    const latest = reviews.length ? reviews[reviews.length - 1] : null;
    const trend = String(latest && latest.answers && latest.answers.trend || '');
    if (event.riskLevel === 'observe' && trend.indexOf('明显好转') > -1) return '已处理';
    return '观察中';
  },

  applyPreviousEvent(event) {
    const matchedType = this.data.types.find(item => item.key === event.contactType);
    const text = this.buildEventShareText(event);
    const region = this.data.regions.indexOf(event.region) > -1 ? event.region : '';
    this.setData({
      text,
      charCount: text.length,
      region,
      contactType: matchedType ? matchedType.key : 'unknown',
      contactTypeName: matchedType ? matchedType.name : '暂时不能确定',
      stage: this.resolveEventStage(event),
      validationMessage: '',
      draftRestored: false,
      selectedEventLabel: this.previousEventLabel(event)
    });
    this.persistDraft();
    wx.showToast({ title: '已填入事件，图片未自动添加', icon: 'none' });
  },

  loadPostForEdit(postId) {
    this.setData({ editing: true, editPostId: postId, loadingPost: true });
    if (wx.setNavigationBarTitle) wx.setNavigationBarTitle({ title: '编辑帖子' });
    communityCloud.getThread(wx, postId).then(result => {
      if (!result.post || !result.post.canDelete) throw new Error('只能编辑自己的分享');
      const post = result.post;
      this.setData({
        text: post.text || '',
        previewImage: (post.imageRefs || [])[0] || '',
        region: post.region || '',
        contactType: post.contactType || '',
        contactTypeName: post.contactTypeName || '',
        stage: post.stage || '',
        charCount: (post.text || '').length,
        loadingPost: false
      });
    }).catch(error => {
      this.setData({ loadingPost: false, validationMessage: error.message || '帖子加载失败' });
      wx.showModal({
        title: '无法编辑帖子',
        content: error.message || '帖子加载失败，请稍后重试。',
        showCancel: false,
        success: () => wx.navigateBack()
      });
    });
  },

  restoreDraft() {
    const draft = wx.getStorageSync(DRAFT_KEY);
    if (!draft || typeof draft !== 'object') return;
    const text = String(draft.text || '').slice(0, 500);
    this.setData({
      text,
      region: draft.region || '',
      contactType: draft.contactType || '',
      contactTypeName: draft.contactTypeName || '',
      stage: draft.stage || '',
      charCount: text.length,
      draftRestored: true
    });
  },

  persistDraft() {
    if (this.data.editing || this.data.publishing) return;
    const draft = {
      text: this.data.text,
      region: this.data.region,
      contactType: this.data.contactType,
      contactTypeName: this.data.contactTypeName,
      stage: this.data.stage,
      savedAtTimestamp: Date.now()
    };
    const hasContent = draft.text.trim() || draft.region || draft.contactType || draft.stage;
    if (hasContent) wx.setStorageSync(DRAFT_KEY, draft);
    else if (wx.removeStorageSync) wx.removeStorageSync(DRAFT_KEY);
  },

  clearDraft() {
    if (wx.removeStorageSync) wx.removeStorageSync(DRAFT_KEY);
    else wx.setStorageSync(DRAFT_KEY, null);
    this.setData({ draftRestored: false });
  },

  onInput(e) {
    const text = e.detail.value || '';
    this.setData({ text, charCount: text.length, validationMessage: '' });
    this.persistDraft();
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (path) this.setData({ previewImage: path });
      }
    });
  },

  removeImage() {
    wx.showModal({
      title: '移除图片',
      content: '将从本次分享中移除这张图片。',
      confirmText: '移除',
      confirmColor: '#E53935',
      success: result => {
        if (result.confirm) this.setData({ previewImage: '' });
      }
    });
  },

  onRegionTap(e) {
    this.setData({ region: e.currentTarget.dataset.v });
    this.persistDraft();
  },

  onTypeTap(e) {
    this.setData({
      contactType: e.currentTarget.dataset.v,
      contactTypeName: e.currentTarget.dataset.name,
      validationMessage: ''
    });
    this.persistDraft();
  },

  onStageTap(e) {
    this.setData({ stage: e.currentTarget.dataset.v, validationMessage: '' });
    this.persistDraft();
  },

  discardDraft() {
    wx.showModal({
      title: '清空草稿',
      content: '已填写的内容和标签将被清空。',
      confirmText: '清空',
      confirmColor: '#E53935',
      success: result => {
        if (!result.confirm) return;
        this.clearDraft();
        this.setData({
          text: '', previewImage: '', region: '', contactType: '',
          contactTypeName: '', stage: '', charCount: 0, validationMessage: ''
        });
      }
    });
  },

  publish() {
    if (this.data.publishing) return;
    const userInfo = auth.readLocalUser(wx);
    if (!userInfo || userInfo.mode !== 'wechat_cloud') {
      wx.showToast({ title: '请先完成微信云登录', icon: 'none' });
      return;
    }
    const validation = community.validatePost(this.data);
    if (!validation.valid) {
      this.setData({ validationMessage: validation.message });
      wx.showToast({ title: validation.message, icon: 'none' });
      return;
    }
    this.setData({ publishing: true, validationMessage: '' });
    this.commitPublish(userInfo, validation.text);
  },

  commitPublish(userInfo, text) {
    const draft = Object.assign({}, this.data, { text });
    const request = this.data.editing
      ? communityCloud.update(wx, this.data.editPostId, draft)
      : communityCloud.publish(wx, draft, userInfo);
    request
      .then(() => this.data.editing ? null : communityCloud.getStats(wx).catch(() => null))
      .then(() => {
        if (!this.data.editing) this.clearDraft();
        wx.showToast({ title: this.data.editing ? '修改已保存' : '已发布到云端', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 400);
      })
      .catch(error => {
        const message = error && error.message ? error.message : '云端发布失败，请稍后重试';
        this.setData({ publishing: false, validationMessage: message });
        wx.showToast({ title: message, icon: 'none' });
      });
  },

  onUnload() {
    this.persistDraft();
  }
});
