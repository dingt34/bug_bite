const https = require('https');

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (_) { reject(new Error('INVALID_RESPONSE')); } });
    }).setTimeout(12000, function () { this.destroy(new Error('TIMEOUT')); }).on('error', reject);
  });
}
const point = value => value && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng))
  ? `${Number(value.lat)},${Number(value.lng)}` : '';

exports.main = async event => {
  const key = process.env.TENCENT_MAP_KEY;
  if (!key) return { ok: false, code: 'NOT_CONFIGURED', message: '请先配置腾讯地图云函数密钥' };
  const from = point(event.origin);
  const to = point(event.destination);
  if (!from || !to) return { ok: false, code: 'INVALID_LOCATION', message: '请确认起点和终点位置' };
  const mode = ['walking', 'bicycling', 'driving'].includes(event.mode) ? event.mode : 'walking';
  const waypoints = (Array.isArray(event.waypoints) ? event.waypoints : []).slice(0, 5).map(point).filter(Boolean).join(';');
  const params = [`from=${encodeURIComponent(from)}`, `to=${encodeURIComponent(to)}`, `key=${encodeURIComponent(key)}`, 'output=json'];
  if (waypoints) params.push(`waypoints=${encodeURIComponent(waypoints)}`);
  try {
    const result = await requestJson(`https://apis.map.qq.com/ws/direction/v1/${mode}/?${params.join('&')}`);
    if (result.status !== 0) throw new Error(result.message || 'MAP_ERROR');
    const routes = ((result.result && result.result.routes) || []).slice(0, 3).map((route, index) => ({
      id: `route_${index + 1}`, distance: route.distance || 0, duration: route.duration || 0,
      polyline: route.polyline || [], steps: route.steps || [], restriction: route.restriction || {}
    }));
    return { ok: true, data: { routes } };
  } catch (error) {
    console.error('routePlan', error);
    return { ok: false, code: 'ROUTE_FAILED', message: '暂时无法生成路线，请稍后重试' };
  }
};
