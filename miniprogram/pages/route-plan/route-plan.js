const routeUtils = require('../../utils/route-plan.js');

Page({
  data: {
    modes: routeUtils.MODES,
    form: { startName: '', endName: '', mode: 'walking' },
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
      form: { startName: saved.startName || '', endName: saved.endName || '', mode: saved.mode || 'walking' }
    });
  },

  onStartInput(e) {
    this.updateInput('startName', e.detail.value);
  },

  onEndInput(e) {
    this.updateInput('endName', e.detail.value);
  },

  updateInput(key, value) {
    this.setData({
      ['form.' + key]: routeUtils.normalizeText(value),
      routes: [], polylines: [], message: ''
    });
  },

  swapPlaces() {
    const form = this.data.form;
    this.setData({
      form: Object.assign({}, form, { startName: form.endName, endName: form.startName }),
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
      data: { start: form.startName, end: form.endName, mode: form.mode },
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
