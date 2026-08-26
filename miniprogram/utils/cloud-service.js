const config = require('../config/cloud.js');

let initialized = false;
let initError = '';

function isConfigured() {
  return typeof config.ENV_ID === 'string' && config.ENV_ID.trim().length > 0;
}

function init(wxApi) {
  if (initialized) return { available: true, envId: config.ENV_ID };
  if (!isConfigured()) {
    initError = '尚未配置云开发环境 ID';
    return { available: false, reason: initError };
  }
  if (!wxApi || !wxApi.cloud) {
    initError = '当前微信基础库不支持云开发';
    return { available: false, reason: initError };
  }
  try {
    wxApi.cloud.init({ env: config.ENV_ID, traceUser: true });
    initialized = true;
    initError = '';
    return { available: true, envId: config.ENV_ID };
  } catch (error) {
    initError = error && error.message ? error.message : '云开发初始化失败';
    return { available: false, reason: initError };
  }
}

function getStatus() {
  return {
    configured: isConfigured(),
    available: initialized,
    envId: config.ENV_ID,
    reason: initError
  };
}

function ensureReady(wxApi) {
  const status = init(wxApi);
  if (!status.available) return Promise.reject(new Error(status.reason));
  return Promise.resolve();
}

function callFunction(wxApi, name, data) {
  return ensureReady(wxApi).then(() => wxApi.cloud.callFunction({ name, data: data || {} }))
    .then(response => response.result || {});
}

function login(wxApi, profile) {
  return callFunction(wxApi, config.LOGIN_FUNCTION, { profile });
}

function syncData(wxApi, action, snapshot) {
  return callFunction(wxApi, config.SYNC_FUNCTION, { action, snapshot });
}

function uploadFile(wxApi, cloudPath, filePath) {
  return ensureReady(wxApi).then(() => wxApi.cloud.uploadFile({ cloudPath, filePath }));
}

function resolveFileURL(wxApi, fileID) {
  if (typeof fileID !== 'string' || fileID.indexOf('cloud://') !== 0) {
    return Promise.resolve(fileID || '');
  }
  return ensureReady(wxApi)
    .then(() => wxApi.cloud.getTempFileURL({ fileList: [fileID] }))
    .then(result => {
      const file = result && result.fileList && result.fileList[0];
      return file && file.tempFileURL ? file.tempFileURL : '';
    })
    .catch(() => '');
}

function deleteFiles(wxApi, fileList) {
  if (!fileList || !fileList.length) return Promise.resolve({ fileList: [] });
  return ensureReady(wxApi).then(() => wxApi.cloud.deleteFile({ fileList }));
}

function resetForTests() {
  initialized = false;
  initError = '';
}

module.exports = {
  isConfigured,
  init,
  getStatus,
  ensureReady,
  callFunction,
  login,
  syncData,
  uploadFile,
  resolveFileURL,
  deleteFiles,
  resetForTests
};
