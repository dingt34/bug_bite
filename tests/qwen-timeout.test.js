const assert = require('assert');
const https = require('https');

const assistantQwen = require('../cloudfunctions/aiAssistant/qwen-client');

assert.ok(assistantQwen.DEFAULT_TIMEOUT >= 55000, 'AI助手应给千问至少55秒的响应窗口');

const originalRequest = https.request;
let capturedBody = null;
let capturedHeaders = null;

https.request = (options, onResponse) => {
  capturedHeaders = options.headers;
  const listeners = {};
  const request = {
    on(name, handler) { listeners[name] = handler; return request; },
    destroy(error) { if (listeners.error) listeners.error(error); },
    end(body) {
      capturedBody = JSON.parse(body);
      const responseListeners = {};
      const response = {
        statusCode: 200,
        setEncoding() {},
        on(name, handler) { responseListeners[name] = handler; return response; }
      };
      onResponse(response);
      process.nextTick(() => {
        responseListeners.data('data: {"choices":[{"delta":{"content":"分段"}}]}\n\n');
        responseListeners.data('data: {"choices":[{"delta":{"content":"回复"}}]}\n\n');
        responseListeners.data('data: [DONE]\n\n');
        responseListeners.end();
      });
    }
  };
  return request;
};

(async () => {
  try {
    const content = await assistantQwen.complete({
      apiKey: 'test-key',
      messages: [{ role: 'user', content: '测试' }]
    });
    assert.strictEqual(content, '分段回复');
    assert.strictEqual(capturedBody.stream, true, '千问应使用流式响应避免等待完整正文时超时');
    assert.strictEqual(capturedHeaders.Accept, 'text/event-stream');
    assert.ok(Number(capturedHeaders['X-DashScope-Wait-Timeout']) > 0, '请求应限制服务端排队等待时间');
    assert.strictEqual(assistantQwen.parseStreamContent('data: {"choices":[{"delta":{"content":"安全"}}]}\n\ndata: {"choices":[{"delta":{"content":"建议"}}]}\n\ndata: [DONE]\n\n'), '安全建议');
    console.log('qwen timeout regression tests passed');
  } finally {
    https.request = originalRequest;
  }
})().catch(error => {
  https.request = originalRequest;
  console.error(error);
  process.exitCode = 1;
});
