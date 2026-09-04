function sanitizeMessage(value, mapKey) {
  let message = String(value || '').replace(/[\r\n\t]+/g, ' ').trim();
  const secrets = Array.isArray(mapKey) ? mapKey : [mapKey];
  secrets.filter(Boolean).forEach(secret => { message = message.split(String(secret)).join('[已隐藏]'); });
  message = message.replace(/([?&](?:key|apikey|sig)=)[^&\s]+/gi, '$1[已隐藏]');
  return message.slice(0, 240);
}

function readableError(error, mapKey) {
  const rawMessage = (error && error.message) || error || '';
  const message = sanitizeMessage(rawMessage, mapKey);
  const status = error && error.mapStatus;

  if (/WebserviceAPI/i.test(message)) return '腾讯地图 Key 尚未开启 WebService API。';
  if (message.indexOf('未找到地点') > -1) return message;
  if (message.indexOf('未能找到可用路线') > -1) return '未找到可用路线，请补充城市或区县名称，或更换出行方式。';
  if (message.indexOf('额度') > -1 || message.indexOf('频率') > -1) return '地图服务调用已达到限制，请稍后重试。';
  if (error && error.isMapProviderError) {
    return '腾讯地图返回' + (status !== undefined && status !== null ? '（状态码 ' + status + '）' : '') + '：' + (message || '未知错误');
  }
  if (message) return '路线服务执行失败：' + message;
  return '路线服务执行失败，但没有返回具体原因，请查看 routePlan 云函数日志。';
}

module.exports = { readableError, sanitizeMessage };
