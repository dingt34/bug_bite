const assert = require('assert');
const privacy = require('../miniprogram/utils/privacy.js');

const snapshot = {
  userInfo: { id: 'u1', displayName: '体验用户' },
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
  },
  postComments: {
    post1: [
      { id: 'c1', authorId: 'u1', displayName: '体验用户' },
      { id: 'c2', authorId: 'u2', displayName: '其他用户' }
    ]
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
  comments: 1,
  images: 4,
  hasIdentity: true,
  hasOfflineCard: true
});
assert.deepStrictEqual(
  privacy.resolveDataKeys(['userInfo', 'plans', 'plan_p1', 'postComments', 'insectGuideCompare', 'unrelatedPreference', 'events']),
  ['userInfo', 'plans', 'plan_p1', 'postComments', 'insectGuideCompare', 'events']
);

console.log('privacy tests passed');
