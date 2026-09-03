const cloud = require('wx-server-sdk');
const https = require('https');
const {
  buildPrompt,
  createSessionId,
  buildAgentRequest,
  parseSseBody
} = require('./domain.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DEFAULT_ENDPOINT = 'https://3mxs7dnchn.coze.site/stream_run';
const DEFAULT_PROJECT_ID = '7678279631425994762';
const REQUEST_TIMEOUT_MS = 25000;

function callCozeAgent(options) {
  const endpoint = new URL(options.endpoint || DEFAULT_ENDPOINT);
  if (endpoint.protocol !== 'https:') {
    return Promise.reject(new Error('扣子 API 地址必须使用 HTTPS'));
  }
  const body = JSON.stringify(buildAgentRequest(
    options.prompt,
    options.sessionId,
    options.projectId || DEFAULT_PROJECT_ID
  ));

  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: endpoint.protocol,
      hostname: endpoint.hostname,
      port: endpoint.port || 443,
      path: endpoint.pathname + endpoint.search,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + options.token,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: REQUEST_TIMEOUT_MS
    }, response => {
      response.setEncoding('utf8');
      let responseBody = '';
      response.on('data', chunk => {
        responseBody += chunk;
        if (responseBody.length > 1024 * 1024) {
          request.destroy(new Error('扣子 Agent 响应过大'));
        }
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('扣子 API 请求失败（HTTP ' + response.statusCode + '）'));
          return;
        }
        try {
          resolve(parseSseBody(responseBody));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('扣子 Agent 响应超时')));
    request.on('error', reject);
    request.end(body);
  });
}

exports.main = async event => {
  try {
    const token = String(process.env.COZE_API_TOKEN || '').trim();
    if (!token) throw new Error('云函数尚未配置 COZE_API_TOKEN');
    const wxContext = cloud.getWXContext();
    const prompt = buildPrompt(event && event.message, event && event.history);
    const sessionId = createSessionId(wxContext.OPENID, event && event.conversationId);
    const text = await callCozeAgent({
      token,
      prompt,
      sessionId,
      endpoint: process.env.COZE_API_ENDPOINT || DEFAULT_ENDPOINT,
      projectId: process.env.COZE_PROJECT_ID || DEFAULT_PROJECT_ID
    });
    return { ok: true, text };
  } catch (error) {
    console.error('cozeAgent failed', error && error.message ? error.message : error);
    return {
      ok: false,
      error: {
        code: 'COZE_AGENT_UNAVAILABLE',
        message: error && error.message ? error.message : '扣子 Agent 暂时不可用'
      }
    };
  }
};

exports.callCozeAgent = callCozeAgent;
