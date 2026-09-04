const cloud = require('./cloud');

function saveLocal(wxApi, tempFilePath) {
  if (!wxApi.saveFile) return Promise.resolve(tempFilePath);
  return new Promise(resolve => wxApi.saveFile({
    tempFilePath,
    success: result => resolve(result.savedFilePath || tempFilePath),
    fail: () => resolve(tempFilePath)
  }));
}

function uploadCloud(wxApi, filePath, folder) {
  if (!cloud.available() || !wxApi.cloud || !wxApi.cloud.uploadFile) return Promise.resolve('');
  const safeFolder = String(folder || 'events').replace(/[^a-zA-Z0-9/_-]/g, '-');
  const cloudPath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  return wxApi.cloud.uploadFile({ cloudPath, filePath }).then(result => result.fileID || '').catch(() => '');
}

function persistImage(wxApi, tempFilePath, folder) {
  return Promise.all([
    saveLocal(wxApi, tempFilePath),
    uploadCloud(wxApi, tempFilePath, folder)
  ]).then(result => ({ localPath: result[0], cloudFileId: result[1] }));
}

module.exports = { saveLocal, uploadCloud, persistImage };
