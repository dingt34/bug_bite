const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const records = require('../../utils/event-records');
const mediaStorage = require('../../utils/media-storage');
const markdown = require('../../utils/markdown');

Page({
  data: {
    event: {}, timeline: [], imageCount: 0, notes: [], customReviewVisible: false,
    customReviewDate: '', customReviewTime: '', minReviewDate: '', isPending: false, isRecovered: false, isEmergency: false
  },

  onLoad(query) { this.eventId = query.id || ''; },
  onShow() { this.loadEvent(); },

  loadEvent() {
    const list = store.get('events', []);
    const index = list.findIndex(item => item.id === this.eventId);
    const source = index >= 0 ? list[index] : null;
    if (!source) {
      wx.showModal({ title: '记录不存在', content: '该事件可能已被删除。', showCancel: false, success: () => nav.back() });
      return;
    }
    const event = records.normalizeEvent(source);
    if (index >= 0) { list[index] = event; store.set('events', list); }
    this.eventId = event.id;
    this.setEventData(event);
  },

  setEventData(event) {
    const notes = (event.notes || []).map(note => Object.assign({}, note, {
      markdownHtml: markdown.renderMarkdown(note.text || '')
    }));
    this.setData({
      event, timeline: event.timeline, imageCount: event.imageRefs.length, notes,
      isPending: event.status === '待复查', isRecovered: ['已恢复', '历史', '已完成'].indexOf(event.status) >= 0, isEmergency: event.status === '待求助'
    });
  },

  back() { nav.back(); },
  review() { wx.navigateTo({ url: `/pages/review/review?id=${this.data.event.id}` }); },
  danger() { wx.navigateTo({ url: '/pages/danger/danger?source=event-detail' }); },

  adjustReview() {
    const choices = [
      { label: '30 分钟后', minutes: 30 }, { label: '2 小时后', minutes: 120 },
      { label: '明天同一时间', minutes: 1440 }, { label: '自定义日期与时间', custom: true }
    ];
    wx.showActionSheet({
      itemList: choices.map(item => item.label),
      success: result => {
        const selected = choices[result.tapIndex];
        if (selected.custom) { this.openCustomReview(); return; }
        this.updateReviewTime(Date.now() + selected.minutes * 60000);
      }
    });
  },

  dateValue(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  timeValue(timestamp) {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  openCustomReview() {
    const now = Date.now();
    const initial = this.data.event.nextReviewAtTimestamp > now ? this.data.event.nextReviewAtTimestamp : now + 2 * 60 * 60 * 1000;
    this.setData({
      customReviewVisible: true,
      customReviewDate: this.dateValue(initial),
      customReviewTime: this.timeValue(initial),
      minReviewDate: this.dateValue(now)
    });
  },

  onCustomDate(e) { this.setData({ customReviewDate: e.detail.value }); },
  onCustomTime(e) { this.setData({ customReviewTime: e.detail.value }); },
  closeCustomReview() { this.setData({ customReviewVisible: false }); },

  confirmCustomReview() {
    const timestamp = new Date(`${this.data.customReviewDate}T${this.data.customReviewTime}:00`).getTime();
    if (!timestamp || timestamp <= Date.now()) {
      wx.showToast({ title: '请选择晚于当前时间的复查时间', icon: 'none' });
      return;
    }
    this.updateReviewTime(timestamp);
    this.closeCustomReview();
  },

  updateReviewTime(timestamp) {
    const event = Object.assign({}, this.data.event, {
      nextReviewAtTimestamp: timestamp,
      status: '待复查', syncStatus: '待同步'
    });
    this.persistEvent(event);
    this.scheduleReminder(event);
    wx.showToast({ title: '复查时间已调整', icon: 'success' });
  },

  scheduleReminder(event) {
    if (event.reminderId) cloud.background('reminder', { action: 'cancel', reminderId: event.reminderId });
    cloud.call('reminder', {
      action: 'create', eventId: event.id, dueAt: new Date(event.nextReviewAtTimestamp).toISOString(), title: `${event.type}复查提醒`
    }).then(result => {
      this.persistEvent(Object.assign({}, this.data.event, { reminderId: result.reminderId, reminderStatus: '已登记' }));
    }).catch(() => {
      this.persistEvent(Object.assign({}, this.data.event, { reminderStatus: '仅应用内' }));
    });
  },

  reopenObservation() {
    wx.showModal({
      title: '重新开启观察？', content: '该事件会重新进入待复查列表，并在 2 小时后提醒复查。', confirmText: '重新开启',
      success: result => {
        if (!result.confirm) return;
        this.updateReviewTime(Date.now() + 2 * 60 * 60 * 1000);
      }
    });
  },

  persistEvent(source) {
    const event = records.normalizeEvent(source);
    const list = store.get('events', []);
    const index = list.findIndex(item => item.id === event.id);
    if (index >= 0) list[index] = event;
    store.set('events', list);
    this.setEventData(event);
    cloud.background('userData', { action: 'upsert', type: 'event', clientId: event.id, record: records.toCloudRecord(event) });
  },

  addPhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: result => {
        const path = result.tempFiles && result.tempFiles[0] && result.tempFiles[0].tempFilePath;
        if (!path) return;
        mediaStorage.persistImage(wx, path, `events/${this.data.event.id}`).then(image => {
          this.persistEvent(Object.assign({}, this.data.event, {
            imageRefs: this.data.event.imageRefs.concat(image.localPath),
            imageFileIds: this.data.event.imageFileIds.concat(image.cloudFileId ? [image.cloudFileId] : []),
            syncStatus: '待同步'
          }));
          wx.showToast({ title: image.cloudFileId ? '照片已保存，记录等待同步' : '照片已保存到本机', icon: 'success' });
        });
      }
    });
  },

  previewPhoto(e) {
    const urls = this.data.event.imageRefs || [];
    if (urls.length) wx.previewImage({ current: e.currentTarget.dataset.src || urls[0], urls });
  },

  summary() {
    const event = this.data.event;
    const history = event.timeline.map(item => `${item.timeText} ${item.title}：${item.riskLabel}，${item.symptomsText}，趋势${item.trend || '未记录'}`).join('\n');
    const placeLine = event.place ? `\n地点：${event.place}` : '';
    const text = `事件：${event.type}\n首次记录：${event.createdAt}\n部位：${event.body}${placeLine}\n当前表现：${event.symptomsText}\n当前趋势：${event.trend}\n\n恢复时间线\n${history}`;
    wx.setClipboardData({ data: text });
  },

  sendToAi() {
    store.set('aiPendingSelection', `event:${this.data.event.id}`);
    wx.switchTab({ url: '/pages/ai/ai' });
  },

  deleteEvent() {
    wx.showModal({
      title: '删除这条事件记录？',
      content: '将同时删除本机保存的复查时间线；云端关联记录会在联网时一并清理，删除后无法恢复。',
      confirmText: '删除', confirmColor: '#EA4038',
      success: result => {
        if (!result.confirm) return;
        const list = store.get('events', []).filter(item => item.id !== this.data.event.id);
        store.set('events', list);
        if (this.data.event.reminderId) cloud.background('reminder', { action: 'cancel', reminderId: this.data.event.reminderId });
        cloud.background('deleteData', { action: 'event', clientId: this.data.event.id });
        wx.showToast({ title: '事件已删除', icon: 'success' });
        setTimeout(() => nav.back('/pages/profile/profile'), 400);
      }
    });
  }
});
