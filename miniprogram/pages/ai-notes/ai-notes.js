const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');
const records = require('../../utils/event-records');
const markdown = require('../../utils/markdown');

function timeText(timestamp) {
  const date = new Date(timestamp || Date.now());
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

Page({
  data: { notes: [] },

  onShow() { this.loadNotes(); },

  loadNotes() {
    const notes = store.get('aiNotes', []).slice().sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp).map(note => ({
      id: note.id,
      question: note.question || '未保留原问题',
      text: note.text || '',
      markdownHtml: markdown.renderMarkdown(note.text || ''),
      timeText: timeText(note.createdAtTimestamp),
      recordCount: (note.selectedRecordIds || []).length
    }));
    this.setData({ notes });
  },

  back() { nav.back('/pages/profile/profile'); },
  goAi() { wx.switchTab({ url: '/pages/ai/ai' }); },

  deleteNote(e) {
    const id = e.currentTarget.dataset.id;
    const note = store.get('aiNotes', []).find(item => item.id === id);
    if (!note) return;
    wx.showModal({ title: '删除这条 AI 笔记？', content: '本机笔记会被删除；关联事件中的同一条笔记也会同步移除。', confirmColor: '#d65b53', success: result => {
      if (!result.confirm) return;
      store.set('aiNotes', store.get('aiNotes', []).filter(item => item.id !== id));
      const events = store.get('events', []);
      const affected = new Set((note.selectedRecordIds || []).filter(key => key.indexOf('event:') === 0).map(key => key.slice(6)));
      affected.forEach(eventId => {
        const index = events.findIndex(item => item.id === eventId);
        if (index < 0) return;
        events[index] = Object.assign({}, events[index], { notes: (events[index].notes || []).filter(item => item.id !== id), syncStatus: '待同步' });
        cloud.background('userData', { action: 'upsert', type: 'event', clientId: eventId, record: records.toCloudRecord(events[index]) });
      });
      if (affected.size) store.set('events', events);
      this.loadNotes();
      wx.showToast({ title: '已删除', icon: 'success' });
    }});
  }
});
