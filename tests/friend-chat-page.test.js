const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let navigatedUrl = '';
const messages = [{
  id: 'm1', kind: 'post', postId: 'post_1', postPreview: { text: '一次林地活动经历' },
  mine: false, createdAtTimestamp: 1000
}];

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return { id: 'u1', displayName: '我', mode: 'wechat_cloud' };
    return null;
  },
  setStorageSync() {},
  setNavigationBarTitle() {},
  stopPullDownRefresh() {},
  showToast() {},
  navigateTo(options) { navigatedUrl = options.url; },
  cloud: {
    init() {},
    callFunction(options) {
      if (options.data.action === 'messages') return Promise.resolve({ result: {
        friend: { id: 'friend_1', displayName: '林间旅人' }, messages: messages.slice()
      } });
      if (options.data.action === 'sendMessage') {
        messages.push({ id: 'm2', kind: 'text', text: options.data.text, mine: true, createdAtTimestamp: 2000 });
        return Promise.resolve({ result: { message: messages[messages.length - 1] } });
      }
      return Promise.resolve({ result: {} });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/friend-chat/friend-chat.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

(async () => {
  const page = createPage();
  page.onLoad({ id: 'friend_1', name: encodeURIComponent('林间旅人') });
  await page.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.friend.displayName, '林间旅人');
  assert.strictEqual(page.data.messages[0].kind, 'post');
  page.onInput({ detail: { value: '谢谢你的分享' } });
  page.sendMessage();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.strictEqual(page.data.messages[1].text, '谢谢你的分享');
  page.viewPost({ currentTarget: { dataset: { id: 'post_1' } } });
  assert.strictEqual(navigatedUrl, '/pages/post-detail/post-detail?id=post_1');
  cloudService.resetForTests();
  console.log('friend chat page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
