const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const MAP_KEY = process.env.TENCENT_MAP_KEY;
const POLICIES = [
  { key: 'RECOMMEND', name: '推荐路线' },
  { key: 'LEAST_TIME', name: '用时较短' },
  { key: 'LEAST_DISTANCE', name: '距离较短' }
];

function request(path, params) {
  const query = Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&');
  return new Promise((resolve, reject) => {
    https.get('https://apis.map.qq.com' + path + '?' + query, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.status !== 0) reject(new Error(data.message || '地图服务请求失败'));
          else resolve(data);
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

async function getRoute(start, end, policy) {
  const data = await request('/ws/direction/v1/driving', {
    from: start.latitude + ',' + start.longitude,
    to: end.latitude + ',' + end.longitude,
    policy: policy.key,
    key: MAP_KEY
  });
  const route = data.result && data.result.routes && data.result.routes[0];
  if (!route) throw new Error('未找到' + policy.name);
  return {
    id: policy.key,
    name: policy.name,
    distanceText: formatDistance(route.distance || 0),
    durationText: formatDuration(route.duration || 0),
    points: decodePolyline(route.polyline)
  };
}

exports.main = async event => {
  if (!MAP_KEY) return { routes: [], message: '尚未配置地图服务 Key' };
  const startText = String(event.start || '').trim();
  const endText = String(event.end || '').trim();
  if (!startText || !endText) throw new Error('请填写起点和终点');
  const [start, end] = await Promise.all([locate(startText), locate(endText)]);
  const results = await Promise.allSettled(POLICIES.map(policy => getRoute(start, end, policy)));
  const routes = results.filter(item => item.status === 'fulfilled' && item.value.points.length > 1).map(item => item.value);
  if (!routes.length) throw new Error('未能找到可用路线');
  return { start, end, routes };
};
