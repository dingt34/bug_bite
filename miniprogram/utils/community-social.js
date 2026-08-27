const config = require('../config/cloud.js');
const cloudService = require('./cloud-service.js');
const community = require('./community.js');

function call(wxApi, action, data) {
  return cloudService.callFunction(
    wxApi,
    config.COMMUNITY_FUNCTION,
    Object.assign({ action }, data || {})
  );
}

function getAuthorCard(wxApi, postId) {
  return call(wxApi, 'authorCard', { postId });
}

function sendFriendRequest(wxApi, postId) {
  return call(wxApi, 'sendFriendRequest', { postId });
}

function getFriends(wxApi) {
  return call(wxApi, 'friends');
}

function respondFriendRequest(wxApi, requestId, accept) {
  return call(wxApi, 'respondFriendRequest', { requestId, accept: accept === true });
}

function decorateMessage(message, now) {
  return Object.assign({}, message, {
    time: community.formatRelativeTime(message.createdAtTimestamp, '', now)
  });
}

function getMessages(wxApi, friendId) {
  return call(wxApi, 'messages', { friendId }).then(result => ({
    friend: result.friend,
    messages: (result.messages || []).map(message => decorateMessage(message))
  }));
}

function sendMessage(wxApi, friendId, text) {
  return call(wxApi, 'sendMessage', { friendId, text }).then(result => ({
    message: decorateMessage(result.message)
  }));
}

function forwardPost(wxApi, friendId, postId) {
  return call(wxApi, 'forwardPost', { friendId, postId }).then(result => ({
    message: decorateMessage(result.message)
  }));
}

module.exports = {
  call,
  getAuthorCard,
  sendFriendRequest,
  getFriends,
  respondFriendRequest,
  decorateMessage,
  getMessages,
  sendMessage,
  forwardPost
};
