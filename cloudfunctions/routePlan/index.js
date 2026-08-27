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
      { key: 'RECOMMEND', name: '推荐路线' },
      { key: 'LEAST_TIME', name: '用时较短' },
      { key: 'LEAST_DISTANCE', name: '距离较短' }
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

function decodePolyline(source) {
  const values = (source || []).slice();
  for (let i = 2; i < values.length; i += 1) values[i] = values[i - 2] + values[i] / 1000000;
  const points = [];
  for (let i = 0; i + 1 < values.length; i += 2) points.push({ latitude: Number(values[i]), longitude: Number(values[i + 1]) });
  return points;
}

function formatDistance(meters) { return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : meters + ' m'; }
function formatDuration(seconds) { return Math.max(1, Math.round(seconds / 60)) + ' 分钟'; }

function buildRoute(route, name, id) {
  return {
    id,
    name,
    distanceText: formatDistance(route.distance || 0),
    durationText: formatDuration(route.duration || 0),
    points: decodePolyline(route.polyline)
  };
}

async function getRoutes(start, end, mode, policy) {
  const config = MODE_CONFIG[mode];
  const params = {
    from: start.latitude + ',' + start.longitude,
    to: end.latitude + ',' + end.longitude,
    key: MAP_KEY
  };
  if (policy) params.policy = policy.key;
  const data = await request(config.path, params);
  const source = (data.result && data.result.routes) || [];
  return source.slice(0, 3).map((route, index) => {
    const name = policy ? policy.name : (index === 0 ? '推荐路线' : '备选路线 ' + (index + 1));
    const id = (policy ? policy.key : mode) + '_' + index;
    return buildRoute(route, name, id);
  });
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
  const mode = MODE_CONFIG[event.mode] ? event.mode : 'walking';
  if (!startText || !endText) throw new Error('请填写起点和终点');
  // Keep requests sequential so a personal developer account only needs
  // one concurrent request quota for each WebService API.
  const start = await locate(startText);
  const end = await locate(endText);
  const config = MODE_CONFIG[mode];
  const results = [];
  for (const policy of config.policies) {
    try {
      results.push({ status: 'fulfilled', value: await getRoutes(start, end, mode, policy) });
    } catch (reason) {
      results.push({ status: 'rejected', reason });
    }
  }
  const routes = uniqueRoutes(results
    .filter(item => item.status === 'fulfilled')
    .reduce((list, item) => list.concat(item.value), []))
    .slice(0, 3);
  if (!routes.length) {
    const failedRequest = results.find(item => item.status === 'rejected');
    if (failedRequest) throw failedRequest.reason;
    throw new Error('未能找到可用路线');
  }
  return { start, end, mode, modeName: config.name, routes };
}

exports.main = async event => {
  try {
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
