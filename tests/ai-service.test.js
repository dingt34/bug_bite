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
      extend: {
        AI: {
          createModel(provider) {
            assert.strictEqual(provider, 'cloudbase');
            return {
              async streamText(options) {
                assert.strictEqual(options.data.model, 'hy3');
                assert.strictEqual(options.data.messages.at(-1).content, '现在怎么办？');
                return {
                  textStream: {
                    async *[Symbol.asyncIterator]() {
                      yield '先远离';
                      yield '风险环境。';
                    }
                  }
                };
              }
            };
          }
        }
      }
    }
  };
  config.AI_BOT_ID = '';
  cloudService.resetForTests();
  const partials = [];
  const answer = await aiService.streamReply(wxApi, {
    message: '现在怎么办？',
    history: [],
    onText: text => partials.push(text)
  });
  assert.strictEqual(answer, '先远离风险环境。');
  assert.deepStrictEqual(partials, ['先远离', '先远离风险环境。']);
  await assert.rejects(
    () => aiService.streamReply(wxApi, { message: '看图片', fileIds: ['cloud://image'] }),
    /Agent ID/
  );
  cloudService.resetForTests();
  console.log('ai service tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
