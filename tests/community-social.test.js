const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');
const social = require('../miniprogram/utils/community-social.js');

const calls = [];
const wxApi = {
  cloud: {
    init() {},
    callFunction(options) {
      calls.push(options.data);
      if (options.data.action === 'messages') return Promise.resolve({ result: {
        friend: { id: 'friend_1', displayName: '同行者' },
        messages: [{ id: 'm1', kind: 'text', text: '你好', createdAtTimestamp: 1000 }]
      } });
      if (options.data.action === 'sendMessage') return Promise.resolve({ result: {
        message: { id: 'm2', kind: 'text', text: options.data.text, createdAtTimestamp: 2000 }
      } });
      if (options.data.action === 'forwardPost') return Promise.resolve({ result: {
        message: { id: 'm3', kind: 'post', postId: options.data.postId, createdAtTimestamp: 3000 }
      } });
      return Promise.resolve({ result: { success: true } });
    }
  }
};

(async () => {
  cloudService.resetForTests();
  const thread = await social.getMessages(wxApi, 'friend_1');
  assert.strictEqual(thread.messages[0].text, '你好');
  assert.ok(thread.messages[0].time);
  await social.sendMessage(wxApi, 'friend_1', '一起交流防护经验');
  await social.forwardPost(wxApi, 'friend_1', 'post_1');
  assert.deepStrictEqual(calls.map(item => item.action), ['messages', 'sendMessage', 'forwardPost']);
  assert.strictEqual(calls[1].friendId, 'friend_1');
  assert.strictEqual(calls[2].postId, 'post_1');
  cloudService.resetForTests();
  console.log('community social tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
