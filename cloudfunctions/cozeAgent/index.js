const cloud = require('wx-server-sdk');
const https = require('https');
const {
  normalizeCloudFileIds,
  normalizeImageKinds,
  buildQwenRequest,
  parseQwenResponse
} = require('./domain.js');
const knowledgeCatalog = require('./knowledge-catalog.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen3.7-flash';
const REQUEST_TIMEOUT_MS = 25000;

function chatEndpoint(baseUrl) {
  const base = String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
  const endpoint = new URL(base.endsWith('/chat/completions') ? base : base + '/chat/completions');
  if (endpoint.protocol !== 'https:') throw new Error('千问 API 地址必须使用 HTTPS');
  return endpoint;
}

async function resolveImages(fileIds, imageKinds) {
  const safeIds = normalizeCloudFileIds(fileIds);
  if (!safeIds.length) return [];
  const kinds = normalizeImageKinds(imageKinds, safeIds.length);
  const result = await cloud.getTempFileURL({ fileList: safeIds });
  const returned = result && Array.isArray(result.fileList) ? result.fileList : [];
  return safeIds.map((fileId, index) => {
    const item = returned.find(value => value && value.fileID === fileId) || returned[index];
    const url = String(item && item.tempFileURL || '').trim();
    if (!/^https:\/\//i.test(url)) throw new Error('无法获取图片的安全临时地址');
    return { url, kind: kinds[index].kind, label: kinds[index].label };
  });
}

function callQwen(options) {
  let endpoint;
  try { endpoint = chatEndpoint(options.baseUrl); } catch (error) { return Promise.reject(error); }
  const body = JSON.stringify(buildQwenRequest({
    model: options.model,
    message: options.message,
    history: options.history,
    images: options.images,
    catalog: { version: knowledgeCatalog.VERSION, text: knowledgeCatalog.asPromptText() }
  }));

  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: endpoint.protocol,
      hostname: endpoint.hostname,
      port: endpoint.port || 443,
      path: endpoint.pathname + endpoint.search,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + options.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: REQUEST_TIMEOUT_MS
    }, response => {
      response.setEncoding('utf8');
      let responseBody = '';
      response.on('data', chunk => {
        responseBody += chunk;
        if (responseBody.length > 1024 * 1024) request.destroy(new Error('千问响应过大'));
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          let detail = '';
          try {
            const parsed = JSON.parse(responseBody);
            detail = parsed.error && (parsed.error.message || parsed.error.code) || '';
          } catch (error) { /* Do not expose raw upstream bodies. */ }
          reject(new Error('千问 API 请求失败（HTTP ' + response.statusCode + '）' + (detail ? '：' + detail : '')));
          return;
        }
        try { resolve(parseQwenResponse(responseBody)); } catch (error) { reject(error); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('千问响应超时')));
    request.on('error', reject);
    request.end(body);
  });
}

exports.main = async event => {
  try {
    const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
    if (!apiKey) throw new Error('云函数尚未配置 DASHSCOPE_API_KEY');
    const images = await resolveImages(event && event.fileIds, event && event.imageKinds);
    const text = await callQwen({
      apiKey,
      baseUrl: process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      message: event && event.message,
      history: event && event.history,
      images
    });
    return {
      ok: true,
      text,
      provider: 'qwen',
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      imageCount: images.length,
      knowledgeVersion: knowledgeCatalog.VERSION
    };
  } catch (error) {
    console.error('ai agent failed:', error && error.message ? error.message : 'unknown error');
    return {
      ok: false,
      error: {
        code: 'AI_AGENT_UNAVAILABLE',
        message: error && error.message ? error.message : 'AI建议暂时不可用'
      }
    };
  }
};

exports.callQwen = callQwen;
exports.chatEndpoint = chatEndpoint;
exports.resolveImages = resolveImages;
