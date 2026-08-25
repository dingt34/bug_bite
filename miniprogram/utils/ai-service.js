const config = require('../config/cloud.js');
const cloudService = require('./cloud-service.js');

const SYSTEM_PROMPT = [
  '你是“虫咬识途”的户外节肢动物接触安全建议助手。',
  '你只能提供风险提示、一般性处理建议和就医沟通整理，不得给出确定虫种、疾病诊断或处方。',
  '先检查呼吸困难、意识异常、口唇舌喉肿胀、快速加重、大量多处蜇伤、持续出血等危险信号；存在危险信号时优先建议立即呼叫120或就近急诊。',
  '图片只能作为有限线索，必须说明无法仅凭图片确诊。回答使用简洁中文，并区分“现在做什么”“需要观察什么”“何时求助”。'
].join('\n');

function getStatus(wxApi) {
  const available = !!(wxApi && wxApi.cloud && wxApi.cloud.extend && wxApi.cloud.extend.AI);
  return {
    available,
    imageAvailable: available && !!config.AI_BOT_ID,
    mode: config.AI_BOT_ID ? 'agent' : 'model',
    reason: available ? '' : '当前微信基础库不支持云开发AI，请升级至3.7.1或更高版本'
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
  if (fileIds.length && !config.AI_BOT_ID) {
    throw new Error('发送图片前需要在 cloud.js 中配置云开发 Agent ID');
  }
  await cloudService.ensureReady(wxApi);
  const ai = wxApi.cloud.extend.AI;
  let result;
  if (config.AI_BOT_ID) {
    result = await ai.bot.sendMessage({
      data: {
        botId: config.AI_BOT_ID,
        msg: SYSTEM_PROMPT + '\n\n用户本次消息：\n' + message,
        history,
        files: fileIds
      }
    });
  } else {
    const model = ai.createModel('cloudbase');
    result = await model.streamText({
      data: {
        model: config.AI_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }]
          .concat(history)
          .concat([{ role: 'user', content: message }])
      }
    });
  }
  let text = '';
  for await (const chunk of result.textStream) {
    text += chunk;
    if (options.onText) options.onText(text, chunk);
  }
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
  SYSTEM_PROMPT,
  getStatus,
  normalizeHistory,
  streamReply,
  uploadTemporaryImages,
  deleteTemporaryImages
};
