const https = require('https');
const { readableError } = require('./error-message');
const { inferEnvironmentTags } = require('./environment-tags');

const MODE_PATHS = { walking: 'walking', bicycling: 'bicycling', driving: 'driving' };

function requestJson(path, params) {
  return new Promise((resolve, reject) => {
    const request = https.get('https://apis.map.qq.com' + path + '?' + params.toString(), response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch (_) { reject(new Error('地图服务返回格式异常')); return; }
        if (data.status !== 0) {
          const error = new Error(data.message || '地图服务请求失败');
          error.mapStatus = data.status;
          error.isMapProviderError = true;
          reject(error);
          return;
        }
        resolve(data);
      });
    });
    request.setTimeout(12000, () => request.destroy(new Error('地图服务请求超时')));
    request.on('error', reject);
  });
}

function text(value) { return String(value || '').trim().slice(0, 80); }

function normalizePlace(value) {
  const source = value || {};
  const location = source.location || source;
  const latitude = Number(location.latitude !== undefined ? location.latitude : location.lat);
  const longitude = Number(location.longitude !== undefined ? location.longitude : location.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: String(source.id || ''), title: text(source.title || source.name), address: text(source.address),
    city: text(source.city || (source.ad_info && source.ad_info.city)),
    district: text(source.district || (source.ad_info && source.ad_info.district)), latitude, longitude
  };
}

async function suggestPlaces(keyword, mapKey) {
  const params = new URLSearchParams();
  params.set('keyword', text(keyword));
  params.set('region', '浙江');
  params.set('region_fix', '0');
  params.set('page_size', '8');
  params.set('key', mapKey);
  const result = await requestJson('/ws/place/v1/suggestion/', params);
  return (result.data || []).map(normalizePlace).filter(Boolean);
}

async function resolvePlace(placeText, selectedPlace, mapKey) {
  const selected = normalizePlace(selectedPlace);
  if (selected) return selected;
  const candidates = await suggestPlaces(placeText, mapKey);
  if (candidates.length) return candidates[0];
  throw new Error('未找到地点：' + text(placeText));
}

function coordinate(place) { return place.latitude + ',' + place.longitude; }

function decodePolyline(polyline) {
  if (!Array.isArray(polyline) || polyline.length < 2) return [];
  const values = polyline.map(Number);
  for (let index = 2; index < values.length; index += 1) values[index] = values[index - 2] + values[index] / 1000000;
  const points = [];
  for (let index = 0; index + 1 < values.length; index += 2) {
    if (Number.isFinite(values[index]) && Number.isFinite(values[index + 1])) points.push({ latitude: values[index], longitude: values[index + 1] });
  }
  return points;
}

function distanceText(meters) { return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m'; }
function durationText(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? Math.floor(minutes / 60) + '小时' + (minutes % 60 ? (minutes % 60) + '分钟' : '') : minutes + '分钟';
}

async function getRouteThroughWaypoints(start, waypoints, end, mode, mapKey) {
  const params = new URLSearchParams();
  params.set('from', coordinate(start));
  params.set('to', coordinate(end));
  params.set('key', mapKey);
  params.set('get_mp', '1');
  if (waypoints.length) params.set('waypoints', waypoints.map(coordinate).join(';'));
  const result = await requestJson('/ws/direction/v1/' + MODE_PATHS[mode] + '/', params);
  const routes = ((result.result && result.result.routes) || []).map((route, index) => ({
    id: mode + '_' + index,
    name: index === 0 ? '推荐路线' : '备选路线 ' + (index + 1),
    distanceText: distanceText(Number(route.distance || 0)),
    durationText: durationText(Number(route.duration || 0)),
    environmentTags: inferEnvironmentTags(route, [start].concat(waypoints, [end])),
    points: decodePolyline(route.polyline)
  })).filter(route => route.points.length > 1);
  if (!routes.length) throw new Error('未能找到可用路线');
  return routes.slice(0, 3);
}

exports.main = async event => {
  const mapKey = process.env.TENCENT_MAP_KEY;
  if (!mapKey) return { ok: false, code: 'NOT_CONFIGURED', message: '请先配置腾讯地图云函数密钥' };
  try {
    if (event.action === 'suggest') {
      const keyword = text(event.keyword);
      if (keyword.length < 2) return { ok: true, suggestions: [] };
      return { ok: true, suggestions: await suggestPlaces(keyword, mapKey) };
    }
    const startText = text(event.start);
    const endText = text(event.end);
    if (!startText || !endText) return { ok: false, code: 'INVALID_LOCATION', message: '请填写起点和终点' };
    const mode = MODE_PATHS[event.mode] ? event.mode : 'walking';
    const waypointTexts = (Array.isArray(event.waypoints) ? event.waypoints : []).map(text).filter(Boolean).slice(0, 5);
    const start = await resolvePlace(startText, event.startPlace, mapKey);
    const end = await resolvePlace(endText, event.endPlace, mapKey);
    const waypoints = [];
    for (let index = 0; index < waypointTexts.length; index += 1) waypoints.push(await resolvePlace(waypointTexts[index], (event.waypointPlaces || [])[index], mapKey));
    const routes = await getRouteThroughWaypoints(start, waypoints, end, mode, mapKey);
    return { ok: true, routes, start, end };
  } catch (error) {
    console.error('routePlan', error);
    return { ok: false, code: 'ROUTE_FAILED', message: readableError(error, mapKey) };
  }
};
