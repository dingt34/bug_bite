const MODES = [
  { key: 'walking', name: '步行' },
  { key: 'bicycling', name: '骑行' },
  { key: 'driving', name: '驾车' }
];

const ZHEJIANG_REGIONS = ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'];

function normalizeText(value) {
  return String(value || '').trim().slice(0, 40);
}

function normalizeWaypoints(value, legacyName) {
  const source = Array.isArray(value) && value.length ? value : (legacyName ? [{ name: legacyName }] : []);
  return source.map((item, index) => {
    const waypoint = typeof item === 'string' ? { name: item } : (item || {});
    return {
      id: String(waypoint.id || ('waypoint_' + index)),
      name: normalizeText(waypoint.name || waypoint.title),
      place: waypoint.place || null
    };
  }).filter(item => item.name).slice(0, 5);
}

function inferRouteRegions(routeOrPlaces) {
  const source = routeOrPlaces || {};
  if (Array.isArray(source.regions) && source.regions.length) {
    return source.regions.filter(item => ZHEJIANG_REGIONS.indexOf(item) > -1);
  }
  const places = Array.isArray(source)
    ? source
    : [source.startPlace].concat(source.waypointPlaces || [], [source.endPlace]);
  const matched = [];
  places.filter(Boolean).forEach(place => {
    const haystack = [place.city, place.district, place.address, place.title].join('');
    ZHEJIANG_REGIONS.forEach(region => {
      if (haystack.indexOf(region) > -1 && matched.indexOf(region) < 0) matched.push(region);
    });
  });
  return matched;
}

function buildPolylines(routes, selectedIndex) {
  return (Array.isArray(routes) ? routes : []).map((route, index) => ({
    points: Array.isArray(route.points) ? route.points : [],
    color: index === selectedIndex ? '#2E7D5B' : '#9BCDB5',
    width: index === selectedIndex ? 9 : 4,
    borderColor: '#FFFFFF',
    borderWidth: 1
  }));
}

function buildSelectedRoute(route, context, now) {
  if (!route || !context) return null;
  const mode = MODES.find(item => item.key === context.mode) || MODES[0];
  const waypoints = normalizeWaypoints(context.waypoints, context.waypointName);
  const selectedPlaces = context.selectedPlaces || {};
  const regions = inferRouteRegions({
    regions: context.regions,
    startPlace: selectedPlaces.startName,
    waypointPlaces: waypoints.map(item => item.place).filter(Boolean),
    endPlace: selectedPlaces.endName
  });
  return {
    id: 'route_' + (now || Date.now()),
    startName: normalizeText(context.startName),
    waypointName: waypoints[0] ? waypoints[0].name : '',
    waypointNames: waypoints.map(item => item.name),
    waypoints,
    endName: normalizeText(context.endName),
    regions,
    mode: mode.key,
    modeName: mode.name,
    routeId: route.id,
    routeName: route.name,
    distanceText: route.distanceText,
    durationText: route.durationText,
    points: Array.isArray(route.points) ? route.points.slice() : [],
    savedAtTimestamp: now || Date.now()
  };
}

function getErrorMessage(error) {
  const text = String((error && (error.message || error.errMsg)) || error || '');
  if (text.indexOf('FunctionName') > -1 || text.indexOf('FUNCTION_NOT_FOUND') > -1) return '路线服务尚未部署，请联系项目管理员。';
  if (text.indexOf('WebserviceAPI') > -1) return '地图服务权限尚未开启，请联系项目管理员。';
  if (text.indexOf('functions execute fail') > -1 || text.indexOf('FUNCTIONS_EXECUTE_FAIL') > -1) return '路线云函数执行失败，请重新部署 routePlan 后重试。';
  if (text.indexOf('未找到地点') > -1) {
    const match = text.match(/未找到地点[^\n]*/);
    return (match && match[0]) || '未找到输入的地点，请补充城市或区县名称。';
  }
  return '路线规划暂时不可用，请稍后重试。';
}

module.exports = {
  MODES,
  ZHEJIANG_REGIONS,
  normalizeText,
  normalizeWaypoints,
  inferRouteRegions,
  buildPolylines,
  buildSelectedRoute,
  getErrorMessage
};
