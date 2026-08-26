const assert = require('assert');
const config = require('../miniprogram/config/cloud.js');
const cloudService = require('../miniprogram/utils/cloud-service.js');
const aiService = require('../miniprogram/utils/ai-service.js');

(async () => {
  const unavailable = aiService.getStatus({ cloud: {} });
  assert.strictEqual(unavailable.available, false);

  const wxApi = {
    cloud: {
      init() {},
      async callFunction(options) {
        assert.strictEqual(options.name, 'cozeAgent');
        assert.strictEqual(options.data.message, '现在怎么办？');
        assert.strictEqual(options.data.conversationId, 'conversation-1');
        return {
          result: { ok: true, text: '先远离风险环境。' }
        };
      }
    }
  };
  cloudService.resetForTests();
  const partials = [];
  const answer = await aiService.streamReply(wxApi, {
    message: '现在怎么办？',
    history: [],
    conversationId: 'conversation-1',
    onText: text => partials.push(text)
  });
  assert.strictEqual(answer, '先远离风险环境。');
  assert.deepStrictEqual(partials, ['先远离风险环境。']);
  await assert.rejects(
    () => aiService.streamReply(wxApi, { message: '看图片', fileIds: ['cloud://image'] }),
    /尚未启用图片输入/
  );
  cloudService.resetForTests();
  console.log('ai service tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
