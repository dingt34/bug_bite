const DEFAULT_TIMEOUT = 12000;

function available() {
  return Boolean(wx.cloud && getApp().globalData.cloudReady);
}

function call(name, data = {}, options = {}) {
  if (!available()) return Promise.reject(new Error('CLOUD_UNAVAILABLE'));
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  return Promise.race([
    wx.cloud.callFunction({ name, data }).then(({ result }) => {
      if (!result || result.ok === false) {
        const error = new Error((result && result.message) || '云端服务暂不可用');
        error.code = result && result.code;
        throw error;
      }
      return result.data === undefined ? result : result.data;
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('CLOUD_TIMEOUT')), timeout))
  ]);
}

function background(name, data) {
  if (!available()) return Promise.resolve(null);
  return call(name, data).catch(error => {
    console.warn(`[cloud:${name}]`, error.code || error.message);
    return null;
  });
}

module.exports = { available, call, background };
