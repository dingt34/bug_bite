const MODES = [
  { key: 'walking', name: '步行' },
  { key: 'bicycling', name: '骑行' },
  { key: 'driving', name: '驾车' }
];

function normalizeText(value) {
  return String(value || '').trim().slice(0, 40);
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
  return {
    id: 'route_' + (now || Date.now()),
    startName: normalizeText(context.startName),
    endName: normalizeText(context.endName),
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
  if (text.indexOf('未找到地点') > -1) {
    const match = text.match(/未找到地点[^\n]*/);
    return (match && match[0]) || '未找到输入的地点，请补充城市或区县名称。';
  }
  return '路线规划暂时不可用，请稍后重试。';
}

module.exports = {
  MODES,
  normalizeText,
  buildPolylines,
  buildSelectedRoute,
  getErrorMessage
};
