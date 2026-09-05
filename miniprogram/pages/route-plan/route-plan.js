const routeUtils = require('../../utils/route-plan.js');
const store = require('../../utils/store.js');
const nav = require('../../utils/nav.js');

const ROUTE_ENVIRONMENTS = ['高草/灌木', '林地/落叶层', '水边/湿地', '农田/果园', '城市公园', '室内住宿'];

function environmentOptions(selected) {
  return ROUTE_ENVIRONMENTS.map(value => ({ value, selected: selected.indexOf(value) >= 0 }));
}

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
    mapScale: 11,
    confirmLabel: '保存路线',
    routeTitle: '规划本次出行路线',
    selectedRoute: null,
    environments: [],
    environmentOptions: environmentOptions([]),
    environmentStatus: '生成路线后自动识别'
  },

  onLoad(options) {
    this.from = (options && options.from) || '';
    const saved = wx.getStorageSync('selectedRoutePlan');
    const changes = {
      confirmLabel: this.from === 'precheck'
        ? '确认路线并返回行前准备'
        : (this.from === 'publish' ? '保存并返回发布经历' : '保存路线')
    };
    if (saved) {
      const environments = (saved.environmentTags || saved.environments || []).filter(value => ROUTE_ENVIRONMENTS.indexOf(value) >= 0);
      Object.assign(changes, {
        form: {
          startName: saved.startName || '',
          endName: saved.endName || '',
          mode: saved.mode || 'walking'
        },
        waypoints: routeUtils.normalizeWaypoints(saved.waypoints || saved.waypointNames, saved.waypointName),
        selectedPlaces: {
          startName: saved.startPlace || null,
          endName: saved.endPlace || null
        },
        environments,
        environmentOptions: environmentOptions(environments),
        environmentStatus: environments.length ? '已恢复上次保存结果，可手动调整' : '生成路线后自动识别'
      });
    }
    this.setData(changes);
  },

  onUnload() {
    clearTimeout(this.suggestTimer);
    clearTimeout(this.hideSuggestTimer);
  },

  back() {
    nav.back('/pages/home/home');
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
    this.setData({ waypoints, routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '', environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别' });
    this.scheduleSuggestions('waypoint_' + index, waypoints[index].name);
  },

  updateInput(key, value) {
    const text = routeUtils.normalizeText(value);
    this.setData({
      ['form.' + key]: text,
      ['selectedPlaces.' + key]: null,
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
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
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
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

  choosePlace(e) {
    const key = e.currentTarget.dataset.key;
    const waypointIndex = Number(e.currentTarget.dataset.index);
    if (typeof wx.chooseLocation !== 'function') {
      wx.showToast({ title: '当前版本暂不支持地图选点', icon: 'none' });
      return;
    }
    wx.chooseLocation({
      success: result => {
        const latitude = Number(result.latitude);
        const longitude = Number(result.longitude);
        const title = routeUtils.normalizeText(result.name || result.address);
        if (!title || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          wx.showToast({ title: '未能读取所选地点', icon: 'none' });
          return;
        }
        const place = {
          id: 'map_' + Date.now(),
          title,
          address: routeUtils.normalizeText(result.address),
          latitude,
          longitude
        };
        const changes = {
          activeSuggestKey: '', suggestions: [], suggestLoading: false, suggestMessage: '',
          routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
          environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
        };
        if (key === 'waypoint') {
          const waypoints = this.data.waypoints.slice();
          if (!waypoints[waypointIndex]) return;
          waypoints[waypointIndex] = Object.assign({}, waypoints[waypointIndex], { name: title, place });
          changes.waypoints = waypoints;
        } else {
          changes['form.' + key] = title;
          changes['selectedPlaces.' + key] = place;
        }
        this.suggestSequence = (this.suggestSequence || 0) + 1;
        this.setData(changes);
      },
      fail: error => {
        if (!/cancel/i.test(String(error && error.errMsg || ''))) {
          wx.showToast({ title: '地图选点失败，可继续手动输入', icon: 'none' });
        }
      }
    });
  },

  addWaypoint() {
    if (this.data.waypoints.length >= 5) {
      wx.showToast({ title: '最多可设置 5 个途经点', icon: 'none' });
      return;
    }
    this.setData({
      waypoints: this.data.waypoints.concat([{ id: 'waypoint_' + Date.now(), name: '', place: null }]),
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
    });
  },

  clearWaypoint(e) {
    this.suggestSequence = (this.suggestSequence || 0) + 1;
    const index = Number(e && e.currentTarget && e.currentTarget.dataset.index);
    const waypoints = this.data.waypoints.filter((item, itemIndex) => itemIndex !== index);
    this.setData({
      waypoints,
      activeSuggestKey: '', suggestions: [], suggestMessage: '',
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
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
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
    });
  },

  selectMode(e) {
    this.setData({
      'form.mode': e.currentTarget.dataset.mode,
      routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], message: '',
      environments: [], environmentOptions: environmentOptions([]), environmentStatus: '生成路线后自动识别'
    });
  },

  toggleEnvironment(e) {
    const value = e.currentTarget.dataset.value;
    if (ROUTE_ENVIRONMENTS.indexOf(value) < 0) return;
    const environments = this.data.environments.slice();
    const index = environments.indexOf(value);
    if (index >= 0) environments.splice(index, 1);
    else environments.push(value);
    this.setData({ environments, environmentOptions: environmentOptions(environments), environmentStatus: '已手动调整' });
  },

  planRoute() {
    const form = this.data.form;
    if (!form.startName || !form.endName || this.data.loading) return;
    if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
      this.setData({ message: '当前未连接项目云环境，请联系项目管理员。' });
      return;
    }
    this.setData({ loading: true, message: '', routes: [], selectedRoute: null, routeTitle: '规划本次出行路线', polylines: [], environments: [], environmentOptions: environmentOptions([]), environmentStatus: '正在识别沿途环境…' });
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
          this.setData({ loading: false, environmentStatus: '未生成路线，无法识别沿途环境', message: (data && data.message) || '未找到可用路线，请补充更完整的地点名称。' });
          return;
        }
        this.applyRoutes(data);
      },
      fail: error => this.setData({ loading: false, environmentStatus: '路线服务不可用，暂未识别环境', message: routeUtils.getErrorMessage(error) })
    });
  },

  applyRoutes(data) {
    const routes = data.routes.slice(0, 3);
    const mode = this.data.modes.find(item => item.key === this.data.form.mode) || this.data.modes[0];
    const environments = (routes[0].environmentTags || []).filter(value => ROUTE_ENVIRONMENTS.indexOf(value) >= 0);
    const allPoints = routes.reduce((points, route) => points.concat(route.points || []), []);
    this.setData({
      loading: false,
      message: '已生成 ' + routes.length + ' 条路线，请选择一条作为本次行程路线。',
      routes,
      selectedIndex: 0,
      selectedRoute: routes[0],
      routeTitle: this.data.form.endName + mode.name + '路线',
      environments,
      environmentOptions: environmentOptions(environments),
      environmentStatus: environments.length ? '已根据地点与道路信息自动识别' : '暂未识别到明显环境，可手动选择',
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
    const selectedRoute = this.data.routes[selectedIndex];
    const environments = ((selectedRoute && selectedRoute.environmentTags) || []).filter(value => ROUTE_ENVIRONMENTS.indexOf(value) >= 0);
    this.setData({
      selectedIndex,
      selectedRoute,
      environments,
      environmentOptions: environmentOptions(environments),
      environmentStatus: environments.length ? '已根据地点与道路信息自动识别' : '暂未识别到明显环境，可手动选择',
      polylines: routeUtils.buildPolylines(this.data.routes, selectedIndex)
    });
  },

  saveSelectedRoute() {
    const route = this.data.routes[this.data.selectedIndex];
    if (!route) return null;
    const selected = routeUtils.buildSelectedRoute(route, Object.assign({}, this.data.form, {
      waypoints: this.data.waypoints,
      environmentTags: this.data.environments,
      selectedPlaces: this.data.selectedPlaces,
      regions: routeUtils.inferRouteRegions([
        this.data.selectedPlaces.startName
      ].concat(this.data.waypoints.map(item => item.place), [this.data.selectedPlaces.endName]))
    }));
    wx.setStorageSync('selectedRoutePlan', selected);
    store.set('routeDraft', {
      id: selected.id,
      summary: [selected.startName].concat(selected.waypointNames || [], [selected.endName]).filter(Boolean).join(' → '),
      start: selected.startName,
      end: selected.endName,
      endPlace: selected.endPlace,
      regions: selected.regions,
      mode: selected.mode,
      distance: selected.distanceText,
      duration: selected.durationText,
      environmentTags: selected.environmentTags,
      points: selected.points,
      verified: true
    });
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
  }
});
