const routeUtils = require('../../utils/route-plan.js');

Page({
  data: {
    modes: routeUtils.MODES,
    form: { startName: '', endName: '', mode: 'walking' },
    waypoints: [],
    selectedPlaces: { startName: null, endName: null },
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
        endName: saved.endName || '',
        mode: saved.mode || 'walking'
      },
      waypoints: routeUtils.normalizeWaypoints(saved.waypoints || saved.waypointNames, saved.waypointName)
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
    const index = Number(e.currentTarget.dataset.index);
    const waypoints = this.data.waypoints.slice();
    if (!waypoints[index]) return;
    waypoints[index] = Object.assign({}, waypoints[index], {
      name: routeUtils.normalizeText(e.detail.value), place: null
    });
    this.setData({ waypoints, routes: [], polylines: [], message: '' });
    this.scheduleSuggestions('waypoint_' + index, waypoints[index].name);
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
    const index = Number(e.currentTarget.dataset.index);
    const keyword = key === 'waypoint' ? ((this.data.waypoints[index] || {}).name || '') : this.data.form[key];
    this.scheduleSuggestions(key === 'waypoint' ? 'waypoint_' + index : key, keyword);
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
    const changes = {
      activeSuggestKey: '',
      suggestions: [],
      suggestLoading: false,
      suggestMessage: '',
      routes: [], polylines: [], message: ''
    };
    if (key.indexOf('waypoint_') === 0) {
      const waypointIndex = Number(key.split('_')[1]);
      const waypoints = this.data.waypoints.slice();
      if (!waypoints[waypointIndex]) return;
      waypoints[waypointIndex] = Object.assign({}, waypoints[waypointIndex], {
        name: suggestion.title, place: suggestion
      });
      changes.waypoints = waypoints;
    } else {
      changes['form.' + key] = suggestion.title;
      changes['selectedPlaces.' + key] = suggestion;
    }
    this.setData(changes);
  },

  addWaypoint() {
    if (this.data.waypoints.length >= 5) {
      wx.showToast({ title: '最多可设置 5 个途经点', icon: 'none' });
      return;
    }
    this.setData({
      waypoints: this.data.waypoints.concat([{ id: 'waypoint_' + Date.now(), name: '', place: null }])
    });
  },

  clearWaypoint(e) {
    this.suggestSequence = (this.suggestSequence || 0) + 1;
    const index = Number(e && e.currentTarget && e.currentTarget.dataset.index);
    const waypoints = this.data.waypoints.filter((item, itemIndex) => itemIndex !== index);
    this.setData({
      waypoints,
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
        waypoints: this.data.waypoints.map(item => item.name).filter(Boolean),
        end: form.endName,
        mode: form.mode,
        startPlace: this.data.selectedPlaces.startName,
        waypointPlaces: this.data.waypoints.filter(item => item.name).map(item => item.place),
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

  saveSelectedRoute() {
    const route = this.data.routes[this.data.selectedIndex];
    if (!route) return null;
    const selected = routeUtils.buildSelectedRoute(route, Object.assign({}, this.data.form, {
      waypoints: this.data.waypoints,
      selectedPlaces: this.data.selectedPlaces,
      regions: routeUtils.inferRouteRegions([
        this.data.selectedPlaces.startName
      ].concat(this.data.waypoints.map(item => item.place), [this.data.selectedPlaces.endName]))
    }));
    wx.setStorageSync('selectedRoutePlan', selected);
    return selected;
  },

  confirmRoute() {
    const selected = this.saveSelectedRoute();
    if (!selected) return;
    wx.showToast({ title: '路线已保存', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => wx.navigateTo({ url: '/pages/precheck/precheck' })
      });
    }, 350);
  },

  shareRoute() {
    const selected = this.saveSelectedRoute();
    if (!selected) return;
    wx.navigateTo({ url: '/pages/post-publish/post-publish?attachRoute=1' });
  }
});
