const assert = require('assert');
const privacy = require('../miniprogram/utils/privacy.js');

const snapshot = {
  userInfo: { displayName: '体验用户' },
  plans: [{ id: 'p1' }, { id: 'p2' }],
  offlineCard: { id: 'card1' },
  events: [{
    id: 'e1',
    imageRefs: ['wxfile://usr/event.jpg', 'wxfile://usr/shared.jpg'],
    reviews: [{ imageRefs: ['wxfile://usr/review.jpg', 'wxfile://usr/shared.jpg'] }]
  }],
  posts: [{ id: 'post1', imageRefs: ['wxfile://usr/post.jpg'] }],
  postReactions: {
    post1: { collected: true },
    post2: { liked: true }
  }
};

assert.deepStrictEqual(privacy.collectImagePaths(snapshot), [
  'wxfile://usr/event.jpg',
  'wxfile://usr/shared.jpg',
  'wxfile://usr/review.jpg',
  'wxfile://usr/post.jpg'
]);
assert.deepStrictEqual(privacy.buildDataSummary(snapshot), {
  plans: 2,
  events: 1,
  posts: 1,
  collections: 1,
  images: 4,
  hasIdentity: true,
  hasOfflineCard: true
});
assert.deepStrictEqual(
  privacy.resolveDataKeys(['userInfo', 'plans', 'plan_p1', 'unrelatedPreference', 'events']),
  ['userInfo', 'plans', 'plan_p1', 'events']
);

console.log('privacy tests passed');
