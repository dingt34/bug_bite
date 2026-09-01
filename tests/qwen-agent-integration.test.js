const assert = require('assert');
const EventEmitter = require('events');
const Module = require('module');

const requestBodies = [];
const responses = [
  '{"candidateIds":["mosquito"],"visibleFeatures":["足部有白色环带"],"uncertainty":"仅凭照片不能确诊"}',
  '已结合知识库给出安全建议。'
];
const fakeHttps = {
  request(options, callback) {
    const request = new EventEmitter();
    request.end = body => {
      requestBodies.push(JSON.parse(body));
      const response = new EventEmitter();
      response.statusCode = 200;
      response.setEncoding = () => {};
      callback(response);
      process.nextTick(() => {
        response.emit('data', JSON.stringify({ choices: [{ message: { content: responses.shift() } }] }));
        response.emit('end');
      });
    };
    request.destroy = error => request.emit('error', error);
    return request;
  }
};
const fakeCloud = {
  DYNAMIC_CURRENT_ENV: 'test-env',
  init() {},
  async getTempFileURL() { return { fileList: [] }; }
};

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'https') return fakeHttps;
  if (request === 'wx-server-sdk') return fakeCloud;
  return originalLoad.call(this, request, parent, isMain);
};
const agent = require('../cloudfunctions/cozeAgent/index.js');
Module._load = originalLoad;

(async () => {
  const result = await agent.callQwen({
    apiKey: 'test-key',
    baseUrl: 'https://example.com/compatible-mode/v1',
    model: 'qwen3.7-flash',
    message: '被虫咬后呼吸困难，请看看这张虫体图片。',
    history: [],
    images: [{ url: 'https://example.com/insect.jpg', kind: 'insect', label: '虫体图片' }]
  });

  assert.strictEqual(requestBodies.length, 2);
  assert.strictEqual(requestBodies[0].max_tokens, 500);
  assert.ok(requestBodies[0].messages[0].content.includes('mosquito｜白纹伊蚊'));
  assert.ok(requestBodies[1].messages[0].content.includes('"objectId":"mosquito"'));
  assert.ok(requestBodies[1].messages[0].content.includes('"level":"IMMEDIATE_HELP"'));
  assert.strictEqual(result.text, '已结合知识库给出安全建议。');
  assert.deepStrictEqual(result.knowledgeObjectIds, ['mosquito']);
  assert.deepStrictEqual(result.actionLevels, [{ objectId: 'mosquito', level: 'IMMEDIATE_HELP' }]);

  console.log('qwen agent integration tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
