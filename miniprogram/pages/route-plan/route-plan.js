const routeUtils = require('../../utils/route-plan.js');

Page({
  data: {
    modes: routeUtils.MODES,
    form: { startName: '', waypointName: '', endName: '', mode: 'walking' },
    waypointEnabled: false,
    selectedPlaces: { startName: null, waypointName: null, endName: null },
    activeSuggestKey: '',
    suggestions: [],
    suggestLoading: false,
    suggestMessage: '',
    loading: false,
    message: '',
    routes: [],
    selectedIndex: 0,
    polylines: [],
    mapLatitude: 30.2741,
    mapLongitude: 120.1551,
    mapScale: 11
  },

  onLoad() {
    const saved = wx.getStorageSync('selectedRoutePlan');
    if (!saved) return;
    this.setData({
      form: {
        startName: saved.startName || '',
        waypointName: saved.waypointName || '',
        endName: saved.endName || '',
        mode: saved.mode || 'walking'
      },
      waypointEnabled: Boolean(saved.waypointName)
    });
  },

  onUnload() {
    clearTimeout(this.suggestTimer);
    clearTimeout(this.hideSuggestTimer);
  },

  onStartInput(e) {
    this.updateInput('startName', e.detail.value);
  },

  onEndInput(e) {
    this.updateInput('endName', e.detail.value);
  },

  onWaypointInput(e) {
    this.updateInput('waypointName', e.detail.value);
  },

  updateInput(key, value) {
    const text = routeUtils.normalizeText(value);
    this.setData({
      ['form.' + key]: text,
      ['selectedPlaces.' + key]: null,
      routes: [], polylines: [], message: ''
    });
    this.scheduleSuggestions(key, text);
  },

  onPlaceFocus(e) {
    const key = e.currentTarget.dataset.key;
    this.scheduleSuggestions(key, this.data.form[key]);
  },

  onPlaceBlur() {
    clearTimeout(this.hideSuggestTimer);
    this.hideSuggestTimer = setTimeout(() => {
      this.setData({ activeSuggestKey: '', suggestions: [], suggestMessage: '' });
    }, 180);
  },

  scheduleSuggestions(key, keyword) {
    clearTimeout(this.suggestTimer);
    this.suggestSequence = (this.suggestSequence || 0) + 1;
    const sequence = this.suggestSequence;
    if (!keyword || keyword.length < 2) {
      this.setData({ activeSuggestKey: '', suggestions: [], suggestLoading: false, suggestMessage: '' });
      return;
    }
    this.setData({ activeSuggestKey: key, suggestions: [], suggestLoading: true, suggestMessage: '' });
    this.suggestTimer = setTimeout(() => {
      if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
        this.setData({ suggestLoading: false, suggestMessage: '当前未连接项目云环境。' });
        return;
      }
      wx.cloud.callFunction({
        name: 'routePlan',
        data: { action: 'suggest', keyword },
        success: result => {
          if (sequence !== this.suggestSequence) return;
          const data = (result && result.result) || {};
          this.setData({
            suggestions: data.suggestions || [],
            suggestLoading: false,
            suggestMessage: data.message || (!(data.suggestions || []).length ? '没有找到匹配地点' : '')
          });
        },
        fail: () => {
          if (sequence !== this.suggestSequence) return;
          this.setData({ suggestions: [], suggestLoading: false, suggestMessage: '地点候选暂时不可用，可继续输入完整名称。' });
        }
      });
    }, 350);
  },

  selectSuggestion(e) {
    clearTimeout(this.hideSuggestTimer);
    const key = e.currentTarget.dataset.key;
    const suggestion = this.data.suggestions[Number(e.currentTarget.dataset.index)];
    if (!suggestion) return;
    this.suggestSequence = (this.suggestSequence || 0) + 1;
    this.setData({
      ['form.' + key]: suggestion.title,
      ['selectedPlaces.' + key]: suggestion,
      activeSuggestKey: '',
      suggestions: [],
      suggestLoading: false,
      suggestMessage: '',
      routes: [], polylines: [], message: ''
    });
  },

  addWaypoint() {
    this.setData({ waypointEnabled: true });
  },

  clearWaypoint() {
    this.suggestSequence = (this.suggestSequence || 0) + 1;
    this.setData({
      'form.waypointName': '',
      'selectedPlaces.waypointName': null,
      waypointEnabled: false,
      activeSuggestKey: '', suggestions: [], suggestMessage: '',
      routes: [], polylines: [], message: ''
    });
  },

  swapPlaces() {
    const form = this.data.form;
    this.setData({
      form: Object.assign({}, form, { startName: form.endName, endName: form.startName }),
      selectedPlaces: Object.assign({}, this.data.selectedPlaces, {
        startName: this.data.selectedPlaces.endName,
        endName: this.data.selectedPlaces.startName
      }),
      routes: [], polylines: [], message: ''
    });
  },

  selectMode(e) {
    this.setData({
      'form.mode': e.currentTarget.dataset.mode,
      routes: [], polylines: [], message: ''
    });
  },

  planRoute() {
    const form = this.data.form;
    if (!form.startName || !form.endName || this.data.loading) return;
    if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
      this.setData({ message: '当前未连接项目云环境，请联系项目管理员。' });
      return;
    }
    this.setData({ loading: true, message: '', routes: [], polylines: [] });
    wx.cloud.callFunction({
      name: 'routePlan',
      data: {
        start: form.startName,
        waypoint: form.waypointName,
        end: form.endName,
        mode: form.mode,
        startPlace: this.data.selectedPlaces.startName,
        waypointPlace: this.data.selectedPlaces.waypointName,
        endPlace: this.data.selectedPlaces.endName
      },
      success: result => {
        const data = result && result.result;
        if (!data || !data.routes || !data.routes.length) {
          this.setData({ loading: false, message: (data && data.message) || '未找到可用路线，请补充更完整的地点名称。' });
          return;
        }
        this.applyRoutes(data);
      },
      fail: error => this.setData({ loading: false, message: routeUtils.getErrorMessage(error) })
    });
  },

  applyRoutes(data) {
    const routes = data.routes.slice(0, 3);
    const allPoints = routes.reduce((points, route) => points.concat(route.points || []), []);
    this.setData({
      loading: false,
      message: '已生成 ' + routes.length + ' 条路线，请选择一条作为本次行程路线。',
      routes,
      selectedIndex: 0,
      polylines: routeUtils.buildPolylines(routes, 0),
      mapLatitude: (data.start.latitude + data.end.latitude) / 2,
      mapLongitude: (data.start.longitude + data.end.longitude) / 2
    }, () => {
      if (!allPoints.length || typeof wx.createMapContext !== 'function') return;
      wx.createMapContext('routeMap', this).includePoints({
        points: allPoints,
        padding: [50, 40, 50, 40]
      });
    });
  },

  selectRoute(e) {
    const selectedIndex = Number(e.currentTarget.dataset.index);
    this.setData({
      selectedIndex,
      polylines: routeUtils.buildPolylines(this.data.routes, selectedIndex)
    });
  },

  confirmRoute() {
    const route = this.data.routes[this.data.selectedIndex];
    if (!route) return;
    const selected = routeUtils.buildSelectedRoute(route, this.data.form);
    wx.setStorageSync('selectedRoutePlan', selected);
    wx.showToast({ title: '路线已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => wx.navigateTo({ url: '/pages/precheck/precheck' })
      });
    }, 350);
  }
});
