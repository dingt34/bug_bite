const https = require('https');

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen3.7-flash';
const DEFAULT_TIMEOUT = 30000;

function endpoint(baseUrl) {
  const base = String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
  const url = new URL(base.endsWith('/chat/completions') ? base : base + '/chat/completions');
  if (url.protocol !== 'https:') throw new Error('千问 API 地址必须使用 HTTPS');
  return url;
}

function parseContent(body) {
  let payload;
  try { payload = JSON.parse(String(body || '')); } catch (_) { throw new Error('千问返回了无效数据'); }
  if (payload.error) throw new Error(String(payload.error.message || payload.error.code || '千问请求失败'));
  const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  const text = Array.isArray(content)
    ? content.map(item => typeof item === 'string' ? item : item && (item.text || item.content) || '').join('')
    : String(content || '');
  if (!text.trim()) throw new Error('千问没有返回有效内容');
  return text.trim();
}

function complete(options) {
  const url = endpoint(options.baseUrl);
  const body = JSON.stringify({
    model: String(options.model || DEFAULT_MODEL),
    messages: options.messages,
    stream: false,
    temperature: options.temperature === undefined ? 0.1 : options.temperature,
    max_tokens: options.maxTokens || 1200
  });
  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + options.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: options.timeout || DEFAULT_TIMEOUT
    }, response => {
      response.setEncoding('utf8');
      let responseBody = '';
      response.on('data', chunk => {
        responseBody += chunk;
        if (responseBody.length > 1024 * 1024) request.destroy(new Error('千问响应过大'));
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('千问 API 请求失败（HTTP ' + response.statusCode + '）'));
          return;
        }
        try { resolve(parseContent(responseBody)); } catch (error) { reject(error); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('千问响应超时')));
    request.on('error', reject);
    request.end(body);
  });
}

function parseJsonObject(content) {
  const raw = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('千问没有返回有效 JSON');
  try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) { throw new Error('千问返回的 JSON 格式无效'); }
}

module.exports = { DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_TIMEOUT, complete, parseJsonObject, parseContent, endpoint };
