const store = require('../../utils/store');
const nav = require('../../utils/nav');
const cloud = require('../../utils/cloud');

function eventLabel(event) { return `${event.type || '接触事件'} · ${event.createdAt || '时间未记录'}`.slice(0, 30); }
function routeLabel(route) { return route && (route.summary || [route.start, route.end].filter(Boolean).join(' → ') || '已关联路线'); }
function eventType(event) { const value = String(event.type || event.contactTypeName || ''); if (value.indexOf('蜇') > -1) return '蜇伤'; if (value.indexOf('附着') > -1) return '发现附着虫体'; if (value.indexOf('皮疹') > -1 || value.indexOf('不适') > -1) return '接触后皮疹/不适'; return value.indexOf('叮咬') > -1 ? '叮咬' : ''; }
function eventStage(event) { if (event.stage) return event.stage; return event.status === '历史' || event.status === '已完成' ? '观察完成' : '观察中'; }
function routeRegion(route) { const text = [route && route.summary, route && route.start, route && route.end].join(' '); return ['杭州', '宁波', '温州', '丽水', '台州'].map(city => `浙江${city}`).find(region => text.indexOf(region.slice(2)) > -1) || ''; }

Page({
  data: {
    region: '浙江丽水', type: '叮咬', stage: '观察完成', text: '', images: [], route: null, routeLabel: '', selectedEventId: '', selectedEventLabel: '', publishing: false, pickerVisible: false, pickerKey: '', pickerTitle: '', pickerItems: [],
  },
  onLoad() {
    const draft = store.get('postDraft', null);
    if (draft) this.setData(Object.assign({}, draft, { publishing: false }));
    this.loadEvents();
  },
  onShow() { const route = store.get('routeDraft', null); if (route && (!this.data.route || this.waitingForRoute)) { this.waitingForRoute = false; this.setData({ route, routeLabel: routeLabel(route), region: routeRegion(route) || this.data.region }); } },
  loadEvents() { const events = store.get('events', []); this.events = Array.isArray(events) ? events : []; },
  back() { nav.back(); },
  input(e) { this.setData({ text: e.detail.value }); },
  selectRegion() { this.openPicker('region', '选择地区', ['浙江杭州', '浙江宁波', '浙江温州', '浙江丽水', '浙江台州']); },
  selectType() { this.openPicker('type', '选择接触类型', ['叮咬', '蜇伤', '发现附着虫体', '接触后皮疹/不适', '不确定']); },
  selectStage() { this.openPicker('stage', '选择经历阶段', ['刚发生', '处理中', '观察中', '观察完成']); },
  openPicker(key, title, items) { this.setData({ pickerVisible: true, pickerKey: key, pickerTitle: title, pickerItems: items }); },
  noop() {},
  closePicker() { this.setData({ pickerVisible: false }); },
  selectPicker(e) { const index = Number(e.currentTarget.dataset.index); const key = this.data.pickerKey; if (key === 'event') { const event = (this.pickerEvents || [])[index]; if (event) this.setData({ selectedEventId: event.id, selectedEventLabel: eventLabel(event), selectedEventImages: this.eventImages(event), type: eventType(event) || this.data.type, stage: eventStage(event) || this.data.stage, region: event.region || this.data.region, pickerVisible: false }); return; } if (key === 'route') { const route = (this.pickerRoutes || [])[index]; if (!route) { this.closePicker(); this.waitingForRoute = true; wx.navigateTo({ url: '/pages/route-plan/route-plan?from=publish' }); return; } this.setData({ route, routeLabel: routeLabel(route), region: routeRegion(route) || this.data.region, pickerVisible: false }); return; } this.setData({ [key]: this.data.pickerItems[index], pickerVisible: false }); },
  image() { wx.chooseMedia({ count: 3, mediaType: ['image'], success: result => this.setData({ images: this.data.images.concat(result.tempFiles.map(item => item.tempFilePath).filter(Boolean)).slice(0, 3) }) }); },
  removeImage(e) { const index = Number(e.currentTarget.dataset.index); this.setData({ images: this.data.images.filter((_, itemIndex) => itemIndex !== index) }); },
  chooseEvent() { this.loadEvents(); if (!this.events.length) { wx.showToast({ title: '暂无可关联的事件记录', icon: 'none' }); return; } this.pickerEvents = this.events; this.openPicker('event', '关联事件记录', this.events.map(eventLabel)); },
  eventImages(event) { const source = event && (event.imageFileIds || event.imageRefs || event.images) || []; return (Array.isArray(source) ? source : [source]).map(item => typeof item === 'string' ? item : item.tempFilePath || item.fileID || '').filter(Boolean); },
  importEventImages() { const images = this.data.selectedEventImages || []; if (!this.data.selectedEventId) { wx.showToast({ title: '请先关联事件', icon: 'none' }); return; } if (!images.length) { wx.showToast({ title: '该事件没有可导入的图片', icon: 'none' }); return; } this.setData({ images: this.data.images.concat(images).filter((item, index, all) => all.indexOf(item) === index).slice(0, 3) }); wx.showToast({ title: '已导入事件图片' }); },
  clearEvent() { this.setData({ selectedEventId: '', selectedEventLabel: '' }); },
  planRoute() { const saved = store.get('routeDraft', null); const plans = store.get('plans', []); const planRoutes = (Array.isArray(plans) ? plans : []).map(plan => ({ id: plan.id, summary: `${plan.title}${plan.distance ? ` · ${plan.distance}` : ''}`, start: plan.title, end: '', mode: plan.type || '', distance: plan.distance || '' })); const routes = [null].concat(saved ? [saved] : [], planRoutes); this.pickerRoutes = routes; this.openPicker('route', '关联路线', ['新建路线'].concat(routes.slice(1).map(routeLabel))); },
  removeRoute() { this.setData({ route: null, routeLabel: '' }); store.remove('routeDraft'); },
  save() { store.set('postDraft', this.data); wx.showToast({ title: '草稿已保存' }); },
  uploadImages() { const paths = this.data.images.filter(path => path && path.indexOf('cloud://') !== 0); const existing = this.data.images.filter(path => path && path.indexOf('cloud://') === 0); return Promise.all(paths.map((filePath, index) => wx.cloud.uploadFile({ cloudPath: `community/${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}.jpg`, filePath }).then(result => result.fileID))).then(uploaded => existing.concat(uploaded)); },
  publish() {
    if (this.data.publishing) return;
    const text = this.data.text.trim();
    if (text.length < 20) { wx.showToast({ title: '请至少填写 20 个字', icon: 'none' }); return; }
    if (!cloud.available()) { wx.showToast({ title: '云服务未连接，暂不能发布', icon: 'none' }); return; }
    this.setData({ publishing: true }); let uploadedIds = [];
    this.uploadImages().then(imageFileIds => { uploadedIds = imageFileIds.filter(id => id.indexOf('cloud://') === 0); const record = { id: store.id('post'), author: store.get('user', { nickname: '林间观察员' }).nickname, region: this.data.region, type: this.data.type, stage: this.data.stage, title: text.slice(0, 18), text, route: routeLabel(this.data.route) || '', routePlan: this.data.route || null, eventId: this.data.selectedEventId, imageFileIds, likes: 0, comments: 0, favorites: 0 }; return cloud.call('community', Object.assign({ action: 'publish' }, record)); }).then(() => { store.remove('postDraft'); wx.showToast({ title: '发布成功' }); setTimeout(() => wx.navigateBack(), 500); }).catch(error => { if (uploadedIds.length && wx.cloud.deleteFile) wx.cloud.deleteFile({ fileList: uploadedIds }).catch(() => {}); wx.showToast({ title: (error && error.message) || '发布失败，请稍后重试', icon: 'none' }); this.setData({ publishing: false }); });
  }
});
