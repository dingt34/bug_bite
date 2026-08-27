const assert = require('assert');
const cloudService = require('../miniprogram/utils/cloud-service.js');

let pageDefinition = null;
let navigatedUrl = '';
let navigatedBack = false;
let friendStatus = 'pending';
const actions = [];

global.Page = definition => { pageDefinition = definition; };
global.wx = {
  getStorageSync(key) {
    if (key === 'userInfo') return { id: 'u1', displayName: '我', mode: 'wechat_cloud' };
    return null;
  },
  setStorageSync() {},
  setNavigationBarTitle() {},
  showToast() {},
  navigateTo(options) { navigatedUrl = options.url; },
  navigateBack() { navigatedBack = true; },
  cloud: {
    init() {},
    callFunction(options) {
      actions.push(options.data.action);
      if (options.data.action === 'friends') return Promise.resolve({ result: {
        friends: [{ id: 'friend_1', displayName: '林间旅人', avatarText: '林', unreadCount: 2 }],
        requests: friendStatus === 'pending'
          ? [{ id: 'friend_2', requestId: 'request_1', displayName: '山野行者', avatarText: '山' }]
          : [],
        unreadCount: 2
      } });
      if (options.data.action === 'respondFriendRequest') {
        friendStatus = options.data.accept ? 'accepted' : 'rejected';
        return Promise.resolve({ result: { status: friendStatus } });
      }
      if (options.data.action === 'forwardPost') return Promise.resolve({ result: { message: { id: 'm1' } } });
      return Promise.resolve({ result: {} });
    }
  }
};

cloudService.resetForTests();
require('../miniprogram/pages/friends/friends.js');

function createPage() {
  return Object.assign({}, pageDefinition, {
    data: Object.assign({}, pageDefinition.data),
    setData(update) { this.data = Object.assign({}, this.data, update); }
  });
}

(async () => {
  const page = createPage();
  page.onLoad({});
  await page.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.strictEqual(page.data.friends.length, 1);
  assert.strictEqual(page.data.requests.length, 1);
  page.selectFriend({ currentTarget: { dataset: { id: 'friend_1', name: '林间旅人' } } });
  assert.ok(navigatedUrl.indexOf('/pages/friend-chat/friend-chat?id=friend_1') === 0);
  page.acceptRequest({ currentTarget: { dataset: { id: 'request_1' } } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.strictEqual(page.data.requests.length, 0);

  const forwardPage = createPage();
  forwardPage.onLoad({ mode: 'forward', postId: 'post_1' });
  await forwardPage.onShow();
  await new Promise(resolve => setTimeout(resolve, 10));
  forwardPage.selectFriend({ currentTarget: { dataset: { id: 'friend_1', name: '林间旅人' } } });
  await new Promise(resolve => setTimeout(resolve, 400));
  assert.ok(actions.indexOf('forwardPost') > -1);
  assert.strictEqual(navigatedBack, true);
  cloudService.resetForTests();
  console.log('friends page tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
