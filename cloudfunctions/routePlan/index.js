const cloud = require('wx-server-sdk');
const https = require('https');
const { readableError } = require('./error-message');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const MAP_KEY = process.env.TENCENT_MAP_KEY;
const MODE_CONFIG = {
  walking: { path: '/ws/direction/v1/walking', name: '步行', policies: [null] },
  bicycling: { path: '/ws/direction/v1/bicycling', name: '骑行', policies: [null] },
  driving: {
    path: '/ws/direction/v1/driving',
    name: '驾车',
    policies: [
      { key: 'LEAST_TIME', name: '推荐路线' },
      { key: 'LEAST_TIME,AVOID_HIGHWAY', name: '避开高速' },
      { key: 'SHORT_DISTANCE', name: '距离较短' }
    ]
  }
};

function request(path, params) {
  const query = Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&');
  return new Promise((resolve, reject) => {
    https.get('https://apis.map.qq.com' + path + '?' + query, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.status !== 0) {
            const error = new Error(data.message || '地图服务请求失败');
            error.mapStatus = data.status;
            error.httpStatus = response.statusCode;
            error.isMapProviderError = true;
            reject(error);
          } else resolve(data);
        } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

async function locate(address) {
  const data = await request('/ws/place/v1/suggestion', { keyword: address, region: '浙江', region_fix: 1, key: MAP_KEY });
  const place = data.data && data.data[0];
  if (!place || !place.location) throw new Error('未找到地点：' + address);
  return { latitude: Number(place.location.lat), longitude: Number(place.location.lng), title: place.title || address };
}

function normalizeSelectedPlace(place, fallbackTitle) {
  if (!place) return null;
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude, title: String(place.title || fallbackTitle || '').trim() };
}

async function resolvePlace(text, selectedPlace) {
  return normalizeSelectedPlace(selectedPlace, text) || locate(text);
}

async function suggestPlaces(keyword) {
  const text = String(keyword || '').trim();
  if (text.length < 2) return { suggestions: [] };
  const data = await request('/ws/place/v1/suggestion', {
    keyword: text,
    region: '浙江',
    region_fix: 1,
    page_size: 8,
    key: MAP_KEY
  });
  const suggestions = ((data && data.data) || []).slice(0, 8).map((place, index) => ({
    id: String(place.id || index),
    title: String(place.title || ''),
    address: String(place.address || ''),
    city: String(place.city || ''),
    district: String(place.district || ''),
    latitude: Number(place.location && place.location.lat),
    longitude: Number(place.location && place.location.lng)
  })).filter(place => place.title && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  return { suggestions };
}

function decodePolyline(source) {
  const values = (source || []).slice();
  for (let i = 2; i < values.length; i += 1) values[i] = values[i - 2] + values[i] / 1000000;
  const points = [];
  for (let i = 0; i + 1 < values.length; i += 2) points.push({ latitude: Number(values[i]), longitude: Number(values[i + 1]) });
  return points;
}

function formatDistance(meters) { return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : meters + ' m'; }
function formatDuration(minutes) { return Math.max(1, Math.round(minutes)) + ' 分钟'; }

function buildRoute(route, name, id) {
  const distance = Number(route.distance || 0);
  const duration = Number(route.duration || 0);
  return {
    id,
    name,
    distance,
    duration,
    distanceText: formatDistance(distance),
    durationText: formatDuration(duration),
    points: decodePolyline(route.polyline)
  };
}

async function getRoutes(start, end, mode, policy, waypoint, multiple) {
  const config = MODE_CONFIG[mode];
  const params = {
    from: start.latitude + ',' + start.longitude,
    to: end.latitude + ',' + end.longitude,
    key: MAP_KEY
  };
  if (policy) params.policy = policy.key;
  if (mode === 'driving' && waypoint) {
    params.waypoints = waypoint.latitude + ',' + waypoint.longitude;
  }
  if (mode === 'driving' && multiple) params.get_mp = 1;
  const data = await request(config.path, params);
  const source = (data.result && data.result.routes) || [];
  return source.slice(0, 3).map((route, index) => {
    const name = policy && index === 0 ? policy.name : (index === 0 ? '推荐路线' : '备选路线 ' + (index + 1));
    const id = (policy ? policy.key : mode) + '_' + index;
    return buildRoute(route, name, id);
  });
}

async function getRouteThroughWaypoint(start, waypoint, end, mode) {
  const first = await getRoutes(start, waypoint, mode, null, null, false);
  const second = await getRoutes(waypoint, end, mode, null, null, false);
  if (!first.length || !second.length) return null;
  const firstRoute = first[0];
  const secondRoute = second[0];
  const points = firstRoute.points.concat(secondRoute.points.slice(1));
  const distance = firstRoute.distance + secondRoute.distance;
  const duration = firstRoute.duration + secondRoute.duration;
  return {
    id: mode + '_via',
    name: '经过“' + waypoint.title + '”',
    distance,
    duration,
    distanceText: formatDistance(distance),
    durationText: formatDuration(duration),
    points
  };
}

function uniqueRoutes(routes) {
  const seen = {};
  return routes.filter(route => {
    const signature = route.distanceText + '|' + route.durationText + '|' + route.points.length;
    if (seen[signature]) return false;
    seen[signature] = true;
    return route.points.length > 1;
  });
}

async function planRoute(event) {
  if (!MAP_KEY) return { routes: [], message: '尚未配置地图服务 Key' };
  const startText = String(event.start || '').trim();
  const endText = String(event.end || '').trim();
  const waypointText = String(event.waypoint || '').trim();
  const mode = MODE_CONFIG[event.mode] ? event.mode : 'walking';
  if (!startText || !endText) throw new Error('请填写起点和终点');
  // Keep requests sequential so a personal developer account only needs
  // one concurrent request quota for each WebService API.
  const start = await resolvePlace(startText, event.startPlace);
  const end = await resolvePlace(endText, event.endPlace);
  const waypoint = waypointText ? await resolvePlace(waypointText, event.waypointPlace) : null;
  const config = MODE_CONFIG[mode];
  const results = [];
  const firstPolicy = config.policies[0];
  try {
    results.push({ status: 'fulfilled', value: await getRoutes(start, end, mode, firstPolicy, waypoint, true) });
  } catch (reason) {
    results.push({ status: 'rejected', reason });
  }

  let routes = uniqueRoutes(results
    .filter(item => item.status === 'fulfilled')
    .reduce((list, item) => list.concat(item.value), []));

  if (mode === 'driving') {
    for (const policy of config.policies.slice(1)) {
      if (routes.length >= 3) break;
      try {
        routes = uniqueRoutes(routes.concat(await getRoutes(start, end, mode, policy, waypoint, false)));
      } catch (reason) {
        results.push({ status: 'rejected', reason });
      }
    }
  } else if (waypoint) {
    try {
      const viaRoute = await getRouteThroughWaypoint(start, waypoint, end, mode);
      if (viaRoute) routes = uniqueRoutes([viaRoute].concat(routes));
    } catch (reason) {
      results.push({ status: 'rejected', reason });
    }
  }
  routes = routes.slice(0, 3);
  if (!routes.length) {
    const failedRequest = results.find(item => item.status === 'rejected');
    if (failedRequest) throw failedRequest.reason;
    throw new Error('未能找到可用路线');
  }
  return { start, waypoint, end, mode, modeName: config.name, routes };
}

exports.main = async event => {
  try {
    if (!MAP_KEY) return { routes: [], suggestions: [], message: '尚未配置地图服务 Key' };
    if (event && event.action === 'suggest') return await suggestPlaces(event.keyword);
    return await planRoute(event || {});
  } catch (error) {
    console.error('routePlan failed:', error);
    return {
      routes: [],
      message: readableError(error, MAP_KEY),
      serviceStatus: error && error.mapStatus !== undefined ? error.mapStatus : null
    };
  }
};
