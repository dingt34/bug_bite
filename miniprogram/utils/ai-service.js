const config = require('../config/cloud.js');
const cloudService = require('./cloud-service.js');

function getStatus(wxApi) {
  const available = !!(wxApi && wxApi.cloud && typeof wxApi.cloud.callFunction === 'function');
  return {
    available,
    imageAvailable: false,
    mode: 'coze',
    reason: available ? '' : '当前微信基础库不支持云函数，请升级微信后重试'
  };
}

function normalizeHistory(history) {
  return (history || []).filter(item => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-10)
    .map(item => ({ role: item.role, content: String(item.content || '').slice(0, 3000) }));
}

async function streamReply(wxApi, options) {
  const status = getStatus(wxApi);
  if (!status.available) throw new Error(status.reason);
  const message = String(options.message || '').trim();
  const history = normalizeHistory(options.history);
  const fileIds = options.fileIds || [];
  if (!message) throw new Error('请输入要咨询的内容');
  if (fileIds.length) throw new Error('当前扣子 API 尚未启用图片输入，请先使用文字描述');
  const result = await cloudService.callFunction(wxApi, config.COZE_AGENT_FUNCTION, {
    message,
    history,
    conversationId: String(options.conversationId || '')
  });
  if (!result.ok) {
    const upstreamError = result.error && result.error.message;
    throw new Error(upstreamError || '扣子 Agent 暂时不可用');
  }
  const text = String(result.text || '');
  if (options.onText) options.onText(text, text);
  if (!text.trim()) throw new Error('AI没有返回有效内容，请稍后重试');
  return text;
}

function uploadTemporaryImages(wxApi, images, onUploaded) {
  const fileIds = [];
  let sequence = Promise.resolve();
  (images || []).forEach((image, index) => {
    sequence = sequence.then(() => {
      const extensionMatch = String(image.path || '').match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
      const cloudPath = 'ai-chat/' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 8) + '.' + extension;
      return cloudService.uploadFile(wxApi, cloudPath, image.path).then(result => {
        fileIds.push(result.fileID);
        if (onUploaded) onUploaded(fileIds.slice());
      });
    });
  });
  return sequence.then(() => fileIds);
}

function deleteTemporaryImages(wxApi, fileIds) {
  return cloudService.deleteFiles(wxApi, fileIds || []).catch(() => ({ fileList: [] }));
}

module.exports = {
  getStatus,
  normalizeHistory,
  streamReply,
  uploadTemporaryImages,
  deleteTemporaryImages
};
